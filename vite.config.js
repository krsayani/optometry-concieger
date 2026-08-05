import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function contactApiPlugin() {
  return {
    name: "contact-api-dev",
    configureServer(server) {
      server.middlewares.use("/api/contact", async (req, res, next) => {
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== "POST") {
          return next();
        }

        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString("utf8");
          const body = raw ? JSON.parse(raw) : {};

          const { default: handler } = await import("./api/contact.js");
          const mockReq = {
            method: "POST",
            body,
            on() {},
          };
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader(key, value) {
              this.headers[key] = value;
            },
            status(code) {
              this.statusCode = code;
              return this;
            },
            json(payload) {
              res.statusCode = this.statusCode;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
            },
            end() {
              res.statusCode = this.statusCode;
              res.end();
            },
          };

          await handler(mockReq, mockRes);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error?.message || "Contact API failed in local development.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), contactApiPlugin()],
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
