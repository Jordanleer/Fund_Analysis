import React, { useState } from 'react';
import './DateRangePicker.css';

function DateRangePicker({ onDateRangeChange, currentRange }) {
  const [selectedPreset, setSelectedPreset] = useState(currentRange?.preset || 'ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const presets = [
    { value: 'ALL', label: 'All Time' },
    { value: 'YTD', label: 'Year to Date' },
    { value: '1Y', label: '1 Year' },
    { value: '3Y', label: '3 Years' },
    { value: '5Y', label: '5 Years' },
    { value: '10Y', label: '10 Years' },
    { value: 'CUSTOM', label: 'Custom' }
  ];

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);

    if (preset === 'CUSTOM') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const today = new Date();
      let startDate = null;
      let endDate = null;

      switch (preset) {
        case 'YTD':
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case '1Y':
          startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case '3Y':
          startDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case '5Y':
          startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case '10Y':
          startDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate()).toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'ALL':
        default:
          startDate = null;
          endDate = null;
          break;
      }

      onDateRangeChange({ startDate, endDate, preset });
    }
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange({
        startDate: customStartDate,
        endDate: customEndDate,
        preset: 'CUSTOM'
      });
    }
  };

  return (
    <div className="date-range-picker">
      <div className="date-range-label">Time Period:</div>
      <div className="preset-buttons">
        {presets.map((preset) => (
          <button
            key={preset.value}
            className={`preset-button ${selectedPreset === preset.value ? 'active' : ''}`}
            onClick={() => handlePresetChange(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="custom-date-inputs">
          <div className="date-input-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>End Date:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button
            className="apply-button"
            onClick={handleCustomApply}
            disabled={!customStartDate || !customEndDate}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
