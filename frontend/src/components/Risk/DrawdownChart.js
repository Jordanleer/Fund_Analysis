import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './DrawdownChart.css';

function DrawdownChart({ data, maxDrawdown, title = 'Drawdown Over Time' }) {
  if (!data || data.length === 0) {
    return <div className="chart-no-data">No drawdown data available</div>;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Find the maximum drawdown point for highlighting
  const maxDDPoint = data.reduce((prev, current) =>
    (current.drawdown < prev.drawdown) ? current : prev
  );

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>

      {maxDrawdown && (
        <div className="drawdown-stats">
          <div className="stat-item">
            <span className="stat-label">Maximum Drawdown:</span>
            <span className="stat-value negative">{formatPercent(maxDrawdown.max_drawdown)}</span>
          </div>
          {maxDrawdown.peak_date && (
            <>
              <div className="stat-item">
                <span className="stat-label">Peak Date:</span>
                <span className="stat-value">{formatDate(maxDrawdown.peak_date)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trough Date:</span>
                <span className="stat-value">{formatDate(maxDrawdown.trough_date)}</span>
              </div>
              {maxDrawdown.recovery_date && (
                <div className="stat-item">
                  <span className="stat-label">Recovery Date:</span>
                  <span className="stat-value">{formatDate(maxDrawdown.recovery_date)}</span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-label">Duration:</span>
                <span className="stat-value">{maxDrawdown.duration_months} months</span>
              </div>
            </>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e74c3c" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#e74c3c" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tickFormatter={formatPercent}
            label={{ value: 'Drawdown (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={formatPercent}
            labelFormatter={formatDate}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#c0392b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDrawdown)"
            name="Drawdown"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DrawdownChart;
