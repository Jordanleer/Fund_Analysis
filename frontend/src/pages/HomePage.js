import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/Upload/FileUpload';
import { getDataStatus } from '../services/api';
import { formatDate } from '../utils/formatters';
import './HomePage.css';

function HomePage() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkDataStatus();
  }, []);

  const checkDataStatus = async () => {
    try {
      const status = await getDataStatus();
      if (status.status === 'data_loaded') {
        setDataLoaded(true);
        setDataSummary(status.summary);
      }
    } catch (error) {
      console.error('Error checking data status:', error);
    }
  };

  const handleUploadSuccess = (result) => {
    setDataLoaded(true);
    setDataSummary(result.summary);
  };

  const handleViewFunds = () => {
    navigate('/funds');
  };

  const handleUploadNew = () => {
    setDataLoaded(false);
    setDataSummary(null);
  };

  const handleCompareFunds = () => {
    navigate('/compare');
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Fund Analysis WebApp</h1>
        <p className="subtitle">Analyze and compare mutual fund performance using Morningstar data</p>
      </div>

      {!dataLoaded ? (
        <FileUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div className="data-summary-container">
          <div className="success-message">
            <span className="success-icon">✅</span>
            <h2>Data Loaded Successfully</h2>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Funds</div>
              <div className="summary-value">{dataSummary?.total_funds}</div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Date Range</div>
              <div className="summary-value summary-date">
                {formatDate(dataSummary?.date_range?.start)}
                <br />
                to
                <br />
                {formatDate(dataSummary?.date_range?.end)}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Total Periods</div>
              <div className="summary-value">{dataSummary?.total_periods}</div>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleViewFunds} className="primary-button">
              View Funds
            </button>
            <button onClick={handleCompareFunds} className="primary-button">
              Compare Funds
            </button>
            <button onClick={handleUploadNew} className="secondary-button">
              Upload New File
            </button>
          </div>
        </div>
      )}

      <div className="features-section">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Fund Analysis</h4>
            <p>View detailed fund information and performance metrics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h4>Search & Filter</h4>
            <p>Find funds by name, category, or sector</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h4>Compare Funds</h4>
            <p>Side-by-side comparison of multiple funds</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
