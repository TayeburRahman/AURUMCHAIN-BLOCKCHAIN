/**
 * API Route: Admin Projects Management
 * POST /api/admin/projects - Create new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminService, createAuditLog } from '@/lib/domains/admin/service';
import { Database } from '@/lib/types/database.types';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // securely verify role via business logic
    const isAdmin = await AdminService.isAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: ProjectInsert = await request.json();

    // Use admin client to bypass physical postgres RLS blocks since business logic has already vetted the actor
    const adminSupabase = createAdminClient();

    // Create project
    const { data: project, error } = await adminSupabase
      .from('projects')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        location: body.location,
        country: body.country,
        latitude: body.latitude,
        longitude: body.longitude,
        funding_goal: body.funding_goal,
        current_funding: body.current_funding || 0,
        min_investment: body.min_investment || 1000,
        token_price: body.token_price,
        total_tokens: body.total_tokens,
        available_tokens: body.available_tokens,
        expected_return_percentage: body.expected_return_percentage,
        project_duration_months: body.project_duration_months,
        start_date: body.start_date,
        expected_completion_date: body.expected_completion_date,
        status: body.status || 'draft',
        images: body.images,
        documents: body.documents,
        video_url: body.video_url,
        // Phased Token fields
        asset_type:             body.asset_type || 'real_estate',
        round_limit_tokens:     body.round_limit_tokens || 0,
        current_round_issued:   0,
        distribution_cadence:   body.distribution_cadence || 0,
        distribution_mode:      body.distribution_mode || 0,
        token_decimals:         body.token_decimals || 9,
        accepted_stablecoin:    body.accepted_stablecoin,
        treasury_wallet:        body.treasury_wallet,
        // Metadata Fallback fields (Supabase Persistence)
        token_symbol:           (body as any).token_symbol,
        metadata_uri:           (body as any).metadata_uri,
        lockup_end_date:        (body as any).lockup_end_date ? new Date((body as any).lockup_end_date).toISOString() : null,
        // Blockchain linkage — store so we can fetch on-chain data later
        blockchain_signature:   body.blockchain_signature   ?? null,
        blockchain_project_id:  body.blockchain_project_id  ?? null,
        mint_address:           (body as any).mint_address  ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await createAuditLog({
      eventType: 'admin_action',
      userId: user.id,
      actorRole: 'admin',
      description: `Created new project: ${project.name}`,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        action: 'create_project',
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
