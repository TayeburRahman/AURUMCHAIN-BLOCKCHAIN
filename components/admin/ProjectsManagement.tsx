'use client';

import { useState } from 'react';
import { Database } from '@/lib/types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

interface ProjectsManagementProps {
  initialProjects: Project[];
  userId: string;
}

export default function ProjectsManagement({ initialProjects, userId }: ProjectsManagementProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ProjectInsert>>({
    name: '',
    slug: '',
    description: '',
    location: '',
    country: '',
    funding_goal: 0,
    current_funding: 0,
    min_investment: 1000,
    token_price: 1,
    total_tokens: 0,
    available_tokens: 0,
    expected_return_percentage: 0,
    project_duration_months: 12,
    status: 'draft',
    images: [],
    documents: [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'funding_goal' ||
        name === 'current_funding' ||
        name === 'min_investment' ||
        name === 'token_price' ||
        name === 'total_tokens' ||
        name === 'available_tokens' ||
        name === 'expected_return_percentage' ||
        name === 'project_duration_months'
          ? parseFloat(value) || 0
          : value,
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim());
    setFormData((prev) => ({ ...prev, images: urls }));
  };

  const handleDocumentUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim());
    setFormData((prev) => ({ ...prev, documents: urls }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingProject
        ? `/api/admin/projects/${editingProject.id}`
        : '/api/admin/projects';

      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save project');
      }

      const savedProject = await response.json();

      if (editingProject) {
        setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
      } else {
        setProjects([savedProject, ...projects]);
      }

      resetForm();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      slug: project.slug,
      description: project.description,
      location: project.location,
      country: project.country,
      funding_goal: project.funding_goal,
      current_funding: project.current_funding,
      min_investment: project.min_investment,
      token_price: project.token_price,
      total_tokens: project.total_tokens,
      available_tokens: project.available_tokens,
      expected_return_percentage: project.expected_return_percentage,
      project_duration_months: project.project_duration_months,
      status: project.status,
      images: project.images,
      documents: project.documents,
      video_url: project.video_url,
      latitude: project.latitude,
      longitude: project.longitude,
      start_date: project.start_date,
      expected_completion_date: project.expected_completion_date,
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      location: '',
      country: '',
      funding_goal: 0,
      current_funding: 0,
      min_investment: 1000,
      token_price: 1,
      total_tokens: 0,
      available_tokens: 0,
      expected_return_percentage: 0,
      project_duration_months: 12,
      status: 'draft',
      images: [],
      documents: [],
    });
    setEditingProject(null);
    setError(null);
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-gray-300">
          <span className="font-medium">{projects.length}</span> projects total
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
        >
          {showForm ? 'Cancel' : '+ Add New Project'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Project Form */}
      {showForm && (
        <div className="mb-8 glass rounded-xl p-6 border border-gold/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editingProject ? 'Edit Project' : 'Add New Project'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug (auto-generated)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>

            {/* Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Ashanti Region"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Ghana"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Funding Goal ($) *
                </label>
                <input
                  type="number"
                  name="funding_goal"
                  value={formData.funding_goal}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Funding ($)
                </label>
                <input
                  type="number"
                  name="current_funding"
                  value={formData.current_funding}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Investment ($) *
                </label>
                <input
                  type="number"
                  name="min_investment"
                  value={formData.min_investment}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Token Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Price ($) *
                </label>
                <input
                  type="number"
                  name="token_price"
                  value={formData.token_price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Tokens *
                </label>
                <input
                  type="number"
                  name="total_tokens"
                  value={formData.total_tokens}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Tokens *
                </label>
                <input
                  type="number"
                  name="available_tokens"
                  value={formData.available_tokens}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Return (%)
                </label>
                <input
                  type="number"
                  name="expected_return_percentage"
                  value={formData.expected_return_percentage || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (months)
                </label>
                <input
                  type="number"
                  name="project_duration_months"
                  value={formData.project_duration_months || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  <option value="draft">Draft</option>
                  <option value="funding">Funding</option>
                  <option value="funded">Funded</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image URLs (one per line)
              </label>
              <textarea
                value={formData.images?.join('\n') || ''}
                onChange={handleImageUrlsChange}
                rows={3}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Enter full URLs to project images</p>
            </div>

            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document URLs (one per line)
              </label>
              <textarea
                value={formData.documents?.join('\n') || ''}
                onChange={handleDocumentUrlsChange}
                rows={3}
                placeholder="https://example.com/document1.pdf&#10;https://example.com/document2.pdf"
                className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Enter full URLs to project documents (PDFs, etc.)</p>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video URL (YouTube, Vimeo, etc.)
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url || ''}
                onChange={handleInputChange}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-6 py-3 glass rounded-lg border border-gold/20 text-gray-300 hover:text-gold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="glass rounded-xl p-6 border border-gold/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{project.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      project.status === 'funding'
                        ? 'bg-gold/20 text-gold'
                        : project.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : project.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{project.location}, {project.country}</p>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Funding:</span>
                    <span className="text-white font-medium ml-2">
                      ${(project.current_funding / 1000).toFixed(0)}k / ${(project.funding_goal / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tokens:</span>
                    <span className="text-white font-medium ml-2">
                      {project.available_tokens.toLocaleString()} / {project.total_tokens.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Return:</span>
                    <span className="text-white font-medium ml-2">
                      {project.expected_return_percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-white font-medium ml-2">
                      {project.project_duration_months} months
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(project)}
                  className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="glass rounded-xl p-12 border border-gold/20 text-center">
            <p className="text-gray-400">No projects yet. Create your first project above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
