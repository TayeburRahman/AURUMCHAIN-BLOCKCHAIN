'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database.types';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

interface ProjectsManagementProps {
  initialProjects: Project[];
  userId: string;
}

export default function ProjectsManagement({ initialProjects, userId }: ProjectsManagementProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState<string | null>(null); // tracks which project is being updated

  // Form state
  const [formData, setFormData] = useState<Partial<ProjectInsert> & {
    token_symbol?: string;
    metadata_uri?: string;
    accepted_stablecoin?: string;
    treasury_wallet?: string;
    lockup_end_date?: string;
    distribution_cadence?: number;
  }>({
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
    token_symbol: '',
    metadata_uri: '',
    accepted_stablecoin: process.env.NEXT_PUBLIC_USDC_MINT || '',
    treasury_wallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
    lockup_end_date: '',
    distribution_cadence: 0,
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
        name === 'project_duration_months' ||
        name === 'distribution_cadence'
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
    if (loading) return; // Prevent double-clicks causing concurrent Phantom popups
    setLoading(true);
    setError(null);

    try {
      if (!wallet.connected) {
        throw new Error("Admin wallet is not connected. Please connect your Phantom wallet to sign the transaction.");
      }

      // Step 1: Blockchain — create NEW project on-chain, or UPDATE params for existing chain-linked project
      const service = new ProjectRegistryService(connection, wallet);

      if (!editingProject) {
        // ── CREATE ──
        try {
          const chainResult = await service.createProjectWithMint({
            name: formData.name || 'Unnamed Project',
            symbol: formData.token_symbol || 'TKN',
            uri: formData.metadata_uri || 'https://metadata.placeholder',
            supplyCap: formData.total_tokens || 1000000,
            minInvestmentUsdc: formData.min_investment || 100,
            maxInvestmentUsdc: formData.funding_goal || 1_000_000,
            acceptedStablecoin: new PublicKey(formData.accepted_stablecoin || process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            treasuryWallet: new PublicKey(formData.treasury_wallet || wallet.publicKey!.toBase58()),
            lockupEndTs: Math.floor(new Date(formData.lockup_end_date || Date.now()).getTime() / 1000),
            subscriptionStart: Math.floor(new Date(formData.start_date || Date.now()).getTime() / 1000),
            subscriptionEnd: Math.floor(new Date(formData.expected_completion_date || Date.now() + 86400000).getTime() / 1000),
            distributionCadence: formData.distribution_cadence || 0,
          });
          
          formData.blockchain_signature  = chainResult.signature;
          (formData as any).blockchain_project_id = chainResult.projectId;
          (formData as any).mint_address = chainResult.mintAddress;
        } catch (chainErr: any) {
          throw new Error('Blockchain Transaction Failed: ' + chainErr.message);
        }
      } else if (editingProject.blockchain_project_id !== null && editingProject.blockchain_project_id !== undefined) {
        // ── UPDATE on-chain params ──
        try {
          const chainUpdateParams: any = {};
          if (formData.min_investment !== undefined && formData.min_investment !== null)
            chainUpdateParams.minInvestmentUsdc = new BN(Math.round((formData.min_investment || 0) * 1_000_000));
          if (formData.funding_goal !== undefined && formData.funding_goal !== null)
            chainUpdateParams.maxInvestmentUsdc = new BN(Math.round((formData.funding_goal || 0) * 1_000_000));
          if (formData.start_date)
            chainUpdateParams.subscriptionStart = new BN(Math.floor(new Date(formData.start_date).getTime() / 1000));
          if (formData.expected_completion_date)
            chainUpdateParams.subscriptionEnd = new BN(Math.floor(new Date(formData.expected_completion_date).getTime() / 1000));
          if ((formData as any).lockup_end_date)
            chainUpdateParams.lockupEndTs = new BN(Math.floor(new Date((formData as any).lockup_end_date).getTime() / 1000));
          if (formData.distribution_cadence !== undefined && formData.distribution_cadence !== null)
            chainUpdateParams.distributionCadence = formData.distribution_cadence;

          if (Object.keys(chainUpdateParams).length > 0) {
            await service.updateProject(editingProject.blockchain_project_id, chainUpdateParams);
          }
        } catch (chainErr: any) {
          throw new Error('On-Chain Update Failed: ' + chainErr.message);
        }
      }

      // Step 2: Save metadata to Supabase
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
        throw new Error(data.error || 'Failed to save project to off-chain DB');
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

  // ── Realtime subscription: keep admin list in sync with Supabase changes ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-projects-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects((prev) => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProjects((prev) =>
              prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as any) : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setProjects((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
      token_symbol: '',
      metadata_uri: '',
      accepted_stablecoin: process.env.NEXT_PUBLIC_USDC_MINT || '',
      treasury_wallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
      lockup_end_date: '',
      distribution_cadence: 0,
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
      token_symbol: '',
      metadata_uri: '',
      accepted_stablecoin: process.env.NEXT_PUBLIC_USDC_MINT || '',
      treasury_wallet: process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
      lockup_end_date: '',
      distribution_cadence: 0,
    });
    setEditingProject(null);
    setError(null);
  };

  // ── Quick status change without opening the full edit form ────────────────
  const handleStatusChange = async (projectId: string, newStatus: Project['status']) => {
    setStatusChanging(projectId);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
      // Optimistic update (realtime will also sync)
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusChanging(null);
    }
  };

  // ── On-chain boolean toggles (pause/resume/activate) ─────────────────────
  const handleChainToggle = async (
    project: Project,
    action: 'pauseInvestments' | 'resumeInvestments' | 'pauseTransfers' | 'resumeTransfers' | 'activate' | 'deactivate' | 'revokeMintAuthority'
  ) => {
    if (project.blockchain_project_id === null || project.blockchain_project_id === undefined) {
      setError('This project has no on-chain record.'); return;
    }
    if (!wallet.connected) { setError('Connect your Phantom wallet first.'); return; }
    if (statusChanging) return;
    
    setStatusChanging(project.id);
    try {
      const service = new ProjectRegistryService(connection, wallet);
      
      // Special case: Revoke is its own instruction
      if (action === 'revokeMintAuthority') {
        if (!confirm('WARNING: Revoking mint authority is irreversible. You will not be able to issue any more tokens for this project. PROCEED?')) {
          setStatusChanging(null);
          return;
        }
        const signature = await service.revokeMintAuthority(project.blockchain_project_id);
        
        await fetch(`/api/admin/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mint_authority_revoked: true }),
        });
        
        alert(`Success! Mint authority revoked.\nTX: ${signature}`);
        return;
      }

      // 1. Fetch current on-chain state to avoid overwriting flags
      const currentAccount = await service.fetchProject(project.blockchain_project_id);
      if (!currentAccount) throw new Error("Could not fetch on-chain project state.");

      let newIsActive = currentAccount.isActive;
      let newIsPaused = currentAccount.isPaused;

      // 2. Determine new state based on action
      // Note: we now use a smart toggle. If we trigger any pause action, it flips the current state.
      if (action === 'pauseInvestments' || action === 'pauseTransfers') {
        newIsPaused = !currentAccount.isPaused; 
      } else if (action === 'resumeInvestments' || action === 'resumeTransfers') {
        newIsPaused = false;
      } else if (action === 'activate') {
        newIsActive = true;
      } else if (action === 'deactivate') {
        newIsActive = false;
      }

      // 3. Perform atomic update
      const signature = await service.updateProjectStatus(
        project.blockchain_project_id,
        newIsActive,
        newIsPaused
      );

      console.log(`[StatusUpdate] Project ${project.id} updated. TX: ${signature}`);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusChanging(null);
    }
  };

  const handleSetMint = async (project: Project) => {
    const mintAddress = prompt('Enter the SPL Token Mint Address for this project:');
    if (!mintAddress || !project.blockchain_project_id) return;

    try {
      new PublicKey(mintAddress); // Validate pubkey format
    } catch (e) {
      alert('Invalid Solana address format.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const service = new ProjectRegistryService(connection, wallet);
      const signature = await service.setProjectMint(
        project.blockchain_project_id,
        new PublicKey(mintAddress)
      );

      // Sync with Supabase
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint_address: mintAddress }),
      });

      if (!response.ok) throw new Error('On-chain success, but failed to update Supabase.');

      alert(`Success! Project mint set to: ${mintAddress}\nTX: ${signature}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-300">
          <span><span className="font-medium">{projects.length}</span> projects total</span>
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </span>
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Symbol (Max 10) *
                </label>
                <input
                  type="text"
                  name="token_symbol"
                  value={formData.token_symbol || ''}
                  onChange={handleInputChange}
                  maxLength={10}
                  required
                  placeholder="e.g. TPA"
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Program Requirements */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Accepted Stablecoin (Mint Address) *
                </label>
                <input
                  type="text"
                  name="accepted_stablecoin"
                  value={formData.accepted_stablecoin || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Treasury Wallet Address *
                </label>
                <input
                  type="text"
                  name="treasury_wallet"
                  value={formData.treasury_wallet || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Metadata URL (Arweave/Pinata)
                </label>
                <input
                  type="url"
                  name="metadata_uri"
                  value={formData.metadata_uri || ''}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lock-up End Date
                </label>
                <input
                  type="datetime-local"
                  name="lockup_end_date"
                  value={formData.lockup_end_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Distribution Cadence
                </label>
                <select
                  name="distribution_cadence"
                  value={formData.distribution_cadence}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-navy/50 border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  <option value={0}>Monthly</option>
                  <option value={1}>Quarterly</option>
                  <option value={2}>Bi-Annually</option>
                  <option value={3}>Annually</option>
                </select>
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
                      ${((project.current_funding ?? 0) / 1000).toFixed(0)}k / ${((project.funding_goal ?? 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tokens:</span>
                    <span className="text-white font-medium ml-2">
                      {(project.available_tokens ?? 0).toLocaleString()} / {(project.total_tokens ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Return:</span>
                    <span className="text-white font-medium ml-2">
                      {project.expected_return_percentage ?? '—'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-white font-medium ml-2">
                      {project.project_duration_months ?? '—'} months
                    </span>
                  </div>
                </div>
                {/* Blockchain badge */}
                {project.blockchain_signature && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30">⛓ On-Chain</span>
                    <a
                      href={`https://explorer.solana.com/tx/${project.blockchain_signature}?cluster=devnet`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-gold underline underline-offset-2"
                    >
                      Tx: {project.blockchain_signature.slice(0, 12)}…
                    </a>

                    {/* Mint Address Link */}
                    {(project as any).mint_address && (
                      <a
                        href={`https://solscan.io/token/${(project as any).mint_address}?cluster=devnet`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gold flex items-center gap-1 group transition-colors"
                      >
                        <span className="text-gold opacity-60 group-hover:opacity-100">💎</span>
                        <span className="underline underline-offset-2">Mint: {(project as any).mint_address.slice(0, 8)}…</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4 items-end">
                {/* Quick status changer */}
                <select
                  id={`status-${project.id}`}
                  value={project.status}
                  disabled={statusChanging === project.id}
                  onChange={(e) => handleStatusChange(project.id, e.target.value as Project['status'])}
                  className="px-3 py-1.5 bg-navy/80 border border-gold/20 rounded-lg text-xs text-white focus:outline-none focus:border-gold transition-colors disabled:opacity-50 cursor-pointer"
                  title="Change project status"
                >
                  <option value="draft">Draft</option>
                  <option value="funding">Funding</option>
                  <option value="active">Active</option>
                  <option value="funded">Funded</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* On-chain toggle buttons — only shown for chain-linked projects */}
                {project.blockchain_project_id !== null && project.blockchain_project_id !== undefined && (
                  <div className="flex gap-1 flex-wrap justify-end">
                    <button
                      title="Toggle project operations (Pause/Resume everything)"
                      disabled={statusChanging === project.id}
                      onClick={() => handleChainToggle(
                        project,
                        /* We check current state in handleChainToggle, so we just need a generic toggle intent here */
                        'pauseInvestments' 
                      )}
                      className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-40 border border-orange-500/30"
                    >
                      ⏸ Pause/Resume Project
                    </button>

                    {/* Set Mint Button */}
                    {!(project as any).mint_address && (
                      <button
                        title="Link an SPL Token Mint to this project"
                        disabled={loading || statusChanging === project.id}
                        onClick={() => handleSetMint(project)}
                        className="px-2 py-1 rounded text-xs font-bold bg-gold text-navy hover:bg-gold-light transition-all disabled:opacity-50"
                      >
                        💎 Set Mint
                      </button>
                    )}

                    {/* Revoke Mint Authority (Danger Zone) */}
                    {(project as any).mint_address && !(project as any).mint_authority_revoked && (
                      <button
                        title="IRREVERSIBLE: Stop all future issuance"
                        disabled={statusChanging === project.id}
                        onClick={() => handleChainToggle(project, 'revokeMintAuthority' as any)}
                        className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-40"
                      >
                        🚫 Revoke Auth
                      </button>
                    )}

                    {/* Revoked Status Indicator */}
                    {(project as any).mint_authority_revoked && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/5 text-gray-500 border border-white/10 uppercase tracking-tighter">
                        Mint Locked
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm"
                  >
                    Delete
                  </button>
                </div>
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
