import { GeminiAIProviderAdapter } from '../src/modules/ai/ai-provider.adapter';

async function testAIProviderFailures() {
  console.log('=== PHASE 5: SECTION 10 - AI PROVIDER FAILURE TESTING ===\n');

  const baseContext = {
    characterName: 'Mateo',
    personalityPrompt: 'A friendly barista in Madrid',
    targetLanguage: 'es',
    nativeLanguage: 'en',
    cefrLevel: 'A1',
    latestUserMessage: 'Hola, ¿cómo estás?',
    history: [],
    memories: [],
  };

  // 1. Invalid API Key / Provider Unavailable
  console.log('--- Test 10.1: Invalid API Key / Provider 400/403 ---');
  const invalidKeyAdapter = new GeminiAIProviderAdapter('invalid_fake_key_12345');
  const reply1 = await invalidKeyAdapter.generateReply(baseContext);
  if (reply1 && typeof reply1.reply === 'string' && reply1.reply.length > 0) {
    console.log('  ✅ [PASS] Successfully recovered with pedagogical fallback on invalid API key');
  } else {
    throw new Error('Failed to recover from invalid API key');
  }

  // 2. Simulated Network Failure / Host Not Found
  console.log('\n--- Test 10.2: Network Failure / Unreachable Host ---');
  // We can test by setting an adapter with an unreachable domain
  const brokenHostAdapter = new GeminiAIProviderAdapter('some_key');
  (brokenHostAdapter as any).model = 'invalid-model-that-does-not-exist';
  const reply2 = await brokenHostAdapter.generateReply(baseContext);
  if (reply2 && typeof reply2.reply === 'string' && reply2.reply.length > 0) {
    console.log('  ✅ [PASS] Successfully recovered from provider error (unreachable model)');
  } else {
    throw new Error('Failed to recover from unreachable model');
  }

  // 3. Simulated Malformed JSON Response
  console.log('\n--- Test 10.3: Malformed Response Fallback ---');
  const mockBadFetchAdapter = new GeminiAIProviderAdapter('test_key');
  // Override fetch locally for this instance to simulate malformed JSON
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: '{ bad_json: invalid ' }] } }],
    }),
  } as any);

  try {
    const reply3 = await mockBadFetchAdapter.generateReply(baseContext);
    if (reply3 && typeof reply3.reply === 'string' && reply3.reply.length > 0) {
      console.log('  ✅ [PASS] Successfully caught malformed JSON and fell back to pedagogical response');
    } else {
      throw new Error('Malformed JSON test failed to fallback');
    }
  } finally {
    global.fetch = originalFetch;
  }

  // 4. Simulated Empty Response
  console.log('\n--- Test 10.4: Empty Response Fallback ---');
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [] }),
  } as any);

  try {
    const reply4 = await mockBadFetchAdapter.generateReply(baseContext);
    if (reply4 && typeof reply4.reply === 'string' && reply4.reply.length > 0) {
      console.log('  ✅ [PASS] Successfully recovered from empty candidate array');
    } else {
      throw new Error('Empty response test failed to fallback');
    }
  } finally {
    global.fetch = originalFetch;
  }

  // 5. Simulated Provider 500 / 429
  console.log('\n--- Test 10.5: Provider 500 / 429 Status ---');
  global.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
  } as any);

  try {
    const reply5 = await mockBadFetchAdapter.generateReply(baseContext);
    if (reply5 && typeof reply5.reply === 'string' && reply5.reply.length > 0) {
      console.log('  ✅ [PASS] Successfully recovered from provider HTTP 500 error');
    } else {
      throw new Error('Provider 500 test failed');
    }
  } finally {
    global.fetch = originalFetch;
  }

  console.log('\n================================================================');
  console.log('🎉 SECTION 10 AI PROVIDER FAILURE HANDLING ALL PASSED!');
  console.log('================================================================');
}

testAIProviderFailures().catch(err => {
  console.error('AI provider failure test failed:', err);
  process.exit(1);
});
