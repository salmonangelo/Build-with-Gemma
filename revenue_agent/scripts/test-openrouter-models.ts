async function fetchFreeModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    const models = data.data || [];
    const freeModels = models.filter((m: any) => m.id.endsWith(":free") || m.id.includes("free"));
    console.log("--------------------------------------------------");
    console.log("Available Free Models on OpenRouter:");
    console.log("--------------------------------------------------");
    freeModels.forEach((m: any) => {
      console.log(`- ${m.id} (${m.name || ''})`);
    });
    console.log("--------------------------------------------------");

    const gemmaModels = models.filter((m: any) => m.id.includes("gemma"));
    console.log("\nAll Gemma Models on OpenRouter:");
    console.log("--------------------------------------------------");
    gemmaModels.forEach((m: any) => {
      console.log(`- ${m.id} (${m.name || ''})`);
    });
    console.log("--------------------------------------------------");
  } catch (err: any) {
    console.error("Failed to fetch models:", err);
  }
}

fetchFreeModels();
