import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";

// Direct replacement for @lovable.dev/vite-tanstack-config, which used to
// wire all of this up implicitly. Plugin order matters: tsConfigPaths and
// tailwindcss need to run before tanstackStart, and viteReact needs to run
// after it.
export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // Route TanStack Start's server entry through our own wrapper so we
      // can render a real error page instead of a bare 500 when SSR throws.
      // See src/server.ts.
      server: { entry: "./src/server.ts" },
    }),
    // Turns the Nitro/TanStack SSR server build into an actual Netlify
    // Function (and wires up dev-time emulation). Without this, vite build
    // only ever produces dist/client + dist/server, and Netlify has
    // nothing to run dist/server/server.js with.
    netlify(),
    viteReact(),
  ],
});