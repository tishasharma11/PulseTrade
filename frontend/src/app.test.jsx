import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the Recharts library so it doesn't fail in the JSDOM environment
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe('Pulse Trade Dashboard', () => {
  let mockWebSocket;

  beforeEach(() => {
    // Mock the native WebSocket implementation
    mockWebSocket = {
      onopen: jest.fn(),
      onclose: jest.fn(),
      onerror: jest.fn(),
      onmessage: jest.fn(),
      close: jest.fn(),
    };
    global.WebSocket = jest.fn(() => mockWebSocket);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the dashboard header and initial KPI metrics', () => {
    render(<App />);
    
    expect(screen.getByText('Pulse Trade Analytics')).toBeInTheDocument();
    expect(screen.getByText('Total PnL')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.getByText('+$12,450.00')).toBeInTheDocument(); // Initial mocked PnL
  });

  it('updates system status when WebSocket connects', () => {
    render(<App />);
    
    // Simulate WebSocket open event
    mockWebSocket.onopen();
    
    expect(screen.getByText(/Connected & Live/i)).toBeInTheDocument();
  });

  it('renders the performance chart placeholder', () => {
    render(<App />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});