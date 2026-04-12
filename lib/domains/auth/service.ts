/**
 * Authentication service - handles user authentication with audit logging
 */

import { createClient } from '@/lib/supabase/server';
import { createAuditLog } from '../admin/service';

export class AuthService {
  /**
   * Log user signup event
   */
  static async logSignup(userId: string, email: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await createAuditLog({
        eventType: 'account_created' as any, // We'll add this event type to the enum later
        userId,
        actorRole: 'user',
        description: `New account created for ${email}`,
        metadata: {
          email,
          signupMethod: 'email',
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log signup event:', error);
      // Don't throw - audit logging failure shouldn't block signup
    }
  }

  /**
   * Log user login event
   */
  static async logLogin(userId: string, email: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await createAuditLog({
        eventType: 'account_login' as any, // We'll add this event type to the enum later
        userId,
        actorRole: 'user',
        description: `User logged in: ${email}`,
        metadata: {
          email,
          loginMethod: 'email',
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log login event:', error);
      // Don't throw - audit logging failure shouldn't block login
    }
  }

  /**
   * Log user logout event
   */
  static async logLogout(userId: string, email: string): Promise<void> {
    try {
      await createAuditLog({
        eventType: 'account_logout' as any, // We'll add this event type to the enum later
        userId,
        actorRole: 'user',
        description: `User logged out: ${email}`,
        metadata: {
          email,
        },
      });
    } catch (error) {
      console.error('Failed to log logout event:', error);
      // Don't throw - audit logging failure shouldn't block logout
    }
  }

  /**
   * Log OAuth signup/login event
   */
  static async logOAuthEvent(
    userId: string,
    email: string,
    provider: string,
    eventType: 'signup' | 'login'
  ): Promise<void> {
    try {
      await createAuditLog({
        eventType: eventType === 'signup' ? ('account_created' as any) : ('account_login' as any),
        userId,
        actorRole: 'user',
        description: `User ${eventType} via ${provider}: ${email}`,
        metadata: {
          email,
          provider,
          authMethod: 'oauth',
        },
      });
    } catch (error) {
      console.error(`Failed to log OAuth ${eventType} event:`, error);
      // Don't throw - audit logging failure shouldn't block auth
    }
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLogin(email: string, reason: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await createAuditLog({
        eventType: 'account_login_failed' as any, // We'll add this event type to the enum later
        actorRole: undefined,
        description: `Failed login attempt for ${email}: ${reason}`,
        metadata: {
          email,
          reason,
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log failed login attempt:', error);
      // Don't throw - audit logging failure shouldn't block error handling
    }
  }

  /**
   * Get user's authentication history
   */
  static async getUserAuthHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const supabase = await createClient();

      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .in('event_type', ['account_login', 'account_logout', 'account_created'])
        .order('timestamp', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Failed to get user auth history:', error);
      return [];
    }
  }
}
