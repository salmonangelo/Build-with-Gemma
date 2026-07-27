import OpenAI from "openai";

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:cloud";

export const ai = new OpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: "ollama", // Dummy placeholder required by OpenAI SDK
});

export class AIService {
  static cleanJsonText(text: string): string {
    if (!text) return '{}';
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/gi, '').replace(/\s*```$/gi, '').trim();
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace === -1) return '{}';
    cleaned = cleaned.substring(firstBrace);
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace > 0) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    return cleaned;
  }

  static safeParseJson<T = any>(text: string, fallback: T): T {
    try {
      const cleaned = AIService.cleanJsonText(text);
      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      console.warn("⚠️ [AIService] Direct JSON parse failed, attempting auto-repair. Error:", err.message);
      try {
        let repaired = AIService.cleanJsonText(text);
        if ((repaired.match(/"/g) || []).length % 2 !== 0) {
          repaired += '"';
        }
        let openBraces = (repaired.match(/\{/g) || []).length;
        let closeBraces = (repaired.match(/\}/g) || []).length;
        while (openBraces > closeBraces) {
          repaired += '}';
          closeBraces++;
        }
        let openBrackets = (repaired.match(/\[/g) || []).length;
        let closeBrackets = (repaired.match(/\]/g) || []).length;
        while (openBrackets > closeBrackets) {
          repaired += ']';
          closeBrackets++;
        }
        return JSON.parse(repaired) as T;
      } catch (repairErr: any) {
        console.warn("⚠️ [AIService] Auto-repair failed. Returning safe fallback object.");
        return fallback;
      }
    }
  }


  /**
   * Generates a text or structured JSON completion using the local Ollama provider layer.
   */
  static async generateCompletion(prompt: string, isJson: boolean = false): Promise<string> {
    console.log(`🤖 [AIService] Sending prompt to Ollama (${OLLAMA_MODEL}) at ${OLLAMA_BASE_URL}...`);
    const options: any = {
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    };

    if (isJson) {
      options.response_format = { type: "json_object" };
    }

    try {
      const response = await ai.chat.completions.create(options);
      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new Error("Ollama returned an empty response.");
      }
      console.log(`✅ [AIService] Received live response from ${OLLAMA_MODEL} (${text.length} chars)`);
      return isJson ? AIService.cleanJsonText(text) : text;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
        console.warn(`[AIService] Ollama server unreachable at ${OLLAMA_BASE_URL}. Ensure 'ollama run ${OLLAMA_MODEL}' is active.`);
      } else {
        console.warn(`[AIService] Completion request failed (${OLLAMA_MODEL}):`, error.message || error);
      }
      throw error;
    }
  }


  /**
   * Generates a conversational chat response using chat history.
   */
  static async generateChatCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
    console.log(`🤖 [AIService] Chat request with ${messages.length} messages -> Ollama (${OLLAMA_MODEL})...`);
    try {
      const response = await ai.chat.completions.create({
        model: OLLAMA_MODEL,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        temperature: 0.4,
      });

      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new Error("Ollama returned an empty chat response.");
      }
      console.log(`✅ [AIService] Received live chat response from ${OLLAMA_MODEL} (${text.length} chars)`);
      return text;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
        console.warn(`[AIService] Ollama server unreachable at ${OLLAMA_BASE_URL}. Ensure 'ollama run ${OLLAMA_MODEL}' is active.`);
      } else {
        console.warn(`[AIService] Chat completion failed (${OLLAMA_MODEL}):`, error.message || error);
      }
      throw error;
    }
  }

  /**
   * Health check to verify Ollama server is running and gemma4:cloud model is reachable.
   */
  static async checkOllamaHealth(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${OLLAMA_BASE_URL}/models`);
      if (res.ok) {
        return { ok: true, message: `Ollama service online at ${OLLAMA_BASE_URL} (Model: ${OLLAMA_MODEL})` };
      }
      return { ok: false, message: `Ollama returned HTTP status ${res.status}` };
    } catch (err: any) {
      return { ok: false, message: `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Please start Ollama server.` };
    }
  }
}
