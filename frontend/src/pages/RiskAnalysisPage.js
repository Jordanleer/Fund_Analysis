import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRiskMetrics, getDrawdownSeries } from '../services/api';
import RiskOverview from '../components/Risk/RiskOverview';
import RiskMetricsTable from '../components/Risk/RiskMetricsTable';
import DrawdownChart from '../components/Risk/DrawdownChart';
import './RiskAnalysisPage.css';

function RiskAnalysisPage() {
  const { fundId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fundName, setFundName] = useState('');
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [drawdownData, setDrawdownData] = useState([]);

  useEffect(() => {
    loadRiskData();
  }, [fundId]);

  const loadRiskData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load risk metrics and drawdown data in parallel
      const [riskRes, drawdownRes] = await Promise.all([
        getRiskMetrics(parseInt(fundId)),
        getDrawdownSeries(parseInt(fundId))
      ]);

      setFundName(riskRes.fund_name);
      setRiskMetrics(riskRes.risk_metrics);
      setDrawdownData(drawdownRes.drawdown_series);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading risk data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="risk-analysis-page">
        <div className="loading">Loading risk analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="risk-analysis-page">
        <div className="error">❌ {error}</div>
        <button onClick={() => navigate(`/fund/${fundId}`)} className="back-button">
          Back to Fund Details
        </button>
      </div>
    );
  }

  return (
    <div className="risk-analysis-page">
      <div className="risk-header">
        <button onClick={() => navigate(`/fund/${fundId}`)} className="back-button">
          ← Back to Fund Details
        </button>
        <h1>Risk Analysis</h1>
        <h2 className="fund-name">{fundName}</h2>
        <div className="nav-buttons">
          <button
            onClick={() => navigate(`/fund/${fundId}/performance`)}
            className="nav-button"
          >
            📊 Performance
          </button>
        </div>
      </div>

      <div className="risk-content">
        {/* Risk Overview Cards */}
        <RiskOverview riskMetrics={riskMetrics} />

        {/* Drawdown Chart */}
        <DrawdownChart
          data={drawdownData}
          maxDrawdown={riskMetrics}
          title="Drawdown Analysis"
        />

        {/* Detailed Risk Metrics */}
        <RiskMetricsTable riskMetrics={riskMetrics} />
      </div>
    </div>
  );
}

export default RiskAnalysisPage;
