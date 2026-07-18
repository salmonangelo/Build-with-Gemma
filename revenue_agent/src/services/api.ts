export interface HistoricalRecord {
  date: string;
  revenue: number;
  orders: number;
  steel_price: number;
  machine_utilization: number;
  active_customers: number;
  inventory_level: number;
  payment_delays: number;
}

export interface CustomerHistoryRecord {
  month: string;
  orders: number;
  payments: number;
  delay: number;
}

export interface CustomerRecord {
  name: string;
  key: string;
  revenue_share: number;
  avg_payment_delay: number;
  delayed_invoices: number;
  total_invoices: number;
  trend: 'up' | 'down' | 'stable';
  risk_score: 'High' | 'Medium' | 'Low';
  history: CustomerHistoryRecord[];
  ai_summary?: string;
  ai_observed_behavior?: string;
  ai_business_impact?: string;
  ai_recommendation?: string;
  ai_confidence?: string;
}

export interface RiskFactor {
  factor: string;
  impact: string;
  score: number;
}

export interface RecommendedAction {
  action: string;
  internal_evidence: string | null;
  external_evidence: string | null;
}

export interface WhyAdjustedRecord {
  factor: string;
  impact: number;
  source: string;
}

export interface DashboardData {
  success: boolean;
  summary: {
    business_name: string;
    industry: string;
    location: string;
    employees: number;
    machines: number;
    total_records_months: number;
    last_upload_filename: string;
    last_upload_date: string;
    data_records_count: number;
  };
  kpis: {
    avg_monthly_revenue_lakh: number;
    revenue_change_pct: number;
    ml_forecast_8_weeks_avg_lakh: number;
    forecast_change_pct: number;
    confidence_pct: number;
    confidence_category: 'High' | 'Medium' | 'Low';
    business_risk_score: number;
    business_risk_category: 'High' | 'Medium' | 'Low';
    risk_factors: RiskFactor[];
    ai_scenario_forecast_lakh: number;
    forecast_difference_lakh: number;
    ai_executive_summary: string;
    forecast_explanation?: string;
  };
  forecast_data: {
    historical: HistoricalRecord[];
    ml_prediction: number[];
    prediction_interval_std: number;
    weeks_labels: string[];
    ai_scenario_prediction: number[];
    why_adjusted: WhyAdjustedRecord[];
  };
  shap_importance: Record<string, number>;
  shap_explanation: string;
  market_intelligence: {
    title: string;
    source: string;
    pubDate: string;
    link: string;
    category: 'Raw Material' | 'Industry Trend' | 'Government';
    business_impact: string;
    suggested_action: string;
  }[];
  customer_intelligence: {
    active_customers: number;
    healthy_customers_count: number;
    healthy_customers_pct: number;
    medium_risk_count: number;
    medium_risk_pct: number;
    high_risk_count: number;
    high_risk_pct: number;
    revenue_concentration_pct: number;
    customers: CustomerRecord[];
  };
  executive_recommendation: {
    summary: string;
    recommended_actions: RecommendedAction[];
    potential_impact: {
      cash_flow_improvement: string;
      revenue_protection: string;
    };
    confidence_score: number;
  };
}

export const uploadDataset = async (file: File): Promise<DashboardData> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload dataset.');
  }
  return response.json();
};

export const loadSampleData = async (): Promise<DashboardData> => {
  const response = await fetch('/api/load-sample', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to load sample data.');
  }
  return response.json();
};

export const getSectionExplanation = async (section: string, context: any): Promise<string> => {
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, context }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to get explanation.');
  }
  const data = await response.json();
  return data.explanation;
};

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: string;
}

export const queryAIAnalyst = async (
  question: string, 
  history: ChatHistoryItem[], 
  context: any
): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history, context }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to query AI analyst.');
  }
  const data = await response.json();
  return data.response;
};

export interface SimulationParams {
  ordersMultiplier: number;
  steelPriceMultiplier: number;
  paymentDelayModifier: number;
  utilizationMultiplier: number;
  filePath?: string;
}

export const runSimulation = async (params: SimulationParams): Promise<DashboardData> => {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to run simulation.');
  }
  return response.json();
};
