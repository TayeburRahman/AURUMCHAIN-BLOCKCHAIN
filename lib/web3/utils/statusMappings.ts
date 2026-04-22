/**
 * Status Mappings Utility
 * 
 * Translates between Supabase/Frontend string representation and 
 * Anchor/Blockchain enum object representation.
 */

/**
 * Maps a Supabase status string to an Anchor-compatible ProjectStatus object.
 */
export const toChainStatus = (dbStatus: string): any => {
  const status = dbStatus.toLowerCase();
  if (status === 'draft') return { draft: {} };
  if (status === 'funding') return { funding: {} };
  if (status === 'active') return { active: {} };
  if (status === 'completed') return { completed: {} };
  if (status === 'canceled' || status === 'cancelled') return { canceled: {} };
  return { draft: {} };
};

/**
 * Maps an Anchor ProjectStatus object to a Supabase-compatible string.
 */
export const fromChainStatus = (chainStatus: any): string => {
  if (chainStatus.draft)     return 'draft';
  if (chainStatus.funding)   return 'funding';
  if (chainStatus.active)    return 'active';
  if (chainStatus.completed) return 'completed';
  if (chainStatus.canceled)  return 'canceled';
  return 'draft';
};

/**
 * Maps a Supabase asset_type string to an Anchor-compatible AssetType object.
 */
export const toChainAssetType = (dbType: string): any => {
  switch (dbType.toLowerCase()) {
    case 'real_estate': return { realEstate: {} };
    case 'mining':      return { mining: {} };
    case 'other':       return { other: {} };
    default:            return { realEstate: {} };
  }
};
