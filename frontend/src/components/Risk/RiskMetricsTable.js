import React from 'react';
import { formatPercent, formatNumber } from '../../utils/formatters';
import './RiskMetricsTable.css';

function RiskMetricsTable({ riskMetrics }) {
  if (!riskMetrics) {
    return <div className="no-data">No risk metrics available</div>;
  }

  const metrics = [
    {
      category: 'Volatility Measures',
      items: [
        { label: 'Annualized Volatility', value: riskMetrics.volatility, format: 'percent' },
        { label: 'Downside Deviation', value: riskMetrics.downside_deviation, format: 'percent' }
      ]
    },
    {
      category: 'Return Distribution',
      items: [
        { label: 'Best Month', value: riskMetrics.best_month, format: 'percent', positive: true },
        { label: 'Worst Month', value: riskMetrics.worst_month, format: 'percent', negative: true },
        { label: 'Positive Months', value: riskMetrics.positive_months, format: 'number' },
        { label: 'Negative Months', value: riskMetrics.negative_months, format: 'number' }
      ]
    },
    {
      category: 'Risk-Adjusted Returns',
      items: [
        { label: 'Sharpe Ratio', value: riskMetrics.sharpe_ratio, format: 'ratio' },
        { label: 'Sortino Ratio', value: riskMetrics.sortino_ratio, format: 'ratio' }
      ]
    },
    {
      category: 'Drawdown Analysis',
      items: [
        { label: 'Maximum Drawdown', value: riskMetrics.max_drawdown, format: 'percent', negative: true },
        { label: 'Drawdown Duration', value: riskMetrics.duration_months, format: 'months' }
      ]
    }
  ];

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return 'N/A';

    switch (format) {
      case 'percent':
        return formatPercent(value);
      case 'ratio':
        return formatNumber(value, 3);
      case 'number':
        return value;
      case 'months':
        return `${value} months`;
      default:
        return value;
    }
  };

  const getValueClass = (value, positive, negative) => {
    if (value === null || value === undefined) return '';
    if (positive) return 'positive';
    if (negative) return 'negative';
    return '';
  };

  return (
    <div className="risk-metrics-container">
      <h3>Risk Metrics</h3>

      {metrics.map((category, idx) => (
        <div key={idx} className="metrics-category">
          <h4 className="category-title">{category.category}</h4>
          <table className="metrics-table">
            <tbody>
              {category.items.map((item, itemIdx) => (
                <tr key={itemIdx}>
                  <td className="metric-label">{item.label}</td>
                  <td className={`metric-value ${getValueClass(item.value, item.positive, item.negative)}`}>
                    {formatValue(item.value, item.format)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="metrics-info">
        <p><strong>Sharpe Ratio:</strong> Measures risk-adjusted return (higher is better)</p>
        <p><strong>Sortino Ratio:</strong> Similar to Sharpe but only considers downside volatility</p>
        <p><strong>Maximum Drawdown:</strong> Largest peak-to-trough decline</p>
      </div>
    </div>
  );
}

export default RiskMetricsTable;
