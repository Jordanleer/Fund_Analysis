import React from 'react';
import './CorrelationMatrix.css';

function CorrelationMatrix({ correlationData, fundNames }) {
  if (!correlationData || !fundNames || fundNames.length < 2) {
    return <div className="no-data">Need at least 2 funds to show correlation</div>;
  }

  const getCorrelationColor = (value) => {
    // Returns a color based on correlation strength
    // 1.0 = dark green, 0.0 = white, -1.0 = dark red
    if (value >= 0.8) return '#27ae60';
    if (value >= 0.6) return '#52be80';
    if (value >= 0.4) return '#85c1e2';
    if (value >= 0.2) return '#aed6f1';
    if (value >= -0.2) return '#f8f9fa';
    if (value >= -0.4) return '#fadbd8';
    if (value >= -0.6) return '#f5b7b1';
    if (value >= -0.8) return '#ec7063';
    return '#e74c3c';
  };

  const getTextColor = (value) => {
    // Dark text for light backgrounds, light text for dark backgrounds
    if (Math.abs(value) > 0.5) return 'white';
    return '#2c3e50';
  };

  return (
    <div className="correlation-matrix-container">
      <h3>Correlation Matrix</h3>
      <p className="correlation-description">
        Shows how fund returns move together. Values range from -1 (opposite movements) to +1 (identical movements).
      </p>

      <div className="matrix-scroll">
        <table className="correlation-table">
          <thead>
            <tr>
              <th className="corner-cell"></th>
              {fundNames.map((name, index) => (
                <th key={index} className="fund-header">{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fundNames.map((fund1, i) => (
              <tr key={i}>
                <td className="fund-label">{fund1}</td>
                {fundNames.map((fund2, j) => {
                  const value = correlationData[fund1][fund2];
                  return (
                    <td
                      key={j}
                      className="correlation-cell"
                      style={{
                        backgroundColor: getCorrelationColor(value),
                        color: getTextColor(value)
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="correlation-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#27ae60' }}></div>
          <span>High Positive (0.8 - 1.0)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#85c1e2' }}></div>
          <span>Moderate Positive (0.2 - 0.8)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f8f9fa' }}></div>
          <span>Low Correlation (-0.2 - 0.2)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f5b7b1' }}></div>
          <span>Moderate Negative (-0.8 - -0.2)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
          <span>High Negative (-1.0 - -0.8)</span>
        </div>
      </div>
    </div>
  );
}

export default CorrelationMatrix;
