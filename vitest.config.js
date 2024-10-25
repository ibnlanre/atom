import { defineConfig } from "vitest/config";

/**
 * @type {import('vitest').VitestConfig}
 */
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**"],
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
