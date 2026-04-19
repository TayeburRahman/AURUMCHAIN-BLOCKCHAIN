/**
 * Supabase Mock Utility for Jest
 * 
 * Provides a chainable mock for Supabase database operations.
 */

export const mockSupabaseData = {
  data: null as any,
  error: null as any,
};

export const supabaseMock = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(() => Promise.resolve({ data: mockSupabaseData.data, error: mockSupabaseData.error })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
  },
};

/**
 * Helper to reset the mock state
 */
export const resetSupabaseMock = (data: any = null, error: any = null) => {
  mockSupabaseData.data = data;
  mockSupabaseData.error = error;
  jest.clearAllMocks();
};
