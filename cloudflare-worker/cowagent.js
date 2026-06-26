// PandaStack API helpers for CowAgent Worker

// Create a new PandaStack sandbox
export async function createPandaStackSandbox(apiKey) {
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
  return data.id; // Assuming API returns sandbox ID in 'id' field
}

// Run CowAgent logic in a PandaStack sandbox
export async function runCowAgentInSandbox(sandboxId, questionnaire) {
  // Send questionnaire to sandbox for processing
  const inputResponse = await fetch(`https://api.pandastack.ai/v1/sandboxes/${sandboxId}/input`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PANDASTACK_API_KEY}`, // Note: This will be replaced with env var at runtime
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        questionnaire: questionnaire,
        // Add any other initialization data needed
      }
    })
  });
  
  if (!inputResponse.ok) {
    const errText = await inputResponse.text();
    throw new Error(`Failed to send input to sandbox: ${errText}`);
  }
  
  // Poll for results (simple implementation - in production use webhooks or better polling)
  let result = null;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max wait
  
  while (attempts < maxAttempts && !result) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const statusResponse = await fetch(`https://api.pandastack.ai/v1/sandboxes/${sandboxId}/output`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PANDASTACK_API_KEY}`
      }
    });
    
    if (!statusResponse.ok) {
      const errText = await statusResponse.text();
      throw new Error(`Failed to get sandbox output: ${errText}`);
    }
    
    const statusData = await statusResponse.json();
    
    if (statusData.status === 'completed') {
      result = statusData.result;
      break;
    } else if (statusData.status === 'failed') {
      throw new Error(`Sandbox processing failed: ${statusData.error}`);
    }
    
    attempts++;
  }
  
  if (!result) {
    throw new Error('Sandbox processing timed out');
  }
  
  // Clean up: delete the sandbox
  await fetch(`https://api.pandastack.ai/v1/sandboxes/${sandboxId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${PANDASTACK_API_KEY}`
    }
  });
  
  return result;
}

// Format the raw answer from CowAgent into the expected response structure
export function formatAnswer(rawAnswer) {
  // This assumes the rawAnswer from the sandbox is already in the correct format
  // If not, transform it here
  return {
    answer: rawAnswer.answer || rawAnswer,
    confidence: rawAnswer.confidence || 0.85,
    metadata: {
      processedAt: new Date().toISOString(),
      version: '1.0',
      processingTimeMs: rawAnswer.processingTimeMs || 0
    }
  };
}