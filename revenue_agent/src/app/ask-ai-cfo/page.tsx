"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  MessageSquare
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { useBusinessData } from '@/context/BusinessDataContext';
import { queryAIAnalyst } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AskAiCfoPage() {
  const { data } = useBusinessData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const topCustomerName = data?.customer_intelligence?.customers?.[0]?.name || "your key customers";
  const quickPrompts = [
    "Why did revenue decrease?",
    "Which customer has the highest payment risk?",
    "Explain the AI Scenario Forecast.",
    "What caused today's recommendation?",
    "Summarize my business health.",
    "Generate a board meeting summary."
  ];

  useEffect(() => {
    if (data && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hello! I am your AI Financial Copilot. I have analyzed your business records for ${data.summary.business_name}. 

You can ask me questions about:
- Payment delay details for ${topCustomerName} or other key clients
- Factors driving the baseline revenue forecast
- Market updates and their local business impact

How can I assist you today?`
        }
      ]);
    }
  }, [data]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading || !data) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: m.text
      }));
      
      const aiResponse = await queryAIAnalyst(textToSend, history, data);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("AI analyst query failed:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an issue querying the model. Please check that the backend service is running."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeRoute="/ask-ai-cfo">
      {data && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Ask Your AI CFO</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Contextual dialogue engine grounded in your sales history, ledger balances, and crawled news headlines.</p>
          </div>

          <div className="bg-white border border-border-subtle rounded-[24px] h-[60vh] flex flex-col justify-between overflow-hidden shadow-soft">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex items-center gap-2.5 bg-white text-text-foreground">
              <div className="p-2 bg-primary rounded-[12px] text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs leading-none">Conversation Hub</h3>
                <span className="text-[9px] text-text-muted mt-1 inline-block">Secure connection with Gemma Reasoning layer</span>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background-custom">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex gap-3 max-w-[85%] ${
                    m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  
                  <div className={`p-3 rounded-[20px] text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-text-foreground border border-border-subtle shadow-soft rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="p-3 bg-white border border-border-subtle shadow-soft rounded-[20px] rounded-tl-none flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Footer Input */}
            <div className="p-4 border-t border-border-subtle bg-white flex flex-col gap-3">
              {messages.length === 1 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-display">Suggested Questions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(qp)}
                        className="text-[9px] text-text-muted hover:text-primary bg-background-custom hover:bg-primary/5 border border-border-subtle hover:border-primary/20 px-2 py-1 rounded-[10px] text-left transition-colors font-bold flex items-center gap-1 font-display"
                      >
                        <MessageSquare size={10} />
                        <span>{qp}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder="Ask a question about your business data..."
                  className="flex-1 border border-border-subtle rounded-full px-4 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white disabled:text-text-muted rounded-full transition-colors flex items-center justify-center w-10 h-10"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
