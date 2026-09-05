import http from 'http';

export class KeepAliveServer {
  private static server: http.Server | null = null;

  public static start(port: number = Number(process.env.PORT) || 3000): void {
    if (this.server) return;

    this.server = http.createServer((req, res) => {
      const url = req.url || '/';

      if (url === '/health' || url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            service: 'Discord & Telegram Game Alarm Bot',
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
          })
        );
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    this.server.listen(port, () => {
      console.log(`🌐 [KeepAliveServer] Health-check HTTP server listening on port ${port}`);
      console.log(`ℹ️ [KeepAliveServer] Ping http://localhost:${port}/health to prevent cloud sleep.`);
    });
  }

  public static stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
