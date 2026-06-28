/**
 * The current schema version of the persisted AppState.
 *
 * Bump this integer whenever a migration entry is added to `src/api/migrations.ts`.
 * The seeds and every newly-written state object must carry this version.
 */
export const CURRENT_SCHEMA_VERSION = 16

/**
 * Version for the bundled example/demo data, independent from persistence
 * schema shape. Bump this when the seed content should replace older local
 * demo stores on startup.
 */
export const CURRENT_DEMO_DATA_VERSION = 2
