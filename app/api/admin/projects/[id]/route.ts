/**
 * API Route: Admin Project Management (Single Project)
 * PUT /api/admin/projects/[id] - Update project
 * DELETE /api/admin/projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminService, createAuditLog } from '@/lib/domains/admin/service';
import { Database } from '@/lib/types/database.types';

type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use admin client to bypass RLS (admin auth already verified above)
    const adminSupabase = createAdminClient();

    // Get existing project for audit log
    const { data: existingProject } = await adminSupabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body: ProjectUpdate = await request.json();

    // Update project - Only update fields provided in the request
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    const fieldsToUpdate = [
      'name', 'slug', 'description', 'location', 'country', 'latitude', 'longitude',
      'funding_goal', 'current_funding', 'min_investment', 'token_price',
      'total_tokens', 'available_tokens', 'expected_return_percentage',
      'project_duration_months', 'start_date', 'expected_completion_date',
      'status', 'images', 'documents', 'video_url', 'mint_address',
      'mint_authority_revoked', 'is_paused', 'blockchain_signature', 'blockchain_project_id',
      'asset_type', 'round_limit_tokens', 'current_round_issued', 'distribution_cadence',
      'token_decimals', 'accepted_stablecoin', 'treasury_wallet'
    ];

    fieldsToUpdate.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updateData[field] = (body as any)[field];
      }
    });

    const { data: project, error } = await adminSupabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[AdminAPI] Database Update Error:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    if (!project) {
      console.warn('[AdminAPI] Update succeeded but no data returned for ID:', id);
      return NextResponse.json({ error: 'Update succeeded but returned no data' }, { status: 500 });
    }

    // Audit log - Safe access to project name
    const projectName = project.name || existingProject.name || 'Unknown Project';
    
    try {
      await createAuditLog({
        eventType: 'admin_action',
        userId: user.id,
        actorRole: 'admin',
        description: `Updated project: ${projectName}`,
        previousState: existingProject,
        newState: project,
        metadata: {
          projectId: project.id,
          projectName: projectName,
          action: 'update_project',
        },
      });
    } catch (auditError) {
      console.error('[AdminAPI] Audit Log Failed (Optional):', auditError);
      // Don't fail the whole request if just the audit log fails
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get existing project for audit log
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use admin client to bypass RLS (admin auth already verified above)
    const adminSupabase = createAdminClient();

    // Delete project
    const { error } = await adminSupabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await createAuditLog({
      eventType: 'admin_action',
      userId: user.id,
      actorRole: 'admin',
      description: `Deleted project: ${existingProject.name}`,
      previousState: existingProject,
      metadata: {
        projectId: existingProject.id,
        projectName: existingProject.name,
        action: 'delete_project',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
