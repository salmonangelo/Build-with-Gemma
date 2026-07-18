import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { 
  buildBusinessContext, 
  FALLBACK_NEWS 
} from '@/lib/revenue-orchestrator';
export const dynamic = "force-dynamic";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: Request) {
  try {
    const { section, context } = await req.json();
    let activeContext = context;
    
    if (!activeContext) {
      return NextResponse.json({ error: "No active business context found. Please upload dataset first." }, { status: 400 });
    }

    // If the context is in the raw mlData format (sent by the frontend), convert it to businessContext format
    if (activeContext.customer_intelligence && !activeContext.customer_summary) {
      activeContext = buildBusinessContext(activeContext, FALLBACK_NEWS.map(n => ({
        title: n.title,
        source: n.source,
        pubDate: n.pubDate,
        link: n.link,
        category: n.category
      })));
    }
    
    let sectionPrompt = "";
    if (section === "forecast") {
      sectionPrompt = `Explain the Revenue Forecast (Historical vs ML Forecast vs AI Scenario-Adjusted Forecast) in simple business terms. Discuss how the ML model calculated the baseline forecast of ${activeContext.forecast.ml_forecast_8_weeks_avg_lakh} Lakh, and why the AI Scenario forecast adjusted it to reflect real-world headwinds like steel index rises and payment lags. Give a professional analysis.`;
    } else if (section === "shap") {
      sectionPrompt = `Explain the ML Model Explainability Waterfall Plot (SHAP values: ${JSON.stringify(activeContext.shap_values)}). Translate these positive and negative drivers into clear actions for a machine shop owner. Explain why factors like Customer Orders have a positive driver impact, while Steel Cost or Payment Delays have negative drag impacts.`;
    } else if (section === "customer_risk") {
      const highestRiskCust = activeContext.customer_summary?.customers_details?.find((c: any) => c.risk_score === 'High') || activeContext.customer_summary?.customers_details?.[0] || { name: 'Key Customer', avg_payment_delay: 10 };
      sectionPrompt = `Explain the Customer Risk and Payment Behaviour Matrix. The active customers count is ${activeContext.customer_summary.active_customers}. Discuss customer concentration risk (Top 3 accounts contribute ${activeContext.customer_summary.revenue_concentration_pct}% of revenue). Analyze why key accounts like ${highestRiskCust.name} (avg delay ${highestRiskCust.avg_payment_delay} days) are high risk, and detail credit policies to protect our margins.`;
    } else if (section === "market_impact") {
      sectionPrompt = `Explain the Market & Industry News Business Impact. Discuss how external headlines: ${JSON.stringify(activeContext.market_intelligence)} relate to a CNC machining shop in Peenya, Bangalore. Provide concrete strategies to leverage EV components trends or hedge steel price inflation.`;
    } else if (section === "recommendation") {
      sectionPrompt = `Elaborate on the AI Executive Recommendations. Provide the owner with a detailed implementation roadmap of the checklist. Ground the roadmap in concrete internal metrics (revenue concentration, payment delays) and external market factors (steel prices, auto ancillary trends).`;
    } else if (section === "simulator") {
      sectionPrompt = `Explain the Scenario Simulator results. Explain how modifying business sliders (customer orders, steel price, payment delays, machine utilization) recomputed our forecasts and risks, and provide actionable advice based on these simulation overrides.`;
    } else {
      sectionPrompt = `Provide a comprehensive financial consultation based on the business context.`;
    }

    const prompt = `
You are the Revenue Intelligence Agent AI Analyst.
Provide a clear, narrative explanation matching the user's request. Keep it highly personalized, executive, and direct. Avoid generic AI introductory fluff.

BUSINESS CONTEXT:
${JSON.stringify(activeContext, null, 2)}

INSTRUCTION:
${sectionPrompt}

Provide the response in clean Markdown with heading hierarchies, list bullets, and highlighted numbers.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });
    
    return NextResponse.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Gemma explanation failed:", error);
    return NextResponse.json({ error: "Failed to generate explanation: " + error.message }, { status: 500 });
  }
}
