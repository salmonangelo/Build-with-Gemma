import OpenAI from "openai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.OPENROUTER_API_KEY || '';
const targetModel = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

console.log("=================================================");
console.log("🔍 OPENROUTER API TEST SUITE (Free Models)");
console.log("=================================================");
console.log(`🔑 Key Present: ${!!apiKey}`);
console.log(`🤖 Target Free Model: ${targetModel}`);
console.log("=================================================\n");

async function testOpenRouter() {
  if (!apiKey || apiKey.includes("YOUR_OPENROUTER_KEY")) {
    console.log("⚠️ NOTICE: OPENROUTER_API_KEY is not configured in .env.");
    console.log("💡 To activate live OpenRouter AI, paste your API key in revenue_agent/.env:");
    console.log("   OPENROUTER_API_KEY=sk-or-v1-...");
    console.log("   OPENROUTER_MODEL=google/gemma-4-31b-it:free\n");
    return;
  }

  const candidateModels = [
    targetModel,
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'openrouter/free'
  ];

  const ai = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  for (const model of candidateModels) {
    try {
      console.log(`📡 Sending test prompt to OpenRouter model: ${model}...`);
      const response = await ai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: "Hello! Please confirm that the free Gemma model is working correctly."
          }
        ],
        temperature: 0.4
      });

      console.log(`\n🎉 SUCCESS! Received Live Response from model ${model}:`);
      console.log("-------------------------------------------------");
      console.log(response.choices[0]?.message?.content);
      console.log("-------------------------------------------------\n");
      return;
    } catch (error: any) {
      console.error(`❌ Model ${model} returned error:`, error.message || error);
    }
  }
}

testOpenRouter();
