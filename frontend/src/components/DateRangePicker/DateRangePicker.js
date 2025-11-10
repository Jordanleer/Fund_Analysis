import React, { useState, useEffect } from 'react';
import { getDataStatus } from '../../services/api';
import './DateRangePicker.css';

function DateRangePicker({ onDateRangeChange, currentRange }) {
  const [selectedPreset, setSelectedPreset] = useState(currentRange?.preset || 'ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [dataEndDate, setDataEndDate] = useState(null);

  useEffect(() => {
    // Get the actual last date from the loaded data
    const fetchDataStatus = async () => {
      try {
        const status = await getDataStatus();
        if (status.status === 'data_loaded' && status.summary?.date_range?.end) {
          setDataEndDate(status.summary.date_range.end);
        }
      } catch (error) {
        console.error('Error fetching data status:', error);
      }
    };
    fetchDataStatus();
  }, []);

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
      // Use the last date from the data, not today's date
      const endDateStr = dataEndDate || new Date().toISOString().split('T')[0];
      const endDateObj = new Date(endDateStr);
      let startDate = null;
      let endDate = null;

      switch (preset) {
        case 'YTD':
          startDate = new Date(endDateObj.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = endDateStr;
          break;
        case '1Y':
          startDate = new Date(endDateObj.getFullYear() - 1, endDateObj.getMonth(), endDateObj.getDate()).toISOString().split('T')[0];
          endDate = endDateStr;
          break;
        case '3Y':
          startDate = new Date(endDateObj.getFullYear() - 3, endDateObj.getMonth(), endDateObj.getDate()).toISOString().split('T')[0];
          endDate = endDateStr;
          break;
        case '5Y':
          startDate = new Date(endDateObj.getFullYear() - 5, endDateObj.getMonth(), endDateObj.getDate()).toISOString().split('T')[0];
          endDate = endDateStr;
          break;
        case '10Y':
          startDate = new Date(endDateObj.getFullYear() - 10, endDateObj.getMonth(), endDateObj.getDate()).toISOString().split('T')[0];
          endDate = endDateStr;
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
