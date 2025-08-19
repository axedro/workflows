// import { registerAllConnectors } from '@flowcraft/connectors';

/**
 * Initialize all connectors for the API
 */
export function initializeConnectors(): void {
  try {
    // registerAllConnectors();
    console.log('🚀 Connectors initialization skipped for now');
  } catch (error) {
    console.error('❌ Failed to initialize connectors:', error);
    throw error;
  }
}
