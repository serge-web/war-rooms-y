/**
 * Seed Mock Data Utility
 * Populate mock backend with fixture data for development
 */

import { createStorage } from '@war-rooms/backend-mock';
import { seedAll } from '@war-rooms/backend-mock';

export async function seedMockData() {
  console.info('[SeedMockData] Starting seed...');

  // Create storage instance
  const storage = createStorage({
    backend: 'localStorage',
    debug: true,
    namespace: 'war-rooms-mock',
  });

  // Seed all fixture data
  await seedAll(storage);

  console.info('[SeedMockData] Seed complete!');
  console.info('[SeedMockData] Available users:');
  console.info('  - commander.red (Red Force Commander)');
  console.info('  - commander.blue (Blue Force Commander)');
  console.info('  - gamemaster (Game Master)');
  console.info('  - analyst.red1 (Red Analyst)');
  console.info('  - analyst.blue1 (Blue Analyst)');
  console.info('[SeedMockData] Password: any');
}

// Export for manual trigger from console
if (typeof window !== 'undefined') {
  (window as typeof window & { seedMockData: typeof seedMockData }).seedMockData = seedMockData;
}
