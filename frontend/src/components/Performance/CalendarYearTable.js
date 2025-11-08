import React from 'react';
import { formatPercent } from '../../utils/formatters';
import './CalendarYearTable.css';

function CalendarYearTable({ calendarReturns }) {
  if (!calendarReturns || Object.keys(calendarReturns).length === 0) {
    return <div className="no-data">No calendar year data available</div>;
  }

  // Sort years in descending order (most recent first)
  const years = Object.keys(calendarReturns).sort((a, b) => parseInt(b) - parseInt(a));

  const getValueClass = (value) => {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'positive' : 'negative';
  };

  // Get best and worst years
  const returns = Object.values(calendarReturns);
  const bestYear = Math.max(...returns);
  const worstYear = Math.min(...returns);

  return (
    <div className="calendar-year-container">
      <h3>Calendar Year Returns</h3>

      <div className="year-stats">
        <div className="stat-card best">
          <div className="stat-label">Best Year</div>
          <div className="stat-value">{formatPercent(bestYear)}</div>
        </div>
        <div className="stat-card worst">
          <div className="stat-label">Worst Year</div>
          <div className="stat-value">{formatPercent(worstYear)}</div>
        </div>
      </div>

      <table className="calendar-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Annual Return</th>
          </tr>
        </thead>
        <tbody>
          {years.map(year => {
            const value = calendarReturns[year];
            const isBest = value === bestYear;
            const isWorst = value === worstYear;

            return (
              <tr key={year} className={isBest ? 'highlight-best' : isWorst ? 'highlight-worst' : ''}>
                <td className="year-label">{year}</td>
                <td className={`return-value ${getValueClass(value)}`}>
                  {formatPercent(value)}
                  {isBest && <span className="badge best-badge">Best</span>}
                  {isWorst && <span className="badge worst-badge">Worst</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarYearTable;
