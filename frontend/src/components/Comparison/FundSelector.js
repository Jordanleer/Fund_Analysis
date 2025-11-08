import React, { useState, useEffect } from 'react';
import { getFunds } from '../../services/api';
import './FundSelector.css';

function FundSelector({ selectedFunds, onSelectionChange, maxFunds = 10 }) {
  const [allFunds, setAllFunds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    try {
      const data = await getFunds({ limit: 200 });
      setAllFunds(data.funds);
    } catch (err) {
      console.error('Error loading funds:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFunds = allFunds.filter(fund =>
    fund.fund_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedFunds.some(sf => sf.fund_id === fund.fund_id)
  );

  const handleAddFund = (fund) => {
    if (selectedFunds.length < maxFunds) {
      onSelectionChange([...selectedFunds, fund]);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const handleRemoveFund = (fundId) => {
    onSelectionChange(selectedFunds.filter(f => f.fund_id !== fundId));
  };

  return (
    <div className="fund-selector-container">
      <div className="selector-header">
        <h3>Select Funds to Compare</h3>
        <span className="fund-count">
          {selectedFunds.length} / {maxFunds} selected
        </span>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search funds by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="search-input"
          disabled={selectedFunds.length >= maxFunds}
        />

        {showDropdown && searchTerm && filteredFunds.length > 0 && (
          <div className="dropdown">
            {filteredFunds.slice(0, 10).map(fund => (
              <div
                key={fund.fund_id}
                className="dropdown-item"
                onClick={() => handleAddFund(fund)}
              >
                <span className="fund-name">{fund.fund_name}</span>
                {fund['Morningstar Category'] && (
                  <span className="fund-category">{fund['Morningstar Category']}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="selected-funds">
        {selectedFunds.map((fund, index) => (
          <div key={fund.fund_id} className="selected-fund-chip">
            <span className="chip-number">{index + 1}</span>
            <span className="chip-name">{fund.fund_name}</span>
            <button
              className="chip-remove"
              onClick={() => handleRemoveFund(fund.fund_id)}
              title="Remove fund"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {selectedFunds.length === 0 && (
        <div className="empty-state">
          Search and select funds to compare their performance and risk metrics
        </div>
      )}

      {selectedFunds.length >= maxFunds && (
        <div className="max-reached">
          Maximum number of funds ({maxFunds}) reached. Remove a fund to add another.
        </div>
      )}
    </div>
  );
}

export default FundSelector;
