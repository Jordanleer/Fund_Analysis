# Fund Analysis WebApp - Data Understanding & Architecture

## Document Overview
This document provides a comprehensive analysis of the Morningstar fund data structure and outlines the data architecture strategy for the fund analysis webapp.

---

## 1. Dataset Overview

### Source Information
- **Data Provider**: Morningstar
- **Export Date**: 10/02/2025
- **Currency**: South African Rand (ZAR)
- **Scope**: GSPW Performance & Positioning Review
- **Total Funds**: 114
- **Historical Period**: February 1995 to January 2025 (360 monthly periods)

### File Structure
The data is contained in an Excel file with a multi-level header structure:
- **Row 8**: Month-end dates (28/02/1995, 31/03/1995, etc.)
- **Row 9**: Field names/descriptions
- **Rows 11+**: Fund data (one fund per row)
- **Column 1**: Fund names
- **Columns 2+**: Various static fields and monthly return series

---

## 2. Data Categories & Fields

### 2.1 Static Fund Information (~349 fields)

#### Identification Fields
- **Group/Investment**: Fund name (primary identifier)
- **ISIN**: International Securities Identification Number
- **SecId**: Morningstar security identifier
- **Firm Name**: Asset management company
- **Manager Name**: Current fund manager(s)
- **Manager History**: Historical manager information
- **Manager Tenure (Average)**: Average years in role

#### Classification Fields
- **Morningstar Category**: Morningstar's fund classification
- **ASISA Sector (South Africa)**: South African fund sector classification
- **Investment Area**: Geographic investment focus
- **Global Broad Category Group**: High-level category grouping
- **Strategy Name**: Investment strategy description
- **Investment Strategy - English**: Detailed strategy text

#### Style & Characteristics
- **Equity Style Box (Long)**: Morningstar style box classification
- **Value-Growth Score (Long)**: Value vs growth orientation
- **Size Score (Long)**: Market cap focus (large/mid/small)

#### Fee Structure
- **Management Fee**: Annual management fee (%)
- **Performance Fee**: Performance-based fee (%)
- **Settlement Day**: Number of days for settlement
- **Settlement Day Type**: Type of settlement calculation

#### Ratings & Scores
- **Morningstar Rating Overall**: Star rating (1-5 stars)
- **Morningstar Sustainability Rating™**: ESG rating

#### Portfolio Composition (as of Portfolio Date)
- **Portfolio Date**: Date of portfolio holdings snapshot
- **Africa Bond (Net)**: % allocation to African bonds
- **SA Bond % (Net)**: % allocation to South African bonds
- **Non-SA Bond % (Net)**: % allocation to non-SA bonds
- **Africa Equity (Net)**: % allocation to African equities
- **SA Equity % (Net)**: % allocation to SA equities
- **Non-SA Equity % (Net)**: % allocation to non-SA equities
- *(Additional asset class breakdowns available)*

#### Benchmark Information
- **Primary Prospectus Benchmark**: Fund's stated benchmark

### 2.2 Time-Series Data (360 monthly periods)

#### Monthly Returns
- **Field**: "Return\n(Cumulative)" for each month-end date
- **Format**: Numeric values representing monthly returns (%)
- **Example**: 3.61767 = 3.62% return for that month
- **Date Range**: 28/02/1995 to 31/01/2025
- **Frequency**: Monthly (month-end)
- **Note**: Not all funds have complete 30-year history; inception dates vary

---

## 3. Data Quality Assessment

### Completeness by Key Fields
| Field | Funds with Data | Percentage |
|-------|----------------|------------|
| Fund Name | 114/114 | 100% |
| Morningstar Category | 108/114 | 95% |
| Firm Name | 69/114 | 61% |
| ISIN | 68/114 | 60% |
| ASISA Sector | 68/114 | 60% |
| Investment Area | 69/114 | 61% |
| Management Fee | 68/114 | 60% |
| Morningstar Rating | 58/114 | 51% |

### Data Characteristics
- **Static fields**: Varying completeness (50-100%), likely due to different fund types and data availability
- **Monthly returns**: Complete for periods after each fund's inception date
- **Missing data**: Should be handled gracefully in the webapp (show "N/A" or exclude from calculations)

---

## 4. Data Storage Strategy

### 4.1 Recommended Architecture: In-Memory Storage with File Upload

**Approach:** Users upload Morningstar Excel files through the webapp interface. Data is parsed and stored in memory for the session until replaced by a new upload.

**Implementation:**

**1. File Upload Flow**
```
User uploads Excel file
    ↓
FastAPI receives file
    ↓
Parser validates and extracts data
    ↓
DataStore (singleton) stores in memory
    ↓
Data available for all API endpoints
    ↓
User uploads new file → replaces existing data
```

