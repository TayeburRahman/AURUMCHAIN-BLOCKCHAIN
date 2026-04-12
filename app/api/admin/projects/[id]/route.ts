/**
 * API Route: Admin Project Management (Single Project)
 * PUT /api/admin/projects/[id] - Update project
 * DELETE /api/admin/projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    // Get existing project for audit log
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body: ProjectUpdate = await request.json();

    // Update project
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        location: body.location,
        country: body.country,
        latitude: body.latitude,
        longitude: body.longitude,
        funding_goal: body.funding_goal,
        current_funding: body.current_funding,
        min_investment: body.min_investment,
        token_price: body.token_price,
        total_tokens: body.total_tokens,
        available_tokens: body.available_tokens,
        expected_return_percentage: body.expected_return_percentage,
        project_duration_months: body.project_duration_months,
        start_date: body.start_date,
        expected_completion_date: body.expected_completion_date,
        status: body.status,
        images: body.images,
        documents: body.documents,
        video_url: body.video_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await createAuditLog({
      eventType: 'admin_action',
      userId: user.id,
      actorRole: 'admin',
      description: `Updated project: ${project.name}`,
      previousState: existingProject,
      newState: project,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        action: 'update_project',
      },
    });

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

    // Delete project
    const { error } = await supabase
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
