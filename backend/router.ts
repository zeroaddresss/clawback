import { createServer } from "node:http";
import httpProxy from "http-proxy";

const PORT = parseInt(process.env.PORT || "3001", 10);

type Target = {
  protocol: "http:" | "https:";
  hostname: string;
  port: number;
};

function toHttpTarget(target: Target) {
  return `${target.protocol}//${target.hostname}:${target.port}`;
}

const API_TARGET: Target = {
  protocol: "http:",
  hostname: "127.0.0.1",
  port: 3002,
};

const AGENT_TARGET: Target = {
  protocol: "http:",
  hostname: "127.0.0.1",
  port: 18789,
};

function isAgentHost(hostHeader?: string) {
  const host = (hostHeader || "").split(":")[0].toLowerCase();
  return host === "agent.payclawback.xyz";
}

function pickTarget(hostHeader?: string): Target {
  return isAgentHost(hostHeader) ? AGENT_TARGET : API_TARGET;
}

function isBlockedAgentPath(pathname: string) {
  const normalized = pathname.toLowerCase();
  const segments = normalized.split("/").filter(Boolean);
  return (
    normalized.includes('"') ||
    normalized.includes("'") ||
    normalized.includes(".php") ||
    segments.some((segment) => segment.startsWith(".") && segment !== ".well-known")
  );
}

const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true,
  secure: false,
  changeOrigin: true,
});

proxy.on("error", (err, _req, res) => {
  console.error("Proxy error:", err);
  const response = res as any;
  if (response && !response.headersSent) {
    response.writeHead(502, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Upstream unavailable" }));
  }
});

function proxyRequest(req: any, res: any) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (isAgentHost(req.headers.host) && isBlockedAgentPath(url.pathname)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const target = pickTarget(req.headers.host);
  proxy.web(req, res, {
    target: toHttpTarget(target),
  });
}

const server = createServer(proxyRequest);

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (isAgentHost(req.headers.host) && isBlockedAgentPath(url.pathname)) {
    socket.destroy();
    return;
  }

  delete req.headers["x-forwarded-for"];
  delete req.headers["x-forwarded-host"];
  delete req.headers["x-forwarded-proto"];
  delete req.headers["x-real-ip"];

  const target = pickTarget(req.headers.host);
  proxy.ws(req, socket, head, {
    target: toHttpTarget(target),
  });
});

server.listen(PORT, () => {
  console.log(`Edge router listening on port ${PORT}`);
});
