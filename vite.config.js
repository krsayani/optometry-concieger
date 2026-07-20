import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssMinify: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("@tanstack")) {
              return "vendor-tanstack";
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            if (
              id.includes("zod") ||
              id.includes("date-fns") ||
              id.includes("lucide-react")
            ) {
              return "vendor-utils";
            }
          }
        },
      },
    },
  },
});
