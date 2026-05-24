import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function PulseTradeDashboard() {
  // --- State Management ---
  const [systemStatus, setSystemStatus] = useState('Connected');
  const [metrics, setMetrics] = useState({
    sharpeRatio: 1.85,
    maxDrawdown: '-4.2%',
    winRate: '62.5%',
    totalPnL: '+$12,450.00'
  });
  
  const [activeSignals, setActiveSignals] = useState([]);
  const [executedTrades, setExecutedTrades] = useState([]);
  const [performanceData, setPerformanceData] = useState([
    { time: '09:30', value: 100000 },
    { time: '10:00', value: 101200 },
    { time: '10:30', value: 100800 },
    { time: '11:00', value: 102500 },
    { time: '11:30', value: 103100 },
  ]);

  // --- WebSocket Integration ---
  useEffect(() => {
    // In production, use your actual API Gateway URL
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');
    
    ws.onopen = () => setSystemStatus('Connected & Live');
    ws.onclose = () => setSystemStatus('Disconnected');
    ws.onerror = () => setSystemStatus('Error Connecting');

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      if (payload.channel === 'sentiment_stream') {
        setActiveSignals(prev => [payload.data, ...prev].slice(0, 10)); // Keep last 10
      } else if (payload.channel === 'trade_executions') {
        setExecutedTrades(prev => [payload.data, ...prev].slice(0, 10));
        // Mock updating PnL based on a new trade
        setMetrics(prev => ({
          ...prev, 
          totalPnL: `+$${(parseFloat(prev.totalPnL.replace(/[^0-9.-]+/g,"")) + Math.random() * 500).toFixed(2)}`
        }));
      }
    };

    return () => ws.close();
  }, []);

  // --- UI Components ---
  const MetricCard = ({ title, value, color = "#333" }) => (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{title}</h4>
      <h2 style={{ margin: 0, color: color, fontSize: '24px' }}>{value}</h2>
    </div>
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a' }}>Pulse Trade Analytics</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Engine Status: 
            <span style={{ color: systemStatus.includes('Connected') ? '#2e7d32' : '#c62828', fontWeight: 'bold', marginLeft: '5px' }}>
              {systemStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Historical Metrics (KPIs) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <MetricCard title="Total PnL" value={metrics.totalPnL} color="#2e7d32" />
        <MetricCard title="Win Rate" value={metrics.winRate} />
        <MetricCard title="Sharpe Ratio" value={metrics.sharpeRatio} />
        <MetricCard title="Max Drawdown" value={metrics.maxDrawdown} color="#c62828" />
      </div>

      {/* Performance Chart */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px', height: '350px' }}>
        <h3 style={{ marginTop: 0 }}>Live Portfolio Performance</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis domain={['auto', 'auto']} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Signals & Trades Data Tables */}
      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* NLP Signals Table */}
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Active NLP Signals</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>Asset</th>
                <th style={{ padding: '10px' }}>Sentiment</th>
                <th style={{ padding: '10px' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {activeSignals.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Waiting for signals...</td></tr>
              ) : (
                activeSignals.map((signal, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{signal.asset}</td>
                    <td style={{ padding: '10px', color: signal.sentiment_label === 'positive' ? 'green' : signal.sentiment_label === 'negative' ? 'red' : 'gray' }}>
                      {signal.sentiment_label.toUpperCase()}
                    </td>
                    <td style={{ padding: '10px' }}>{(signal.sentiment_score * 100).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Executed Trades Table */}
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Executed Trades (Risk Checked)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>Action</th>
                <th style={{ padding: '10px' }}>Asset</th>
                <th style={{ padding: '10px' }}>Price</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {executedTrades.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#999' }}>No trades executed yet...</td></tr>
              ) : (
                executedTrades.map((trade, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', color: trade.action === 'BUY' ? 'green' : 'red', fontWeight: 'bold' }}>
                      {trade.action}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{trade.asset}</td>
                    <td style={{ padding: '10px' }}>${trade.price.toFixed(2)}</td>
                    <td style={{ padding: '10px', color: 'gray' }}>{trade.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}