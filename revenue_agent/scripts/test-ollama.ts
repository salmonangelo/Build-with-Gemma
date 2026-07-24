import OpenAI from "openai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
const modelName = process.env.OLLAMA_MODEL || "gemma4:cloud";

console.log("=================================================");
console.log("🔍 OLLAMA CLOUD TEST SUITE (gemma4:cloud)");
console.log("=================================================");
console.log(`🌐 Base URL: ${baseURL}`);
console.log(`🤖 Target Model: ${modelName}`);
console.log("=================================================\n");

async function testOllama() {
  console.log(`📡 Step 1: Checking Ollama Server Connectivity at ${baseURL}...`);
  try {
    const healthRes = await fetch(`${baseURL.replace(/\/v1\/?$/, '')}/api/tags`);
    if (!healthRes.ok) {
      console.warn(`⚠️ Ollama server responded with HTTP status ${healthRes.status}`);
    } else {
      const data = await healthRes.json();
      console.log("✅ Ollama Server is Online! Available local models:");
      (data.models || []).forEach((m: any) => console.log(`   - ${m.name}`));
    }
  } catch (netErr: any) {
    console.error(`❌ Connection Refused! Cannot reach Ollama server at ${baseURL}`);
    console.error("💡 Please start your Ollama server in terminal with: 'ollama run gemma4:cloud'\n");
    process.exit(1);
  }

  console.log(`\n📡 Step 2: Testing Chat Completion with '${modelName}' via OpenAI SDK...`);
  try {
    const ai = new OpenAI({
      baseURL,
      apiKey: "ollama",
    });

    const response = await ai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "user",
          content: "Hello! Please confirm that gemma4:cloud is online and responding."
        }
      ],
      temperature: 0.4
    });

    console.log("\n🎉 SUCCESS! Received Live Response from Ollama gemma4:cloud:");
    console.log("-------------------------------------------------");
    console.log(response.choices[0]?.message?.content);
    console.log("-------------------------------------------------\n");
  } catch (error: any) {
    console.error("\n❌ Completion Error:", error.message || error);
    console.error(`💡 Ensure '${modelName}' is pulled in Ollama by running: 'ollama pull ${modelName}'`);
    process.exit(1);
  }
}

testOllama();
