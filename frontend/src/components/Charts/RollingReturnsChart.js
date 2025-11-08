import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './TotalReturnChart.css';

function RollingReturnsChart({ data, windowMonths = 12, lines = [] }) {
  if (!data || data.length === 0) {
    return <div className="chart-no-data">No data available</div>;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">{windowMonths}-Month Rolling Returns</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
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
            label={{ value: 'Annualized Return (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={formatPercent}
            labelFormatter={formatDate}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RollingReturnsChart;
