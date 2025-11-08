import React from 'react';
import { formatPercent } from '../../utils/formatters';
import './PerformanceTable.css';

function PerformanceTable({ performance }) {
  if (!performance) {
    return <div className="no-data">No performance data available</div>;
  }

  const periods = [
    { key: '1M', label: '1 Month', annualized: false },
    { key: '3M', label: '3 Months', annualized: false },
    { key: '6M', label: '6 Months', annualized: false },
    { key: 'YTD', label: 'Year to Date', annualized: false },
    { key: '1Y', label: '1 Year', annualized: true },
    { key: '3Y', label: '3 Years', annualized: true },
    { key: '5Y', label: '5 Years', annualized: true },
    { key: '10Y', label: '10 Years', annualized: true },
    { key: 'ITD', label: 'Since Inception', annualized: true }
  ];

  const getValueClass = (value) => {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'positive' : 'negative';
  };

  return (
    <div className="performance-table-container">
      <h3>Period Returns</h3>
      <table className="performance-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Return</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {periods.map(period => {
            const value = performance[period.key];
            if (value === null || value === undefined) return null;

            return (
              <tr key={period.key}>
                <td className="period-label">{period.label}</td>
                <td className={`return-value ${getValueClass(value)}`}>
                  {formatPercent(value)}
                </td>
                <td className="return-type">
                  {period.annualized ? 'Annualized' : 'Cumulative'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PerformanceTable;
