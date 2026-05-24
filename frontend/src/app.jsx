import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function App() {
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
    // Connects to the FastAPI Gateway
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');
    
    ws.onopen = () => setSystemStatus('Connected & Live');
    ws.onclose = () => setSystemStatus('Disconnected');
    ws.onerror = () => setSystemStatus('Error Connecting');

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      
      if (payload.channel === 'sentiment_stream') {
        setActiveSignals(prev => [payload.data, ...prev].slice(0, 10)); // Keep last 10 signals
      } else if (payload.channel === 'trade_executions') {
        setExecutedTrades(prev => [payload.data, ...prev].slice(0, 10)); // Keep last 10 trades
        
        // Dynamically update PnL based on incoming trades (Mock calculation)
        setMetrics(prev => ({
          ...prev, 
          totalPnL: `+$${(parseFloat(prev.totalPnL.replace(/[^0-9.-]+/g,"")) + Math.random() * 500).toFixed(2)}`
        }));
      }
    };

    return () => ws.close();
  }, []);

  // --- Helper UI Component ---
  const MetricCard = ({ title, value, color = "#333" }) => (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1 }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{title}</h4>
      <h2 style={{ margin: 0, color: color, fontSize: '24px' }}>{value}</h2>
    </div>
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      
      {/* Top Navigation / Header */}
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

      {/* KPI Metrics Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <MetricCard title="Total PnL" value={metrics.totalPnL} color="#2e7d32" />
        <MetricCard title="Win Rate" value={metrics.winRate} />
        <MetricCard title="Sharpe Ratio" value={metrics.sharpeRatio} />
        <MetricCard title="Max Drawdown" value={metrics.maxDrawdown} color="#c62828" />
      </div>

      {/* Main Performance Chart */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '30px', height: '350px' }}>
        <h3 style={{ marginTop: 0 }}>Live Portfolio Performance</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="time" stroke="#888" />
            <YAxis domain={['auto', 'auto']} tickFormatter={(value) => `$${value/1000}k`} stroke="#888" />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Data Tables */}
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* NLP Signals Table */}
        <div style={{ flex: 1, minWidth: '400px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Active NLP Signals</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Asset</th>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Sentiment</th>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {activeSignals.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px 10px', textAlign: 'center', color: '#999' }}>Listening for live signals...</td></tr>
                ) : (
                  activeSignals.map((signal, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{signal.asset}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '500', color: signal.sentiment_label === 'positive' ? '#2e7d32' : signal.sentiment_label === 'negative' ? '#d32f2f' : '#757575' }}>
                        {signal.sentiment_label.toUpperCase()}
                      </td>
                      <td style={{ padding: '12px 10px' }}>{(signal.sentiment_score * 100).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executed Trades Table */}
        <div style={{ flex: 1, minWidth: '400px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Executed Trades</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Action</th>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Asset</th>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Price</th>
                  <th style={{ padding: '12px 10px', color: '#555' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {executedTrades.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px 10px', textAlign: 'center', color: '#999' }}>Awaiting trade executions...</td></tr>
                ) : (
                  executedTrades.map((trade, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: trade.action === 'BUY' ? '#2e7d32' : '#d32f2f' }}>
                        {trade.action}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{trade.asset}</td>
                      <td style={{ padding: '12px 10px' }}>${trade.price.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', color: '#888', fontSize: '0.9em' }}>{trade.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}