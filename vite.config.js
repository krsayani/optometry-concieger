import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function apiDevPlugin() {
  return {
    name: "api-dev-middleware",
    configureServer(server) {
      // Ensure server-only Resend vars from .env are on process.env in local API routes
      const env = loadEnv(server.config.mode, __dirname, "");
      for (const key of [
        "RESEND_API_KEY",
        "CONTACT_TO_EMAIL",
        "CONTACT_FROM_EMAIL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VITE_SUPABASE_URL",
        "SUPABASE_URL",
        "VITE_SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_ANON_KEY",
      ]) {
        if (env[key] && !process.env[key]) {
          process.env[key] = env[key];
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (!url.startsWith("/api/") || req.method === "GET") {
          return next();
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          return next();
        }

        const route = url.replace(/^\/api\//, "").replace(/\/$/, "");
        const allowed = new Set([
          "contact",
          "intake-notify",
          "account-invite",
          "register-account",
          "school-outreach-email",
        ]);
        if (!allowed.has(route)) {
          return next();
        }

        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString("utf8");
          const body = raw ? JSON.parse(raw) : {};

          const { default: handler } = await import(`./api/${route}.js`);
          const mockReq = {
            method: "POST",
            body,
            headers: {
              authorization: req.headers.authorization || "",
              "content-type": req.headers["content-type"] || "application/json",
            },
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
              error: error?.message || "API failed in local development.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
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
