import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ProjectRegistryService } from '@/lib/web3/services/projectRegistryService';
import { getProjectPDA } from '@/lib/web3/utils/pdaHelpers';

import { PROJECT_REGISTRY_PROGRAM_ID } from '@/lib/web3/utils/programDiscoverer';

/**
 * useProjectRegistry
 * 
 * Reactive hook to fetch and watch on-chain project data.
 */
export function useProjectRegistry(projectId?: number) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    if (projectId === undefined) return;
    
    setLoading(true);
    try {
      const service = new ProjectRegistryService(connection, wallet);
      const data = await service.fetchProject(projectId);
      setProject(data);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, projectId]);

  // Initial fetch and account watching
  useEffect(() => {
    if (projectId === undefined) return;

    fetchProject();

    // Listen for account changes on-chain for real-time updates
    const pda = getProjectPDA(projectId, PROJECT_REGISTRY_PROGRAM_ID);

    const subscriptionId = connection.onAccountChange(
      pda,
      () => {
        console.log(`[useProjectRegistry] On-chain update detected for project ${projectId}`);
        fetchProject();
      },
      'confirmed'
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [projectId, connection, wallet, fetchProject]);

  return {
    project,
    loading,
    error,
    refresh: fetchProject
  };
}
