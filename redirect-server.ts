const server = Bun.serve({
  port: 18790,
  fetch() {
    return new Response(null, {
      status: 301,
      headers: { Location: "https://agent.payclawback.xyz/" },
    });
  },
});
console.log(`Redirect server on port ${server.port}`);