**2. DataStore (Singleton Pattern)**
```python
# In-memory storage
class DataStore:
    _instance = None
    _funds_df: pd.DataFrame = None
    _returns_df: pd.DataFrame = None
    _upload_timestamp: datetime = None
    
    # Singleton implementation
    # Methods: set_data(), get_funds(), get_returns(), clear_data()
```

**3. Data Structure**
- **funds_df**: DataFrame with static fund information (~350 columns)
- **returns_df**: Long-format DataFrame with monthly returns
  - Columns: fund_id, fund_name, date, monthly_return
  - Optimized for time-series queries

**Advantages:**
- Simple architecture, no database setup required
- Fast prototyping and development
- Users control their data (no permanent storage)
- Easy to test with different datasets
- No database maintenance or backup concerns
- Perfect for single-user or small team use

**Disadvantages:**
- Data lost on server restart (acceptable for prototype)
- Not suitable for multi-user concurrent access
- Limited to server memory capacity
- No data persistence across sessions

**Note:** For production multi-user deployment, can easily migrate to PostgreSQL database while keeping the same API interface.

---

## 5. Data Access Patterns

### 5.1 Query Types Needed for WebApp

#### Static Data Queries
1. **Get all funds list** (for fund selector)
   - Return: fund_id, fund_name, category, sector
   
2. **Get single fund details**
   - Input: fund_id
   - Return: All static fields for display

3. **Filter funds by criteria**
   - Inputs: category, sector, rating, etc.
   - Return: Filtered fund list

4. **Compare funds static data**
   - Inputs: list of fund_ids
   - Return: Side-by-side comparison table

#### Time-Series Queries
1. **Get returns for date range**
   - Inputs: fund_id(s), start_date, end_date
   - Return: Monthly returns series

2. **Get returns for specific periods**
   - Inputs: fund_id(s), period (1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, Since Inception)
   - Return: Cumulative returns

3. **Get calendar year returns**
   - Inputs: fund_id(s), years
   - Return: Annual returns by calendar year

4. **Get rolling returns**
   - Inputs: fund_id(s), window (e.g., 36 months), start_date, end_date
   - Return: Rolling period returns

### 5.2 Performance Calculations Required

#### Return Metrics
- **Total Return**: Cumulative return over period
- **Annualized Return**: CAGR calculation
- **Calendar Year Returns**: Annual returns by year
- **Rolling Returns**: N-month rolling returns

#### Risk Metrics
- **Standard Deviation**: Annualized volatility
- **Maximum Drawdown**: Peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted return (requires risk-free rate)
- **Downside Deviation**: Volatility of negative returns
- **Value at Risk (VaR)**: Potential loss at confidence level
- **Best/Worst Month**: Extreme return observations

#### Risk-Return Metrics
- **Return/Risk Ratio**: Annualized return / annualized volatility
- **Calmar Ratio**: Return / Max Drawdown
- **Sortino Ratio**: Return / Downside Deviation

---

## 6. Data Processing Pipeline

### 6.1 File Upload and Processing Flow

```python
# Pseudo-code for upload and processing

def handle_file_upload(uploaded_file):
    """Process uploaded Morningstar Excel file"""
    
    # 1. Validate file
    validate_file_format(uploaded_file)
    
    # 2. Read Excel with multi-level headers
    df = pd.read_excel(uploaded_file, header=[7, 8])
    
    # 3. Separate static fields from time-series
    static_cols = [col for col in df.columns if 'Unnamed' in str(col[0])]
    date_cols = [col for col in df.columns if 'Unnamed' not in str(col[0])]
    
    # 4. Create funds DataFrame (static data)
    funds_df = process_static_data(df, static_cols)
    
    # 5. Create returns DataFrame (long format)
    returns_df = process_returns_data(df, date_cols, funds_df)
    
    # 6. Validate data quality
    validate_data(funds_df, returns_df)
    
    # 7. Store in memory
    data_store = DataStore()
    data_store.set_data(funds_df, returns_df)
    
    # 8. Return summary
    return get_data_summary(funds_df, returns_df)
```

### 6.2 Data Persistence Strategy

**For Prototype/Development:**
- Data stored in memory (DataStore singleton)
- Persists until new file uploaded or server restart
- Users must re-upload after server restart

**For Production (Future Enhancement):**
- Option to save uploaded data to database
- Session-based data storage per user
- Automatic data backup and versioning

---

## 7. API Design Considerations

### 7.1 RESTful API Endpoints (Recommended)

#### Fund Information
- `GET /api/funds` - List all funds with filters
- `GET /api/funds/{fund_id}` - Get single fund details
- `GET /api/funds/compare` - Compare multiple funds (POST with fund_ids)

