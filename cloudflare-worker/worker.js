// Cloudflare Worker: CowAgent API with PandaStack Sandbox
// Deployed at: https://<your-subdomain>.workers.dev

import { createPandaStackSandbox, runCowAgentInSandbox, formatAnswer } from './cowagent.js';

// Cloudflare Worker entry point
export default {
  async fetch(request, env) {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await request.json();
      const questionnaire = data.questionnaire;
      
      try {
        // 1. Create PandaStack sandbox
        const sandboxId = await createPandaStackSandbox(env.PANDASTACK_API_KEY);
        
        // 2. Run CowAgent in sandbox
        const rawResult = await runCowAgentInSandbox(sandboxId, questionnaire);
        
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
    } else {
      return new Response('Only JSON POST requests allowed', { status: 400 });
    }
  }
};

// ===== PandaStack API Helper Functions =====
async function createPandaStackSandbox(apiKey) {
  const response = await fetch('https://api.pandastack.ai/v1/sandboxes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PandaStack error: ${errText}`);
  }
  
  const data = await response.json();
  return data.sandboxId; // Assuming API returns sandbox ID
}

// ===== CowAgent Logic (simplified) =====
async function runCowAgentInSandbox(sandboxId, questionnaire) {
  // 1. Parse questionnaire
  const parsed = await parseQuestionnaire(questionnaire);
  
  // 2. Retrieve context from Qdrant (Northflank)
  const context = await retrieveFromQdrant(sandboxId);
  
  // 3. LLM response via OmniRoute/9Router (via Northflank)
  const llmResponse = await getLLMResponse(questionnaire, context);
  
  // 4. Validate response
  const validated = await validateAnswer(llmResponse);
  
  // 5. Format output
  return formatAnswer(validated);
}

// ===== Helper Functions =====
async function getLLMResponse(questionnaire, context) {
  // Call Northflank API (OmniRoute/9Router) to get LLM response
  const response = await fetch(`https://northflank.com/api/v1/omniroute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NORTHFLANK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: questionnaire,
      context: context,
      timeout: 60
    })
  });
  
  if (!response.ok) {
    throw new Error('LLM service error');
  }
  
  const data = await response.json();
  return data.response;
}

// ===== Helper Functions (simplified) =====
async function parseQuestionnaire(questionnaire) {
  // Parse and validate questionnaire format
  return questionnaire; // Simplified - actual implementation would parse structure
}

async function retrieveFromQdrant(sandboxId) {
  // Retrieve relevant knowledge base data from Qdrant (via Northflank)
  return { /* context data */ }; 
}

async function validateAnswer(answer) {
  // Validate answer structure, safety checks, etc.
  return answer;
}

async function formatAnswer(answer) {
  // Format answer for frontend (JSON)
  return {
    answer: answer,
    confidence: 0.95,
    metadata: {
      processedAt: new Date().toISOString(),
      version: '1.0'
    }
  }
}

// ===== Cloudflare Worker Configuration =====
// This file must be compiled to JavaScript (e.g., using wrangler)
// For now, this is a conceptual example. Actual deployment requires:
//
// 1. Install wrangler: `npm install -g @cloudflare/wrangler`
// 2. Create wrangler.toml: 
//    name = "secq-auto-api"
//    compatibility_date = "2024-01-01"
//    compatibility_flags = ["nodejs_compat"]
//    [vars]
//      PANDASTACK_API_KEY = "your-pandastack-key"
//      NORTHFLANK_API_KEY = "your-northflank-key"
// 5. Deploy with: wrangler publish