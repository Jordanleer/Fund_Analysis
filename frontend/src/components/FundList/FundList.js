import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunds } from '../../services/api';
import { formatPercent } from '../../utils/formatters';
import './FundList.css';

function FundList() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalFunds, setTotalFunds] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFunds(filters);
      setFunds(data.funds);
      setTotalFunds(data.total);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading funds');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadFunds({ search: searchTerm });
  };

  const handleFundClick = (fundId) => {
    navigate(`/fund/${fundId}`);
  };

  if (loading) {
    return (
      <div className="fund-list-container">
        <div className="loading">Loading funds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fund-list-container">
        <div className="error">❌ {error}</div>
      </div>
    );
  }

  return (
    <div className="fund-list-container">
      <div className="fund-list-header">
        <h2>Fund List</h2>
        <p className="fund-count">Total Funds: {totalFunds}</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search funds by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              loadFunds();
            }}
            className="clear-search-button"
          >
            Clear
          </button>
        )}
      </form>

      <div className="funds-table-container">
        <table className="funds-table">
          <thead>
            <tr>
              <th>Fund Name</th>
              <th>Firm</th>
              <th>Category</th>
              <th>Rating</th>
              <th>Mgmt Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fund) => (
              <tr key={fund.fund_id} onClick={() => handleFundClick(fund.fund_id)}>
                <td className="fund-name">{fund.fund_name}</td>
                <td>{fund['Firm Name'] || 'N/A'}</td>
                <td>{fund['Morningstar Category'] || 'N/A'}</td>
                <td className="rating">
                  {fund['Morningstar Rating Overall']
                    ? '⭐'.repeat(parseInt(fund['Morningstar Rating Overall']))
                    : 'N/A'}
                </td>
                <td>{fund['Management Fee'] ? formatPercent(fund['Management Fee']) : 'N/A'}</td>
                <td>
                  <button
                    className="view-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFundClick(fund.fund_id);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {funds.length === 0 && (
        <div className="no-results">
          No funds found matching your search criteria.
        </div>
      )}
    </div>
  );
}

export default FundList;
