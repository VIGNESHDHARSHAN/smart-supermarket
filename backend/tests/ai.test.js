const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const router = require('../routes/ai');

test('AI chat validates requests, preserves conversation, and exposes provider failures', async (t) => {
  const originalFetch = global.fetch;
  const keys = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY'];
  const originalKeys = keys.map(key => process.env[key]);
  keys.forEach(key => { process.env[key] = ''; });
  const app = express();
  app.use(express.json());
  app.use('/ai', router);
  const server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  t.after(() => {
    global.fetch = originalFetch;
    keys.forEach((key, i) => {
      if (originalKeys[i] === undefined) delete process.env[key];
      else process.env[key] = originalKeys[i];
    });
    server.close();
  });
  const post = async (body) => {
    const res = await originalFetch(`http://127.0.0.1:${server.address().port}/ai/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };
  assert.equal((await post({ message: 123 })).status, 400);
  assert.equal((await post({ message: 'x'.repeat(12001) })).status, 400);
  assert.equal((await post({ message: 'hello', context: null })).status, 400);
  assert.equal((await post({ message: 'hello' })).status, 503);
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async (url, options) => {
    assert.ok(!url.includes('test-key'));
    const body = JSON.parse(options.body);
    assert.deepEqual(body.contents.map(m => m.role), ['user', 'model', 'user']);
    assert.equal(body.contents[0].parts[0].text, '6 times 7?');
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [
      { thought: true, text: 'private reasoning' },
      { text: JSON.stringify({ text: '1764', matchedProductIds: ['fake', 'milk'], suggestions: [123, 'Explain more'] }) }
    ] } }] }), { status: 200 });
  };
  const answer = await post({ message: 'Square it', history: [
    { sender: 'user', text: '6 times 7?' }, { sender: 'bot', text: '42' },
    { sender: 'system', text: 'untrusted' }, { sender: 'bot', text: 'offline', error: true }
  ], context: { products: [{ id: 'milk' }] } });
  assert.equal(answer.status, 200);
  assert.equal(answer.data.text, '1764');
  assert.deepEqual(answer.data.matchedProductIds, ['milk']);
  assert.deepEqual(answer.data.suggestions, ['Explain more']);
  global.fetch = async () => new Response(JSON.stringify({ error: { message: 'secret-provider-detail' } }), { status: 429 });
  const limited = await post({ message: 'hello' });
  assert.equal(limited.status, 429);
  assert.equal(limited.data.success, false);
  assert.ok(!JSON.stringify(limited.data).includes('secret-provider-detail'));
  global.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
  assert.equal((await post({ message: 'hello' })).status, 504);
});
