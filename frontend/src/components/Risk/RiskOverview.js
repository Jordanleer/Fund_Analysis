import React from 'react';
import { formatPercent, formatNumber } from '../../utils/formatters';
import './RiskOverview.css';

function RiskOverview({ riskMetrics }) {
  if (!riskMetrics) {
    return <div className="no-data">No risk data available</div>;
  }

  const cards = [
    {
      title: 'Volatility',
      value: riskMetrics.volatility,
      format: 'percent',
      icon: '📊',
      description: 'Annualized standard deviation',
      color: 'blue'
    },
    {
      title: 'Max Drawdown',
      value: riskMetrics.max_drawdown,
      format: 'percent',
      icon: '📉',
      description: 'Largest peak-to-trough decline',
      color: 'red'
    },
    {
      title: 'Sharpe Ratio',
      value: riskMetrics.sharpe_ratio,
      format: 'ratio',
      icon: '🎯',
      description: 'Risk-adjusted return',
      color: 'green'
    },
    {
      title: 'Best Month',
      value: riskMetrics.best_month,
      format: 'percent',
      icon: '⬆️',
      description: 'Highest monthly return',
      color: 'green'
    },
    {
      title: 'Worst Month',
      value: riskMetrics.worst_month,
      format: 'percent',
      icon: '⬇️',
      description: 'Lowest monthly return',
      color: 'red'
    },
    {
      title: 'Win Rate',
      value: riskMetrics.positive_months && riskMetrics.negative_months
        ? (riskMetrics.positive_months / (riskMetrics.positive_months + riskMetrics.negative_months)) * 100
        : null,
      format: 'percent',
      icon: '✓',
      description: 'Percentage of positive months',
      color: 'blue'
    }
  ];

  const formatValue = (value, format) => {
    if (value === null || value === undefined) return 'N/A';

    switch (format) {
      case 'percent':
        return formatPercent(value);
      case 'ratio':
        return formatNumber(value, 2);
      default:
        return value;
    }
  };

  const getCardClass = (color) => {
    return `risk-card ${color}`;
  };

  return (
    <div className="risk-overview-container">
      <h3>Risk Overview</h3>
      <div className="risk-cards-grid">
        {cards.map((card, idx) => (
          <div key={idx} className={getCardClass(card.color)}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <div className="card-title">{card.title}</div>
              <div className="card-value">{formatValue(card.value, card.format)}</div>
              <div className="card-description">{card.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskOverview;
