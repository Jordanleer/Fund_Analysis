import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { comparePerformance, getMultipleReturns, getRollingReturns, getCorrelationMatrix } from '../services/api';
import FundSelector from '../components/Comparison/FundSelector';
import TotalReturnChart from '../components/Charts/TotalReturnChart';
import RollingReturnsChart from '../components/Charts/RollingReturnsChart';
import CorrelationMatrix from '../components/Comparison/CorrelationMatrix';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedFunds.length > 0) {
      loadComparisonData();
    } else {
      setPerformanceData(null);
      setReturnsData(null);
      setRollingReturnsData(null);
      setCorrelationData(null);
    }
  }, [selectedFunds]);

  const loadComparisonData = async () => {
    setLoading(true);
    setError(null);

    try {
      const fundIds = selectedFunds.map(f => f.fund_id);

      // Load performance comparison, returns data, rolling returns, and correlation
      const [perfData, returnsResp, rollingResp, corrResp] = await Promise.all([
        comparePerformance(fundIds),
        getMultipleReturns(fundIds),
        getRollingReturns(fundIds, 12),
        getCorrelationMatrix(fundIds)
      ]);

      setPerformanceData(perfData);
      setReturnsData(returnsResp);
      setRollingReturnsData(rollingResp);
      setCorrelationData(corrResp);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading comparison data');
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

        {loading && (
          <div className="loading">Loading comparison data...</div>
        )}

        {error && (
          <div className="error">❌ {error}</div>
        )}

        {selectedFunds.length > 0 && !loading && performanceData && (
          <>
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

            {/* Correlation Matrix */}
            {correlationData && correlationData.fund_names && correlationData.fund_names.length >= 2 && (
              <CorrelationMatrix
                correlationData={correlationData.correlation_matrix}
                fundNames={correlationData.fund_names}
              />
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
