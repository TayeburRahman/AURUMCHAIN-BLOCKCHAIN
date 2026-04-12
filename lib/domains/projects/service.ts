/**
 * Projects service - handles mining projects and offerings
 */

import { createClient } from '@/lib/supabase/server';
import type { Project, Offering } from './models';
import type { ProjectStatus } from '../shared/types';

export class ProjectsService {
  /**
   * Get all active projects
   */
  static async getActiveProjects(): Promise<Project[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['funding', 'funded', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Project[];
  }

  /**
   * Get project by ID
   */
  static async getProject(id: string): Promise<Project | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return data as Project;
  }

  /**
   * Get project by slug
   */
  static async getProjectBySlug(slug: string): Promise<Project | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;

    return data as Project;
  }

  /**
   * Get offering for project
   */
  static async getOfferingForProject(projectId: string): Promise<Offering | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('offerings')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .eq('is_closed', false)
      .single();

    if (error || !data) return null;

    return data as Offering;
  }

  /**
   * Check if project is accepting investments
   */
  static async isAcceptingInvestments(projectId: string): Promise<boolean> {
    const project = await this.getProject(projectId);
    if (!project) return false;

    const offering = await this.getOfferingForProject(projectId);
    if (!offering) return false;

    const now = new Date();
    const offeringStart = new Date(offering.offeringStartDate);
    const offeringEnd = new Date(offering.offeringEndDate);

    return (
      project.status === 'funding' &&
      offering.isActive &&
      !offering.isClosed &&
      offering.availableTokens > 0 &&
      now >= offeringStart &&
      now <= offeringEnd
    );
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', projectId);
  }
}
