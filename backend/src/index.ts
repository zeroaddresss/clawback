import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Context, Next } from "hono";
import { config } from "./config";
import { initBlockchain, setupEventListeners, eventBus } from "./services/blockchain";
import healthRoutes from "./routes/health";
import escrowRoutes from "./routes/escrow";
import type { EscrowEvent } from "./types";
import type { ServerWebSocket } from "bun";

const app = new Hono();

// CORS middleware
app.use("*", cors({ origin: config.corsOrigin }));

// In-memory rate limiter for POST endpoints (10 req/min per IP)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt <= now) rateLimitMap.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS);

async function rateLimitMiddleware(c: Context, next: Next) {
  if (c.req.method !== "POST") return next();

  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    (c.env as any)?.ip?.address ||
    "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return c.json({ error: "Too many requests. Try again later." }, 429);
  }

  entry.count++;
  return next();
}

app.use("/api/*", rateLimitMiddleware);

// Mount routes
app.route("/", healthRoutes);
app.route("/", escrowRoutes);

// Track connected WebSocket clients
const clients = new Set<ServerWebSocket<unknown>>();

// Initialize blockchain services
if (config.contractAddress && config.usdcAddress && config.rpcUrl) {
  initBlockchain();
  if (config.privateKey) {
    setupEventListeners();

    // Broadcast events to all connected WebSocket clients
    eventBus.on("escrow-event", (event: EscrowEvent) => {
      const message = JSON.stringify(event);
      for (const ws of clients) {
        try {
          ws.send(message);
        } catch {
          clients.delete(ws);
        }
      }
    });
  } else {
    console.log("Signer key not configured. Write actions are unavailable.");
  }
} else {
  console.warn("Missing RPC_URL, USDC_ADDRESS, or CONTRACT_ADDRESS. Blockchain features disabled.");
}

// Start the server using Bun.serve
const server = Bun.serve({
  port: config.port,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: {
    message(ws, msg) {
      // Handle incoming messages from clients (e.g., ping/pong)
      if (msg === "ping") {
        ws.send("pong");
      }
    },
    open(ws) {
      clients.add(ws);
      console.log(`WebSocket client connected (total: ${clients.size})`);
    },
    close(ws) {
      clients.delete(ws);
      console.log(`WebSocket client disconnected (total: ${clients.size})`);
    },
  },
});

console.log(`USDC Escrow API running on http://localhost:${server.port}`);
