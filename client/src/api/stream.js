function parseSSEBuffer(buffer) {
  const frames = buffer.split(/\r?\n\r?\n/);
  const remaining = frames.pop();
  const events = [];
  for (const frame of frames) {
    let event;
    const lines = [];
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /, ''));
    }
    if (!event || !lines.length) continue;
    let data = lines.join('\n');
    try {
      data = JSON.parse(data);
    } catch {
      // Preserve plain-text event payloads.
    }
    events.push({ event, data });
  }
  return { events, remaining };
}

export async function consumeSSEStream(response, { onChunk, onDone, onError }, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (!signal?.aborted) {
          onError?.({ message: 'Stream ended before the result arrived.', code: 'STREAM_ERROR' });
        }
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const { events, remaining } = parseSSEBuffer(buffer);
      buffer = remaining;

      for (const { event, data } of events) {
        if (event === 'chunk') {
          onChunk?.(data.text);
        } else if (event === 'done') {
          onDone?.(data);
          return;
        } else if (event === 'error') {
          const isBusy = data.status === 503 || data.status === 429 || data.code === 'AI_OVERLOADED' || data.code === 'RATE_LIMIT_EXCEEDED';
          const msg = isBusy
            ? 'AI servers are momentarily busy handling requests. Please wait a few moments and try again.'
            : (data.message || 'Streaming error occurred.');
          onError?.({ message: msg, code: data.code, status: data.status });
          return;
        }
      }
    }
  } catch (err) {
    if (signal?.aborted || err.name === 'AbortError') {
      return; // Silent return on user-initiated cancellation
    }
    onError?.({ message: err.message || 'Stream connection lost.', code: 'STREAM_ERROR' });
  } finally {
    reader.releaseLock();
  }
}
