import { defineConfig } from 'vitest/config';
// Full historical replays are CPU/memory heavy. Run files serially so small
// shared runners can report worker results without RPC coordination timeouts.
// All assertions and unhandled-error checks remain enabled.
export default defineConfig({ test: { fileParallelism: false, exclude: ['e2e/**', 'e2e-live/**', 'node_modules/**', '.next/**'] } });
