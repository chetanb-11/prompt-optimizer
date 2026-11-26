import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeSSEStream } from './stream.js';

async function read(parts, signal) {
  const body = new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });
  const events = [];
  await consumeSSEStream({ body }, {
    onChunk: text => events.push(text),
    onDone: data => events.push(data),
    onError: error => events.push(error.code),
  }, signal);
  return events;
}

for (const newline of ['\n', '\r\n']) {
  test('handles every byte split with ' + JSON.stringify(newline), async () => {
    const wire = Buffer.from(['event: chunk', 'data: {"text":"résumé"}', '',
      'event: done', 'data: {"ok":true}', '', ''].join(newline));
    for (let i = 0; i <= wire.length; i++) {
      assert.deepEqual(await read([wire.subarray(0, i), wire.subarray(i)]), ['résumé', { ok: true }]);
    }
  });
}

test('reports incomplete responses, including a partial final frame', async () => {
  assert.deepEqual(await read([Buffer.from('event: done\ndata: {}\n')]), ['STREAM_ERROR']);
});

test('a server error is terminal', async () => {
  assert.deepEqual(await read([Buffer.from('event: error\ndata: {"code":"BUSY"}\n\n')]), ['BUSY']);
});

test('intentional cancellation is silent', async () => {
  assert.deepEqual(await read([], AbortSignal.abort()), []);
});