#### Returns Data
- `GET /api/returns/{fund_id}` - Get returns with date range
- `GET /api/returns/multiple` - Get returns for multiple funds (POST)

#### Performance Analysis
- `GET /api/performance/{fund_id}` - Calculate performance metrics
- `POST /api/performance/compare` - Compare performance of multiple funds
- `GET /api/performance/calendar-returns/{fund_id}` - Get calendar year returns

#### Risk Analysis
- `GET /api/risk/{fund_id}` - Calculate risk metrics
- `POST /api/risk/compare` - Compare risk metrics

### 7.2 Data Format (JSON Response Example)

```json
{
  "fund": {
    "id": 1,
    "name": "10X S&P SA Top 50 ETF",
    "isin": "ZAE000204327",
    "category": "EAA Fund South Africa & Namibia Equity",
    "rating": "4",
    "management_fee": 0.50
  },
  "returns": [
    {"date": "2024-01-31", "return": 2.45},
    {"date": "2024-02-29", "return": 1.33}
  ],
  "performance": {
    "1m": 3.62,
    "3m": 0.91,
    "6m": 5.23,
    "1y": 12.45,
    "3y_annualized": 8.23,
    "5y_annualized": 9.12,
    "since_inception_annualized": 10.45
  },
  "risk": {
    "std_dev_1y": 12.34,
    "max_drawdown": -15.23,
    "sharpe_ratio": 0.85,
    "best_month": 8.45,
    "worst_month": -6.23
  }
}
```

---

## 8. Performance Optimization Strategies

### 8.1 Caching
- Cache frequently accessed fund lists
- Cache calculated metrics (refresh daily/weekly)
- Use Redis or similar for performance metrics cache

### 8.2 Indexing (for Database)
- Index on `fund_id` in monthly_returns table
- Composite index on `(fund_id, return_date)`
- Index on commonly filtered fields (category, sector, rating)

### 8.3 Lazy Loading
- Load static data immediately
- Load time-series data on-demand when user selects date range
- Paginate long lists of funds

### 8.4 Pre-computed Metrics
- Calculate and store common period returns (1M, 3M, 6M, 1Y, etc.)
- Update pre-computed metrics on data refresh
- Trade storage for computation speed

---

## 9. Data Security & Privacy Considerations

### 9.1 Access Control
- Consider if certain funds/data should be restricted
- Implement user authentication if needed
- Role-based access for admin functions (data upload, updates)

### 9.2 Data Backup
- Regular backups of database/files
- Version control for data updates
- Audit trail for data modifications

---

## 10. Technology Stack Recommendations

### Backend
- **Framework**: FastAPI (Python) or Flask
  - Excellent for data APIs
  - Easy integration with Pandas/NumPy for calculations
  - Fast development and good performance
  
- **Database**: PostgreSQL or SQLite
  - PostgreSQL for production scalability
  - SQLite for development/small deployments

- **Data Processing**: Pandas, NumPy
  - Essential for financial calculations
  - Efficient handling of time-series data

### Frontend
- **Framework**: React or Vue.js
  - Component-based architecture for reusable charts
  - Good ecosystem for data visualization

- **Charting Library**: 
  - Plotly.js or Chart.js for interactive charts
  - D3.js for custom visualizations
  - Recharts (React) for React integration

### Deployment
- **Development**: Local server (Flask/FastAPI dev server)
- **Production**: Docker containers, cloud hosting (AWS/Azure/GCP)

---

## 11. Next Steps

1. **Review this document** and validate assumptions about data structure
2. **Decide on storage approach** (database vs files for initial version)
3. **Move to webapp development plan** (separate document)
4. **Set up development environment**
5. **Begin Phase 1 implementation**

---

## Appendix: Sample Data Queries

### A. Get fund with full history
```python
def get_fund_with_returns(fund_id, start_date=None, end_date=None):
    """
    Retrieve fund information and returns for specified date range
    """
    # Implementation depends on storage choice
    pass
```

### B. Calculate performance metrics
```python
def calculate_performance_metrics(returns_series):
    """
    Calculate comprehensive performance metrics from returns series
    
    Args:
        returns_series: pandas Series with dates as index, returns as values
    
    Returns:
        dict: Performance metrics
    """
    metrics = {
        'total_return': calculate_total_return(returns_series),
        'annualized_return': calculate_annualized_return(returns_series),
        'volatility': calculate_volatility(returns_series),
        'max_drawdown': calculate_max_drawdown(returns_series),
        'sharpe_ratio': calculate_sharpe_ratio(returns_series),
        # ... additional metrics
    }
    return metrics
```

---

*Document Version: 1.0*  
*Last Updated: November 8, 2025*  
*Author: Jordan - GSPW Investment Management*
