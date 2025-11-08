// Format number as percentage
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Format number as currency (ZAR)
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  return `R ${parseFloat(value).toFixed(decimals)}`;
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Format number with commas
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  return parseFloat(value).toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
