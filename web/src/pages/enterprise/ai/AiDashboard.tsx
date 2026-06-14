import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Brain, Bot, TrendingUp, AlertTriangle, UserCheck, MessageSquare, Send, RefreshCw, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

interface Prediction {
  id: string;
  model_name: string;
  prediction_score: string;
  prediction_output: {
    reasons?: string[];
    explanation?: string;
    forecast?: any[];
    history?: any[];
  };
  status: string;
  entity?: {
    name?: string;
    contract_number?: string;
    amount?: string;
    due_date?: string;
    contract?: {
      contract_number?: string;
      customer?: { name: string };
    };
  };
  created_at: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const AiDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'forecast' | 'collections' | 'assistant'>('leads');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Forecasting State
  const [forecastData, setForecastData] = useState<{ period: string; projected_value: number; confidence_lower: number; confidence_upper: number; month_name?: string }[]>([]);
  const [historicalData, setHistoricalData] = useState<{ period: string; value: number; month_name?: string }[]>([]);
  
  // Chatbot State
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).substr(2, 9));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am the REDP Enterprise AI assistant. I can query our database, calculate conversion forecasts, score leads, or assess invoice compliance. Ask me anything!' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
    loadForecast();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/ai/predictions');
      setPredictions(res.data?.data || []);
    } catch (err) {
      console.error('Error loading predictions:', err);
    }
    setLoading(false);
  };

  const loadForecast = async () => {
    try {
      const res = await api.get('/v1/enterprise/ai/sales-forecast');
      if (res.data?.success) {
        setForecastData(res.data.data.forecast || []);
        setHistoricalData(res.data.data.history || []);
      }
    } catch (err) {
      console.error('Error loading forecast:', err);
    }
  };

  const handleScoreLead = async (leadId: string) => {
    setScoringLeadId(leadId);
    try {
      await api.post(`/v1/enterprise/ai/lead-score/${leadId}`);
      loadPredictions();
    } catch (err) {
      console.error('Error scoring lead:', err);
    }
    setScoringLeadId(null);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || sendingChat) return;

    const userMsg = userInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setUserInput('');
    setSendingChat(true);

    try {
      const res = await api.post('/v1/enterprise/ai/chat', {
        message: userMsg,
        session_id: sessionId
      });
      if (res.data?.success) {
        const assistantMsg = res.data.data.response;
        setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
      }
    } catch (err) {
      console.error('Error chatting:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an issue connecting to the AI model. Please try again.' }]);
    }
    setSendingChat(false);
  };

  const handleClearChat = async () => {
    try {
      await api.post('/v1/enterprise/ai/chat/clear', { session_id: sessionId });
      setChatMessages([
        { role: 'assistant', content: 'Chat history cleared. How can I assist you with the ERP records today?' }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const leadPredictions = predictions.filter(p => p.model_name === 'lead_scoring');
  const collectionPredictions = predictions.filter(p => p.model_name === 'collection_risk');

  // Custom SVG chart details
  const renderForecastChart = () => {
    const chartHeight = 220;
    const chartWidth = 600;
    const padding = 40;
    const dataPoints = forecastData.map((d, i) => d.projected_value);
    if (dataPoints.length === 0) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No projection data to plot.</div>;

    const maxVal = Math.max(...dataPoints, 20000000);
    const minVal = 0;

    const getX = (index: number) => padding + (index * (chartWidth - padding * 2) / (dataPoints.length - 1));
    const getY = (val: number) => chartHeight - padding - ((val - minVal) * (chartHeight - padding * 2) / (maxVal - minVal));

    const pointsStr = forecastData.map((d, i) => `${getX(i)},${getY(d.projected_value)}`).join(' ');
    const lowerPointsStr = forecastData.map((d, i) => `${getX(i)},${getY(d.confidence_lower)}`).join(' ');
    const upperPointsStr = forecastData.map((d, i) => `${getX(i)},${getY(d.confidence_upper)}`).join(' ');

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const val = maxVal * ratio;
            return (
              <g key={idx}>
                <line x1={padding} y1={getY(val)} x2={chartWidth - padding} y2={getY(val)} stroke="var(--border-glass)" strokeDasharray="4 4" />
                <text x={padding - 5} y={getY(val) + 4} fill="var(--text-muted)" fontSize={9} textAnchor="end">
                  {(val / 1000000).toFixed(1)}M
                </text>
              </g>
            );
          })}

          {/* Area confidence intervals */}
          <polygon
            points={`${padding},${getY(0)} ${forecastData.map((d, i) => `${getX(i)},${getY(d.confidence_upper)}`).join(' ')} ${chartWidth - padding},${getY(0)}`}
            fill="rgba(99,102,241,0.03)"
          />

          {/* Lines */}
          <polyline fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth={1.5} strokeDasharray="3 3" points={lowerPointsStr} />
          <polyline fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth={1.5} strokeDasharray="3 3" points={upperPointsStr} />
          <polyline fill="none" stroke="var(--color-primary)" strokeWidth={3} points={pointsStr} />

          {/* Points */}
          {forecastData.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.projected_value)} r={4} fill="var(--color-primary)" />
              <text x={getX(i)} y={chartHeight - 10} fill="var(--text-muted)" fontSize={10} textAnchor="middle">
                {d.month_name || d.period.split('-')[1]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={26} className="text-indigo-600 animate-pulse" />
            🧠 REDP AI Predictive Operations Center
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Empower decision makers with Lead Conversion Probability Scoring, Collection Defaults Risk models, and Conversational Sandbox.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => { loadPredictions(); loadForecast(); }} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Recalculate
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: 8, padding: 8, borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: activeTab === 'leads' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'leads' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <UserCheck size={16} /> Lead Scores
        </button>
        <button
          className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: activeTab === 'forecast' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'forecast' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <TrendingUp size={16} /> Sales Forecasting
        </button>
        <button
          className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: activeTab === 'collections' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'collections' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <AlertTriangle size={16} /> Collection Risks
        </button>
        <button
          className={`tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: activeTab === 'assistant' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'assistant' ? '#fff' : 'var(--text-main)', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <Bot size={16} /> AI Assistant Chat
        </button>
      </div>

      {/* Loading bar */}
      {loading && activeTab !== 'assistant' && (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Evaluating system records...</div>
      )}

      {!loading && (
        <div>
          {/* TAB 1: Leads list */}
          {activeTab === 'leads' && (
            <div className="grid grid-cols-1 gap-4">
              {leadPredictions.length === 0 ? (
                <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No Lead predictions found. Click recalculate or evaluate from CRM pipelines.</div>
              ) : (
                leadPredictions.map(p => (
                  <div className="glass-panel" key={p.id} style={{ padding: 20, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>{p.entity?.name || 'Unknown Lead'}</h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)' }}>LEAD SCORING</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {p.prediction_output?.explanation || 'No assessment notes cached.'}
                      </p>
                      {p.prediction_output?.reasons && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {p.prediction_output.reasons.map((r, i) => (
                            <span key={i} style={{ fontSize: '0.68rem', background: 'rgba(0,0,0,0.03)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 20 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: parseFloat(p.prediction_score) >= 70 ? 'var(--color-success)' : parseFloat(p.prediction_score) >= 40 ? 'var(--color-secondary)' : 'var(--text-muted)' }}>
                        {parseFloat(p.prediction_score).toFixed(0)}%
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10 }}>CONVERSION PROBABILITY</span>
                      
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => handleScoreLead(p.entity_id!)}
                        disabled={scoringLeadId === p.entity_id}
                      >
                        {scoringLeadId === p.entity_id ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />} Re-evaluate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Sales forecasting */}
          {activeTab === 'forecast' && (
            <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>Pipeline Forecast (12 Months Out)</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Time-series machine learning model mapping historical booking entries into future projections.</p>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={12} /> Confidence Interval: 90%
                </span>
              </div>

              {renderForecastChart()}

              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>Forecasted Ledger Lines</h4>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: 8 }}>Period</th>
                        <th style={{ padding: 8 }}>Month</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Projected Sales</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Confidence Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <td style={{ padding: 8, fontFamily: 'monospace' }}>{d.period}</td>
                          <td style={{ padding: 8, fontWeight: 700 }}>{d.month_name || 'N/A'}</td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{d.projected_value.toLocaleString()} EGP</td>
                          <td style={{ padding: 8, textAlign: 'right', color: 'var(--text-muted)' }}>
                            {d.confidence_lower.toLocaleString()} - {d.confidence_upper.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Collections Default risks */}
          {activeTab === 'collections' && (
            <div className="grid grid-cols-1 gap-4">
              {collectionPredictions.length === 0 ? (
                <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>No collection risk reports cached. Installment entries are checked periodically.</div>
              ) : (
                collectionPredictions.map(p => (
                  <div className="glass-panel" key={p.id} style={{ padding: 20, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>Installment: {p.entity?.contract_number || 'N/A'}</h3>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>DEFAULT RISK</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Customer: <strong>{p.entity?.contract?.customer?.name || 'Unknown'}</strong> | Due Date: {p.entity?.due_date}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        {p.prediction_output?.explanation || 'No default risk justifications recorded.'}
                      </p>
                      {p.prediction_output?.reasons && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {p.prediction_output.reasons.map((r, i) => (
                            <span key={i} style={{ fontSize: '0.68rem', background: 'rgba(239,68,68,0.03)', color: '#ef4444', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                              ⚠ {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 20 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: parseFloat(p.prediction_score) >= 60 ? '#ef4444' : parseFloat(p.prediction_score) >= 30 ? 'var(--color-secondary)' : 'var(--color-success)' }}>
                        {parseFloat(p.prediction_score).toFixed(0)}%
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10 }}>RISK PROBABILITY</span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99, fontWeight: 800, ...(parseFloat(p.prediction_score) >= 60 ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' } : { background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }) }}>
                        {parseFloat(p.prediction_score) >= 60 ? 'HIGH RISK' : 'LOW RISK'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: AI chatbot assistant sandbox */}
          {activeTab === 'assistant' && (
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '62vh' }}>
              {/* Chat Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={18} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>REDP AI Assistant Sandbox</span>
                </div>
                <button className="btn-secondary" onClick={handleClearChat} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                  Clear Context
                </button>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {chatMessages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      lineHeight: '1.4',
                      ...(msg.role === 'user'
                        ? { background: 'var(--color-primary)', color: '#fff', alignSelf: 'flex-end' }
                        : { background: 'rgba(255,255,255,0.7)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }
                      )
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sendingChat && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: 'rgba(255,255,255,0.7)', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={12} className="animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendChat} style={{ borderTop: '1px solid var(--border-glass)', padding: 12, display: 'flex', gap: 10 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Ask about YTD revenue, pipeline leads, matched invoices, or commission payouts..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  disabled={sendingChat}
                />
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }} disabled={sendingChat}>
                  <Send size={14} /> Send
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiDashboard;
