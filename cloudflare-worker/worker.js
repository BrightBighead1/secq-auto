// Cloudflare Worker: CowAgent API with PandaStack Sandbox
// Deployed at: https://<your-subdomain>.workers.dev

import { createPandaStackSandbox, runCowAgentInSandbox, formatAnswer } from './cowagent.js';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Only POST requests allowed', { status: 405 });
    }
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response('Only JSON POST requests allowed', { status: 400 });
    }
    const { questionnaire } = await request.json();
    try {
      // 1. Create PandaStack sandbox
      const sandboxId = await createPandaStackSandbox(env.PANDASTACK_API_KEY);
      // 2. Run CowAgent in sandbox, passing API key for cleanup
      const rawResult = await runCowAgentInSandbox(sandboxId, questionnaire, env.PANDASTACK_API_KEY);
      // 3. Format and return result
      const response = formatAnswer(rawResult);
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
