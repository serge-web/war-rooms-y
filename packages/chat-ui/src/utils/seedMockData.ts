/**
 * Seed Mock Data Utility
 * Populate mock backend with unified storage for development
 */

import { createStorage, seedMockWargame, MOCK_MESSAGES } from '@war-rooms/backend-mock';

export async function seedMockData() {
  // Create storage instance with unified namespace
  const storage = createStorage({
    backend: 'localStorage',
    debug: true,
    namespace: import.meta.env.VITE_STORAGE_NAMESPACE || 'war-rooms',
  });

  // Seed unified wargame data (entities/* storage) using MOCK fixtures
  await seedMockWargame(storage);

  // Seed archived messages
  for (const message of MOCK_MESSAGES) {
    // Extract room JID from the message 'from' field (format: room@conference/nickname)
    const roomJid = message.from.split('/')[0];
    if (roomJid) {
      await storage.setItem(`archive/rooms/${roomJid}/${message.id}`, message);
    }
  }

  console.info('✅ Mock data seeded successfully (Unified Storage)!');
  console.info('Available users:');
  console.info('  - commander.red (Red Force Commander)');
  console.info('  - commander.blue (Blue Force Commander)');
  console.info('  - gamemaster (Game Master)');
  console.info('  - analyst.red1 (Red Analyst)');
  console.info('  - analyst.blue1 (Blue Analyst)');
  console.info(`✅ Seeded ${MOCK_MESSAGES.length} messages`);
}

// Export for manual trigger from console
if (typeof window !== 'undefined') {
  (window as typeof window & { seedMockData: typeof seedMockData }).seedMockData = seedMockData;
}
