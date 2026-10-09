import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const dockerfile = readFileSync(new URL('../Docker/frontend.Dockerfile', import.meta.url), 'utf8');
// Execute the image's actual healthcheck against HTTP responses, so changing
// Docker's command form cannot silently break quoting or runtime port handling.
const command = JSON.parse(dockerfile.match(/^\s*CMD (\[.*\])$/m)[1]);

async function checkHealth(port) {
  return run(process.execPath, command.slice(1), {
    env: { ...process.env, PORT: String(port) },
    timeout: 5000,
  });
}

for (const status of [200, 503]) {
  test(`frontend healthcheck handles HTTP ${status} on the configured port`, async (t) => {
    const server = createServer((_request, response) => {
      response.writeHead(status);
      response.end();
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const { port } = server.address();
    if (status === 200) {
      await checkHealth(port);
    } else {
      await assert.rejects(checkHealth(port), { code: 1 });
    }
  });
}

test('frontend healthcheck fails when the HTTP service is unavailable', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  await assert.rejects(checkHealth(port), { code: 1 });
});
