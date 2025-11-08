import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFundDetail } from '../services/api';
import { formatPercent, formatDate } from '../utils/formatters';
import './FundDetailPage.css';

function FundDetailPage() {
  const { fundId } = useParams();
  const navigate = useNavigate();
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFundDetail();
  }, [fundId]);

  const loadFundDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFundDetail(parseInt(fundId));
      setFund(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading fund details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fund-detail-container">
        <div className="loading">Loading fund details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fund-detail-container">
        <div className="error">❌ {error}</div>
        <button onClick={() => navigate('/funds')} className="back-button">
          Back to Fund List
        </button>
      </div>
    );
  }

  if (!fund) {
    return null;
  }

  const renderField = (label, value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return (
      <div className="info-row">
        <span className="info-label">{label}:</span>
        <span className="info-value">{value}</span>
      </div>
    );
  };

  return (
    <div className="fund-detail-container">
      <button onClick={() => navigate('/funds')} className="back-button">
        ← Back to Fund List
      </button>

      <div className="fund-header">
        <h1>{fund.fund_name}</h1>
        {fund['Morningstar Rating Overall'] && (
          <div className="fund-rating">
            {'⭐'.repeat(parseInt(fund['Morningstar Rating Overall']))}
          </div>
        )}
      </div>

      <div className="fund-sections">
        {/* Basic Information */}
        <section className="info-section">
          <h2>Basic Information</h2>
          <div className="info-grid">
            {renderField('ISIN', fund.ISIN)}
            {renderField('Firm Name', fund['Firm Name'])}
            {renderField('Manager Name', fund['Manager Name'])}
            {renderField('Inception Date', formatDate(fund.inception_date))}
            {renderField('Morningstar Category', fund['Morningstar Category'])}
            {renderField('ASISA Sector', fund['ASISA Sector (South Africa)'])}
            {renderField('Investment Area', fund['Investment Area'])}
            {renderField('Global Broad Category', fund['Global Broad Category Group'])}
          </div>
        </section>

        {/* Fees */}
        <section className="info-section">
          <h2>Fees & Costs</h2>
          <div className="info-grid">
            {renderField('Management Fee', fund['Management Fee'] ? formatPercent(fund['Management Fee']) : null)}
            {renderField('Performance Fee', fund['Performance Fee'] ? formatPercent(fund['Performance Fee']) : null)}
            {renderField('Settlement Days', fund['Settlement Day'])}
          </div>
        </section>

        {/* Investment Strategy */}
        {fund['Investment Strategy - English'] && (
          <section className="info-section">
            <h2>Investment Strategy</h2>
            <p className="strategy-text">{fund['Investment Strategy - English']}</p>
          </section>
        )}

        {/* Style & Characteristics */}
        <section className="info-section">
          <h2>Style & Characteristics</h2>
          <div className="info-grid">
            {renderField('Equity Style Box', fund['Equity Style Box (Long)'])}
            {renderField('Value-Growth Score', fund['Value-Growth Score (Long)'])}
            {renderField('Size Score', fund['Size Score (Long)'])}
          </div>
        </section>

        {/* Benchmark */}
        {fund['Primary Prospectus Benchmark'] && (
          <section className="info-section">
            <h2>Benchmark</h2>
            <div className="info-grid">
              {renderField('Primary Prospectus Benchmark', fund['Primary Prospectus Benchmark'])}
            </div>
          </section>
        )}

        {/* Portfolio Allocation (if available) */}
        {(fund['SA Equity % (Net)'] || fund['SA Bond % (Net)']) && (
          <section className="info-section">
            <h2>Portfolio Allocation</h2>
            <div className="info-grid">
              {renderField('Portfolio Date', formatDate(fund['Portfolio Date']))}
              {renderField('SA Equity %', fund['SA Equity % (Net)'] ? formatPercent(fund['SA Equity % (Net)']) : null)}
              {renderField('Non-SA Equity %', fund['Non-SA Equity % (Net)'] ? formatPercent(fund['Non-SA Equity % (Net)']) : null)}
              {renderField('SA Bond %', fund['SA Bond % (Net)'] ? formatPercent(fund['SA Bond % (Net)']) : null)}
              {renderField('Non-SA Bond %', fund['Non-SA Bond % (Net)'] ? formatPercent(fund['Non-SA Bond % (Net)']) : null)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default FundDetailPage;
