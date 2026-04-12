/**
 * Admin service - handles audit logging and admin operations
 */

import { createClient } from '@/lib/supabase/server';
import type { AuditLog, CreateAuditLogInput, UserRoleModel } from './models';
import type { UserRole } from '../shared/types';

export class AdminService {
  /**
   * Check if user has a specific role
   */
  static async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', role)
      .is('revoked_at', null)
      .single();

    return !!data;
  }

  /**
   * Check if user is admin (any admin role)
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .in('role', ['admin', 'compliance_officer', 'super_admin'])
      .is('revoked_at', null)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  /**
   * Get all roles for a user
   */
  static async getUserRoles(userId: string): Promise<UserRoleModel[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null);

    return (data || []) as UserRoleModel[];
  }

  /**
   * Grant role to user
   */
  static async grantRole(
    userId: string,
    role: UserRole,
    grantedBy: string
  ): Promise<UserRoleModel> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await createAuditLog({
      eventType: 'admin_action',
      userId,
      actorId: grantedBy,
      actorRole: 'admin',
      description: `Role ${role} granted to user`,
      metadata: { role },
    });

    return data as UserRoleModel;
  }

  /**
   * Revoke role from user
   */
  static async revokeRole(
    userId: string,
    role: UserRole,
    revokedBy: string
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('user_roles')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('role', role)
      .is('revoked_at', null);

    // Audit log
    await createAuditLog({
      eventType: 'admin_action',
      userId,
      actorId: revokedBy,
      actorRole: 'admin',
      description: `Role ${role} revoked from user`,
      metadata: { role },
    });
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      event_type: input.eventType,
      user_id: input.userId,
      actor_id: input.actorId,
      actor_role: input.actorRole,
      description: input.description,
      metadata: input.metadata || {},
      previous_state: input.previousState,
      new_state: input.newState,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      request_id: input.requestId,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create audit log:', error);
    throw error;
  }

  return data as AuditLog;
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  return (data || []) as AuditLog[];
}
