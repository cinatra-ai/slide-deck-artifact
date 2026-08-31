import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Standalone test config for the extracted extension repo.
//
// THE ONE ALIAS, AND WHY IT IS HONEST. The deck display draws its pdf form
// through the shared pdf shell the host ships in its own UI package. That
// package is host-internal — it lives in the cinatra tree, is declared here as
// an OPTIONAL peer, and resolves only when the host builds this repo into its
// workspace. It therefore cannot resolve in a standalone checkout, so the
// standalone suite maps the shell specifier to a RECORDING DOUBLE with the same
// exported surface. The double records the props the display hands the shell,
// which is exactly what the delegation contract is: the display must mount the
// shared shell over the byte-road addresses and must not paint a viewer itself.
// A companion source test asserts the real specifier is the one imported, so
// the double can never stand in for a display that forgot to import it.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: [
      {
        find: "@cinatra-ai/sdk-ui/artifacts/pdf-detail-shell",
        replacement: fileURLToPath(
          new URL("./tests/doubles/pdf-detail-shell.tsx", import.meta.url),
        ),
      },
    ],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
