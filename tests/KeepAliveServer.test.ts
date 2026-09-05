import test from 'node:test';
import assert from 'node:assert/strict';
import { KeepAliveServer } from '../src/server/KeepAliveServer';
import http from 'http';

test('KeepAliveServer - responds 200 OK on /health endpoint', async () => {
  const testPort = 3999;
  KeepAliveServer.start(testPort);

  // Wait 100ms for server to bind
  await new Promise((res) => setTimeout(res, 100));

  const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    http.get(`http://127.0.0.1:${testPort}/health`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
      res.on('error', reject);
    });
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.status, 'ok');

  KeepAliveServer.stop();
});
