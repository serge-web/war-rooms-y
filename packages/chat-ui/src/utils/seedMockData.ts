/**
 * Seed Mock Data Utility
 * Populate mock backend with unified storage for development
 */

import { createStorage, seedTestWargame } from '@war-rooms/backend-mock';

export async function seedMockData() {
  // Create storage instance with unified namespace
  const storage = createStorage({
    backend: 'localStorage',
    debug: true,
    namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
  });

  // Seed unified wargame data (entities/* storage)
  await seedTestWargame(storage);

  console.info('✅ Mock data seeded successfully (Unified Storage)!');
  console.info('Available users:');
  console.info('  - commander.red (Red Force Commander)');
  console.info('  - commander.blue (Blue Force Commander)');
  console.info('  - gamemaster (Game Master)');
  console.info('  - analyst.red1 (Red Analyst)');
  console.info('  - analyst.blue1 (Blue Analyst)');
}

// Export for manual trigger from console
if (typeof window !== 'undefined') {
  (window as typeof window & { seedMockData: typeof seedMockData }).seedMockData = seedMockData;
}
