import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReturns, getPerformance, getCalendarYearReturns } from '../services/api';
import TotalReturnChart from '../components/Charts/TotalReturnChart';
import PerformanceTable from '../components/Performance/PerformanceTable';
import CalendarYearTable from '../components/Performance/CalendarYearTable';
import './PerformancePage.css';

function PerformancePage() {
  const { fundId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fundName, setFundName] = useState('');
  const [returnsData, setReturnsData] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [calendarReturns, setCalendarReturns] = useState(null);

  useEffect(() => {
    loadAllData();
  }, [fundId]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [returnsRes, performanceRes, calendarRes] = await Promise.all([
        getReturns(parseInt(fundId)),
        getPerformance(parseInt(fundId)),
        getCalendarYearReturns(parseInt(fundId))
      ]);

      setReturnsData(returnsRes.returns);
      setFundName(returnsRes.fund_name);
      setPerformance(performanceRes.performance);
      setCalendarReturns(calendarRes.calendar_year_returns);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="performance-page">
        <div className="loading">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-page">
        <div className="error">❌ {error}</div>
        <button onClick={() => navigate(`/fund/${fundId}`)} className="back-button">
          Back to Fund Details
        </button>
      </div>
    );
  }

  return (
    <div className="performance-page">
      <div className="performance-header">
        <button onClick={() => navigate(`/fund/${fundId}`)} className="back-button">
          ← Back to Fund Details
        </button>
        <h1>Performance Analysis</h1>
        <h2 className="fund-name">{fundName}</h2>
      </div>

      <div className="performance-content">
        {/* Cumulative Returns Chart */}
        <TotalReturnChart
          data={returnsData}
          title="Cumulative Returns Over Time"
        />

        <div className="performance-grid">
          {/* Period Returns Table */}
          <PerformanceTable performance={performance} />

          {/* Calendar Year Returns */}
          <CalendarYearTable calendarReturns={calendarReturns} />
        </div>
      </div>
    </div>
  );
}

export default PerformancePage;
