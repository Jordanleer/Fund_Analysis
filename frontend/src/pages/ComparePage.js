import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { comparePerformance, getMultipleReturns, getRollingReturns, getCorrelationMatrix, getRiskMetrics, getDrawdownSeries } from '../services/api';
import FundSelector from '../components/Comparison/FundSelector';
import DateRangePicker from '../components/DateRangePicker/DateRangePicker';
import TotalReturnChart from '../components/Charts/TotalReturnChart';
import RollingReturnsChart from '../components/Charts/RollingReturnsChart';
import CorrelationMatrix from '../components/Comparison/CorrelationMatrix';
import DrawdownChart from '../components/Risk/DrawdownChart';
import { formatPercent } from '../utils/formatters';
import * as XLSX from 'xlsx';
import './ComparePage.css';

function ComparePage() {
  const navigate = useNavigate();
  const [selectedFunds, setSelectedFunds] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [returnsData, setReturnsData] = useState(null);
  const [rollingReturnsData, setRollingReturnsData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [drawdownData, setDrawdownData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null, preset: 'ALL' });
  const [correlationPeriod, setCorrelationPeriod] = useState(36); // Default 36 months
  const [activeTab, setActiveTab] = useState('performance'); // performance, risk, correlation

  useEffect(() => {
    if (selectedFunds.length > 0) {
      loadComparisonData();
    } else {
      setPerformanceData(null);
      setReturnsData(null);
      setRollingReturnsData(null);
      setCorrelationData(null);
      setRiskData(null);
      setDrawdownData(null);
    }
  }, [selectedFunds, dateRange, correlationPeriod]);

  const loadComparisonData = async () => {
    setLoading(true);
    setError(null);

    try {
      const fundIds = selectedFunds.map(f => f.fund_id);

      // Load all comparison data in parallel
      const [perfData, returnsResp, rollingResp, corrResp, ...riskDataArray] = await Promise.all([
        comparePerformance(fundIds, dateRange.startDate, dateRange.endDate),
        getMultipleReturns(fundIds, dateRange.startDate, dateRange.endDate),
        getRollingReturns(fundIds, 12, dateRange.startDate, dateRange.endDate),
        getCorrelationMatrix(fundIds, dateRange.startDate, dateRange.endDate, correlationPeriod),
        // Load risk data and drawdown for each fund
        ...fundIds.flatMap(id => [
          getRiskMetrics(id, dateRange.startDate, dateRange.endDate),
          getDrawdownSeries(id, dateRange.startDate, dateRange.endDate)
        ])
      ]);

      setPerformanceData(perfData);
      setReturnsData(returnsResp);
      setRollingReturnsData(rollingResp);
      setCorrelationData(corrResp);

      // Organize risk and drawdown data
      const risks = [];
      const drawdowns = [];
      for (let i = 0; i < fundIds.length; i++) {
        risks.push(riskDataArray[i * 2]);
        drawdowns.push(riskDataArray[i * 2 + 1]);
      }
      setRiskData(risks);
      setDrawdownData(drawdowns);
    } catch (err) {
      // Handle validation errors from FastAPI (Pydantic)
      console.error('Comparison data error:', err);
      let errorMessage = 'Error loading comparison data';

      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!returnsData || !returnsData.funds || returnsData.funds.length === 0) {
      return [];
    }

    // Create a map of all unique dates
    const datesSet = new Set();
    returnsData.funds.forEach(fund => {
      fund.returns.forEach(ret => datesSet.add(ret.date));
    });

    const sortedDates = Array.from(datesSet).sort();

    // Build chart data with all funds
    return sortedDates.map(date => {
      const dataPoint = { date };
      returnsData.funds.forEach(fund => {
        const returnEntry = fund.returns.find(r => r.date === date);
        dataPoint[`${fund.fund_name}_cumulative`] = returnEntry ? returnEntry.cumulative_return : null;
      });
      return dataPoint;
    });
  };

  const getChartLines = () => {
    if (!returnsData || !returnsData.funds) return [];

    const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'];

    return returnsData.funds.map((fund, index) => ({
      dataKey: `${fund.fund_name}_cumulative`,
      name: fund.fund_name,
      color: colors[index % colors.length]
    }));
  };

  const handleExport = () => {
    if (!performanceData || !performanceData.funds) return;

    const periods = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', '10Y', 'ITD'];

    // Prepare data for Excel
    const exportData = [];

    // Add header row
    const headerRow = ['Period', ...performanceData.funds.map(f => f.fund_name)];
    exportData.push(headerRow);

    // Add period rows
    periods.forEach(period => {
      const row = [period];
      performanceData.funds.forEach(fund => {
        const value = fund.performance[period];
        row.push(value !== null && value !== undefined ? value.toFixed(2) + '%' : 'N/A');
      });
      exportData.push(row);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Set column widths
    const colWidths = [{ wch: 12 }, ...performanceData.funds.map(() => ({ wch: 25 }))];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Fund Comparison');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `fund_comparison_${date}.xlsx`;

    // Write and download the file
    XLSX.writeFile(wb, filename);
  };

  const prepareRollingReturnsData = () => {
    if (!rollingReturnsData || !rollingReturnsData.funds || rollingReturnsData.funds.length === 0) {
      return [];
    }

    // Create a map of all unique dates
    const datesSet = new Set();
    rollingReturnsData.funds.forEach(fund => {
      fund.rolling_returns.forEach(ret => datesSet.add(ret.date));
    });

    const sortedDates = Array.from(datesSet).sort();

    // Build chart data with all funds
    return sortedDates.map(date => {
      const dataPoint = { date };
      rollingReturnsData.funds.forEach(fund => {
        const returnEntry = fund.rolling_returns.find(r => r.date === date);
        dataPoint[`${fund.fund_name}_rolling`] = returnEntry ? returnEntry.rolling_return : null;
      });
      return dataPoint;
    });
  };

  const getRollingChartLines = () => {
    if (!rollingReturnsData || !rollingReturnsData.funds) return [];

    const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'];

    return rollingReturnsData.funds.map((fund, index) => ({
      dataKey: `${fund.fund_name}_rolling`,
      name: fund.fund_name,
      color: colors[index % colors.length]
    }));
  };

  const periods = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', '10Y', 'ITD'];

  return (
    <div className="compare-page">
      <div className="compare-header">
        <button onClick={() => navigate('/funds')} className="back-button">
          ← Back to Fund List
        </button>
        <h1>Compare Multiple Funds</h1>
        <p className="subtitle">Analyze and compare performance metrics across funds</p>
      </div>

      <div className="compare-content">
        <FundSelector
          selectedFunds={selectedFunds}
          onSelectionChange={setSelectedFunds}
          maxFunds={10}
        />

        {selectedFunds.length > 0 && (
          <DateRangePicker
            onDateRangeChange={setDateRange}
            currentRange={dateRange}
          />
        )}

        {loading && (
          <div className="loading">Loading comparison data...</div>
        )}

        {error && (
          <div className="error">❌ {error}</div>
        )}

        {selectedFunds.length > 0 && !loading && performanceData && (
          <>
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
                onClick={() => setActiveTab('performance')}
              >
                📊 Performance
              </button>
              <button
                className={`tab-button ${activeTab === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveTab('risk')}
              >
                ⚠️ Risk Analysis
              </button>
              <button
                className={`tab-button ${activeTab === 'correlation' ? 'active' : ''}`}
                onClick={() => setActiveTab('correlation')}
              >
                🔗 Correlation
              </button>
            </div>

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="tab-content">
                {/* Cumulative Returns Chart */}
                <div className="chart-container">
                  <h3>Cumulative Returns Comparison</h3>
                  <TotalReturnChart
                    data={prepareChartData()}
                    lines={getChartLines()}
                    multiLine={true}
                  />
                </div>

                {/* Rolling Returns Chart */}
                {rollingReturnsData && rollingReturnsData.funds && rollingReturnsData.funds.length > 0 && (
                  <div className="chart-container">
                    <RollingReturnsChart
                      data={prepareRollingReturnsData()}
                      lines={getRollingChartLines()}
                      windowMonths={12}
                    />
                  </div>
                )}

                {/* Performance Comparison Table */}
                <div className="comparison-table-container">
                  <h3>Period Returns Comparison</h3>
                  <div className="table-scroll">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          {performanceData.funds.map(fund => (
                            <th key={fund.fund_id}>{fund.fund_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map(period => (
                          <tr key={period}>
                            <td className="period-cell">{period}</td>
                            {performanceData.funds.map(fund => {
                              const value = fund.performance[period];
                              return (
                                <td
                                  key={fund.fund_id}
                                  className={value !== null && value !== undefined
                                    ? (value >= 0 ? 'positive' : 'negative')
                                    : ''}
                                >
                                  {value !== null && value !== undefined
                                    ? formatPercent(value)
                                    : 'N/A'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Export Button */}
                <div className="export-section">
                  <button className="export-button" onClick={handleExport}>
                    📥 Export to Excel
                  </button>
                </div>
              </div>
            )}

            {/* Risk Analysis Tab */}
            {activeTab === 'risk' && riskData && (
              <div className="tab-content">
                {/* Risk Metrics Comparison Table */}
                <div className="comparison-table-container">
                  <h3>Risk Metrics Comparison</h3>
                  <div className="table-scroll">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          {riskData.map((risk, idx) => (
                            <th key={idx}>{risk.fund_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="period-cell">Volatility</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx}>{formatPercent(risk.risk_metrics.volatility)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="period-cell">Downside Deviation</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx}>{formatPercent(risk.risk_metrics.downside_deviation)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="period-cell">Max Drawdown</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx} className="negative">{formatPercent(risk.risk_metrics.max_drawdown)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="period-cell">Sharpe Ratio</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx}>{risk.risk_metrics.sharpe_ratio?.toFixed(2) || 'N/A'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="period-cell">Sortino Ratio</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx}>{risk.risk_metrics.sortino_ratio?.toFixed(2) || 'N/A'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="period-cell">Best Month</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx} className="positive">{formatPercent(risk.risk_metrics.best_month)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="period-cell">Worst Month</td>
                          {riskData.map((risk, idx) => (
                            <td key={idx} className="negative">{formatPercent(risk.risk_metrics.worst_month)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Drawdown Charts */}
                {drawdownData && drawdownData.map((dd, idx) => (
                  <div key={idx} className="chart-container">
                    <DrawdownChart
                      data={dd.drawdown_series}
                      title={`${dd.fund_name} - Drawdown Over Time`}
                      maxDrawdown={riskData[idx]?.risk_metrics}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Correlation Tab */}
            {activeTab === 'correlation' && (
              <div className="tab-content">
                {correlationData && correlationData.fund_names && correlationData.fund_names.length >= 2 && (
                  <div className="correlation-section">
                    <div className="correlation-period-selector">
                      <label>Correlation Period:</label>
                      <div className="period-buttons">
                        <button
                          className={`period-button ${correlationPeriod === 36 ? 'active' : ''}`}
                          onClick={() => setCorrelationPeriod(36)}
                        >
                          36 Months
                        </button>
                        <button
                          className={`period-button ${correlationPeriod === 60 ? 'active' : ''}`}
                          onClick={() => setCorrelationPeriod(60)}
                        >
                          60 Months
                        </button>
                        <button
                          className={`period-button ${correlationPeriod === 120 ? 'active' : ''}`}
                          onClick={() => setCorrelationPeriod(120)}
                        >
                          120 Months
                        </button>
                      </div>
                    </div>
                    <CorrelationMatrix
                      correlationData={correlationData.correlation_matrix}
                      fundNames={correlationData.fund_names}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {selectedFunds.length === 0 && !loading && (
          <div className="empty-comparison">
            <div className="empty-icon">📊</div>
            <h3>No Funds Selected</h3>
            <p>Select at least 2 funds to start comparing their performance</p>
          </div>
        )}

        {selectedFunds.length === 1 && !loading && (
          <div className="single-fund-message">
            <div className="info-icon">ℹ️</div>
            <p>Add at least one more fund to see comparison charts and tables</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComparePage;
