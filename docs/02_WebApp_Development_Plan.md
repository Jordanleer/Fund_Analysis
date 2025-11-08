# Fund Analysis WebApp - Development Plan

## Document Overview
This document outlines the phased development plan for building a comprehensive fund analysis webapp, with detailed specifications for each stage.

---

## Project Vision

### Primary Objective
Create an interactive web application for analyzing and comparing mutual fund performance, allowing users to:
- Access detailed static fund information
- Compare multiple funds side-by-side
- Analyze performance across flexible time periods
- Visualize risk metrics and drawdowns
- Generate comprehensive performance reports

### Target Users
- Investment analysts at GSPW
- Portfolio managers
- Client-facing advisors
- Investment committee members

---

## Development Phases Overview

### Phase 1: Foundation & Static Data (Weeks 1-2)
- Data loading and storage setup
- Basic API structure
- Fund listing and detail views
- Simple fund comparison

### Phase 2: Performance Analysis Core (Weeks 3-4)
- Time period selector
- Performance calculations engine
- Total return charts
- Period return tables
- Calendar year returns

### Phase 3: Risk Analysis (Weeks 5-6)
- Drawdown charts and tables
- Risk metrics calculation
- Risk-return scatter plots
- Volatility analysis

### Phase 4: Advanced Features (Weeks 7-8)
- Custom date range selection
- Multiple fund comparison (up to 10 funds)
- Export functionality (PDF/Excel)
- Performance attribution

### Phase 5: Polish & Deployment (Weeks 9-10)
- UI/UX refinement
- Performance optimization
- User documentation
- Deployment to production

---

## Phase 1: Foundation & Static Data

### 1.1 Objectives
- Set up development environment
- Create file upload functionality for Morningstar Excel files
- Parse and validate uploaded data
- Store data in session/memory for analysis
- Create basic backend API
- Build frontend scaffolding
- Display fund list and details

### 1.2 Technical Setup

#### Backend Setup
```python
# Technology Stack
- Python 3.9+
- FastAPI (web framework)
- Pandas (data manipulation)
- SQLite/PostgreSQL (data storage)
- Pydantic (data validation)
- uvicorn (ASGI server)

# Project Structure
fund-analysis-webapp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app initialization
│   │   ├── models.py            # Pydantic models
│   │   ├── storage.py           # In-memory data storage
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py        # File upload endpoints
│   │   │   ├── funds.py         # Fund endpoints
│   │   │   ├── returns.py       # Returns endpoints
│   │   │   └── performance.py   # Performance endpoints
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── parser.py        # Parse uploaded Excel files
│   │       ├── calculations.py  # Performance calculations
│   │       └── validators.py    # Data validation
│   ├── uploads/                 # Temporary upload storage
│   ├── tests/
│   │   └── test_api.py
│   ├── requirements.txt
│   └── config.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload/
│   │   │   │   ├── FileUpload.js
│   │   │   │   └── UploadProgress.js
│   │   │   ├── FundList/
│   │   │   ├── FundDetail/
│   │   │   └── Common/
│   │   ├── pages/
│   │   │   ├── HomePage.js      # Landing with upload
│   │   │   ├── FundsPage.js
│   │   │   ├── FundDetailPage.js
│   │   │   └── ComparePage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── docs/
├── .gitignore
└── README.md
```

#### Frontend Setup
```javascript
// Technology Stack
- React 18+
- React Router (navigation)
- Axios (API calls)
- Material-UI or Tailwind CSS (styling)
- Recharts or Plotly.js (charting)
- date-fns (date handling)
```

### 1.3 File Upload & Data Storage Implementation

#### Step 1: File Upload Handler
```python
# backend/app/api/upload.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
from typing import Dict
import io
from app.utils.parser import MorningstarParser
from app.storage import DataStore

router = APIRouter()

@router.post("/upload")
async def upload_morningstar_file(file: UploadFile = File(...)):
    """
    Upload and parse Morningstar Excel file
    
    Returns:
        Summary of uploaded data (fund count, date range, etc.)
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be Excel format (.xlsx or .xls)")
    
    try:
        # Read file content
        contents = await file.read()
        
        # Parse the Excel file
        parser = MorningstarParser()
        funds_df, returns_df = parser.parse_excel(io.BytesIO(contents))
        
        # Store in memory
        data_store = DataStore()
        data_store.set_data(funds_df, returns_df)
        
        # Return summary
        return {
            "status": "success",
            "message": "File uploaded and processed successfully",
            "summary": {
                "total_funds": len(funds_df),
                "date_range": {
                    "start": returns_df['date'].min().strftime('%Y-%m-%d'),
                    "end": returns_df['date'].max().strftime('%Y-%m-%d')
                },
                "total_periods": returns_df['date'].nunique(),
                "upload_timestamp": pd.Timestamp.now().isoformat()
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/data-status")
async def get_data_status():
    """
    Check if data is loaded and get summary
    
    Returns:
        Data status and summary information
    """
    data_store = DataStore()
    
    if not data_store.has_data():
        return {
            "status": "no_data",
            "message": "No data loaded. Please upload a Morningstar Excel file."
        }
    
    summary = data_store.get_summary()
    return {
        "status": "data_loaded",
        "summary": summary
    }

@router.delete("/data")
async def clear_data():
    """
    Clear loaded data from memory
    
    Returns:
        Confirmation message
    """
    data_store = DataStore()
    data_store.clear_data()
    
    return {
        "status": "success",
        "message": "Data cleared successfully"
    }
```

#### Step 2: Data Parser
```python
# backend/app/utils/parser.py

import pandas as pd
from typing import Tuple, List
from datetime import datetime

class MorningstarParser:
    """Parse Morningstar Excel files"""
    
    def parse_excel(self, file_obj) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Parse Morningstar Excel file and extract funds and returns data
        
        Args:
            file_obj: File-like object or path to Excel file
        
        Returns:
            Tuple of (funds_df, returns_df)
        """
        # Read Excel with multi-level headers (rows 8 and 9)
        df = pd.read_excel(file_obj, header=[7, 8])
        
        # Separate static columns from date columns
        static_cols = [col for col in df.columns if 'Unnamed' in str(col[0])]
        date_cols = [col for col in df.columns if 'Unnamed' not in str(col[0])]
        
        # Process funds (static data)
        funds_df = self._process_funds(df, static_cols)
        
        # Process returns (time-series data)
        returns_df = self._process_returns(df, date_cols, funds_df)
        
        return funds_df, returns_df
    
    def _process_funds(self, df: pd.DataFrame, static_cols: List) -> pd.DataFrame:
        """Extract and clean fund static data"""
        funds = df[static_cols].copy()
        funds.columns = [col[1] for col in funds.columns]
        
        # Clean data
        funds = funds[funds['Group/Investment'].notna()]
        funds = funds[funds['Group/Investment'] != 'Local Funds']
        funds = funds.reset_index(drop=True)
        
        # Rename primary column
        funds = funds.rename(columns={'Group/Investment': 'fund_name'})
        
        # Add fund_id
        funds['fund_id'] = range(1, len(funds) + 1)
        
        # Move fund_id to first column
        cols = ['fund_id'] + [col for col in funds.columns if col != 'fund_id']
        funds = funds[cols]
        
        return funds
    
    def _process_returns(self, df: pd.DataFrame, date_cols: List, funds_df: pd.DataFrame) -> pd.DataFrame:
        """Convert returns to long format with fund_id"""
        returns_list = []
        
        # Create mapping of fund_name to fund_id
        fund_name_to_id = dict(zip(funds_df['fund_name'], funds_df['fund_id']))
        
        for idx in range(len(df)):
            fund_name = df.iloc[idx][('Unnamed: 0_level_0', 'Group/Investment')]
            
            if pd.isna(fund_name) or fund_name == 'Local Funds':
                continue
            
            fund_id = fund_name_to_id.get(fund_name)
            if fund_id is None:
                continue
            
            for date_col in date_cols:
                return_value = df.iloc[idx][date_col]
                
                if pd.notna(return_value):
                    # Parse date
                    date_str = date_col[0]
                    date_obj = pd.to_datetime(date_str, format='%d/%m/%Y')
                    
                    returns_list.append({
                        'fund_id': fund_id,
                        'fund_name': fund_name,
                        'date': date_obj,
                        'monthly_return': float(return_value)
                    })
        
        returns_df = pd.DataFrame(returns_list)
        
        # Sort by fund_id and date
        returns_df = returns_df.sort_values(['fund_id', 'date']).reset_index(drop=True)
        
        return returns_df
```

#### Step 3: In-Memory Data Store
```python
# backend/app/storage.py

import pandas as pd
from typing import Optional, Tuple, Dict
from datetime import datetime

class DataStore:
    """
    Singleton in-memory data store for uploaded fund data
    Stores data until new file is uploaded or server restarts
    """
    
    _instance = None
    _funds_df: Optional[pd.DataFrame] = None
    _returns_df: Optional[pd.DataFrame] = None
    _upload_timestamp: Optional[datetime] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataStore, cls).__new__(cls)
        return cls._instance
    
    def set_data(self, funds_df: pd.DataFrame, returns_df: pd.DataFrame):
        """Store funds and returns data"""
        self._funds_df = funds_df.copy()
        self._returns_df = returns_df.copy()
        self._upload_timestamp = datetime.now()
    
    def get_funds(self) -> Optional[pd.DataFrame]:
        """Get funds DataFrame"""
        return self._funds_df.copy() if self._funds_df is not None else None
    
    def get_returns(self) -> Optional[pd.DataFrame]:
        """Get returns DataFrame"""
        return self._returns_df.copy() if self._returns_df is not None else None
    
    def has_data(self) -> bool:
        """Check if data is loaded"""
        return self._funds_df is not None and self._returns_df is not None
    
    def clear_data(self):
        """Clear all stored data"""
        self._funds_df = None
        self._returns_df = None
        self._upload_timestamp = None
    
    def get_summary(self) -> Dict:
        """Get summary of stored data"""
        if not self.has_data():
            return {}
        
        return {
            "total_funds": len(self._funds_df),
            "date_range": {
                "start": self._returns_df['date'].min().strftime('%Y-%m-%d'),
                "end": self._returns_df['date'].max().strftime('%Y-%m-%d')
            },
            "total_periods": self._returns_df['date'].nunique(),
            "upload_timestamp": self._upload_timestamp.isoformat() if self._upload_timestamp else None
        }
    
    def get_fund_by_id(self, fund_id: int) -> Optional[pd.Series]:
        """Get single fund by ID"""
        if self._funds_df is None:
            return None
        
        fund = self._funds_df[self._funds_df['fund_id'] == fund_id]
        return fund.iloc[0] if len(fund) > 0 else None
    
    def get_returns_by_fund_id(
        self, 
        fund_id: int, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None
    ) -> Optional[pd.DataFrame]:
        """Get returns for specific fund with optional date filtering"""
        if self._returns_df is None:
            return None
        
        returns = self._returns_df[self._returns_df['fund_id'] == fund_id].copy()
        
        if start_date:
            returns = returns[returns['date'] >= pd.to_datetime(start_date)]
        
        if end_date:
            returns = returns[returns['date'] <= pd.to_datetime(end_date)]
        
        return returns
```

### 1.4 API Endpoints - Phase 1

**Note:** All fund-related endpoints require data to be uploaded first. If no data is available, endpoints return a 400 error with message to upload data.

#### Middleware: Data Availability Check
```python
# backend/app/api/dependencies.py

from fastapi import HTTPException
from app.storage import DataStore

def require_data():
    """Dependency to ensure data is loaded"""
    data_store = DataStore()
    if not data_store.has_data():
        raise HTTPException(
            status_code=400,
            detail="No data loaded. Please upload a Morningstar Excel file first."
        )
```

#### Endpoint 0: Upload File (NEW)
```python
# POST /api/upload

@router.post("/upload")
async def upload_morningstar_file(file: UploadFile = File(...)):
    """
    Upload Morningstar Excel file for analysis
    
    Accepts: .xlsx or .xls files
    
    Returns:
        Summary of uploaded data
    """
    # See implementation above
```

#### Endpoint 1: Get All Funds
```python
# GET /api/funds
# Query params: category, sector, rating, search

from app.api.dependencies import require_data
from app.storage import DataStore

@router.get("/funds", dependencies=[Depends(require_data)])
async def get_funds(
    category: Optional[str] = None,
    sector: Optional[str] = None,
    rating: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get list of funds with optional filtering
    
    Returns:
        List of funds with basic information
    """
    data_store = DataStore()
    funds_df = data_store.get_funds()
    
    # Apply filters
    if category:
        funds_df = funds_df[funds_df['Morningstar Category'] == category]
    
    if sector:
        funds_df = funds_df[funds_df['ASISA Sector (South Africa)'] == sector]
    
    if rating:
        funds_df = funds_df[funds_df['Morningstar Rating Overall'] == rating]
    
    if search:
        funds_df = funds_df[
            funds_df['fund_name'].str.contains(search, case=False, na=False)
        ]
    
    # Paginate
    total = len(funds_df)
    funds_df = funds_df.iloc[skip:skip+limit]
    
    # Select key fields for list view
    key_fields = [
        'fund_id', 'fund_name', 'ISIN', 'Firm Name',
        'Morningstar Category', 'ASISA Sector (South Africa)',
        'Morningstar Rating Overall', 'Management Fee'
    ]
    
    funds_list = funds_df[key_fields].to_dict('records')
    
    return {
        "total": total,
        "funds": funds_list
    }
```

**Response Format:**
```json
{
  "total": 114,
  "funds": [
    {
      "fund_id": 1,
      "fund_name": "10X S&P SA Top 50 ETF",
      "isin": "ZAE000204327",
      "firm_name": "10X Investments",
      "morningstar_category": "EAA Fund South Africa & Namibia Equity",
      "asisa_sector": "South African Equity General",
      "morningstar_rating": "4",
      "management_fee": 0.50
    }
  ]
}
```

#### Endpoint 2: Get Single Fund Details
```python
# GET /api/funds/{fund_id}

@router.get("/funds/{fund_id}", dependencies=[Depends(require_data)])
async def get_fund_detail(fund_id: int):
    """
    Get detailed information for a single fund
    
    Returns:
        Complete fund information including all static fields
    """
    data_store = DataStore()
    fund = data_store.get_fund_by_id(fund_id)
    
    if fund is None:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    # Get inception date from returns
    returns = data_store.get_returns_by_fund_id(fund_id)
    inception_date = returns['date'].min() if returns is not None and len(returns) > 0 else None
    
    # Convert Series to dict and add inception date
    fund_dict = fund.to_dict()
    fund_dict['inception_date'] = inception_date.strftime('%Y-%m-%d') if inception_date else None
    
    return fund_dict
```

**Response Format:**
```json
{
  "fund_id": 1,
  "fund_name": "10X S&P SA Top 50 ETF",
  "isin": "ZAE000204327",
  "sec_id": "F00000XXXX",
  "firm_name": "10X Investments",
  "manager_name": "John Smith",
  "manager_tenure": 5.2,
  "morningstar_category": "EAA Fund South Africa & Namibia Equity",
  "asisa_sector": "South African Equity General",
  "investment_area": "South Africa",
  "global_category": "Equity",
  "strategy_name": "Index Tracking",
  "equity_style_box": "Large Value",
  "management_fee": 0.50,
  "performance_fee": 0.0,
  "morningstar_rating": "4",
  "primary_benchmark": "FTSE/JSE Top 40 Index",
  "inception_date": "2015-06-01",
  "portfolio_allocations": {
    "sa_equity_pct": 95.2,
    "cash_pct": 4.8,
    "portfolio_date": "2025-01-31"
  }
}
```

#### Endpoint 3: Compare Funds (Static Data)
```python
# POST /api/funds/compare

@router.post("/funds/compare", dependencies=[Depends(require_data)])
async def compare_funds(fund_ids: List[int]):
    """
    Compare static information for multiple funds
    
    Body:
        fund_ids: List of fund IDs to compare
    
    Returns:
        Side-by-side comparison of fund attributes
    """
    data_store = DataStore()
    funds_df = data_store.get_funds()
    
    # Filter to selected funds
    selected_funds = funds_df[funds_df['fund_id'].isin(fund_ids)]
    
    if len(selected_funds) == 0:
        raise HTTPException(status_code=404, detail="No funds found with provided IDs")
    
    # Select comparison fields
    comparison_fields = [
        'fund_id', 'fund_name', 'ISIN', 'Firm Name',
        'Morningstar Category', 'ASISA Sector (South Africa)',
        'Management Fee', 'Performance Fee',
        'Morningstar Rating Overall', 'Investment Area'
    ]
    
    funds_list = selected_funds[comparison_fields].to_dict('records')
    
    return {
        "funds": funds_list,
        "comparison_fields": comparison_fields
    }
```

**Response Format:**
```json
{
  "funds": [
    {
      "fund_id": 1,
      "fund_name": "Fund A",
      "management_fee": 0.50,
      "rating": "4",
      // ... other fields
    },
    {
      "fund_id": 2,
      "fund_name": "Fund B",
      "management_fee": 0.75,
      "rating": "3",
      // ... other fields
    }
  ],
  "comparison_fields": [
    "management_fee",
    "performance_fee",
    "morningstar_rating",
    "morningstar_category",
    "inception_date"
  ]
}
```

### 1.5 Frontend Components - Phase 1

#### Component Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── Footer.js
│   ├── Upload/
│   │   ├── FileUpload.js          # Drag-drop upload component
│   │   ├── UploadProgress.js      # Upload progress indicator
│   │   └── DataSummary.js         # Show uploaded data summary
│   ├── FundList/
│   │   ├── FundList.js            # Main list view
│   │   ├── FundCard.js            # Individual fund card
│   │   ├── FundFilters.js         # Filter controls
│   │   └── SearchBar.js           # Search input
│   ├── FundDetail/
│   │   ├── FundDetail.js          # Main detail view
│   │   ├── FundInfo.js            # Static information display
│   │   └── FundStats.js           # Quick stats display
│   └── Common/
│       ├── LoadingSpinner.js
│       ├── ErrorMessage.js
│       └── Button.js
├── pages/
│   ├── HomePage.js                # Landing page with upload
│   ├── FundsPage.js               # Fund list page
│   ├── FundDetailPage.js          # Single fund detail
│   └── ComparePage.js             # Fund comparison (Phase 1: static only)
├── services/
│   └── api.js                     # API service layer
└── utils/
    ├── formatters.js              # Number/date formatting
    └── constants.js               # App constants
```

#### Key Pages

**1. Home Page**
```javascript
// Features:
- Welcome message and instructions
- Prominent file upload area (drag & drop)
- File format requirements (Excel .xlsx/.xls)
- Data summary once uploaded (fund count, date range)
- "Replace data" button if data already loaded
- Quick links to analysis tools (once data loaded)
```

**File Upload Component:**
```javascript
// Features:
- Drag and drop zone
- Click to browse files
- File type validation (client-side)
- Upload progress bar
- Success/error messages
- Display uploaded file info
- "Upload new file" button to replace existing data
```

**2. Funds List Page**
```javascript
// Features:
- Requires data to be uploaded first
- Searchable fund list
- Filterable by category, sector, rating
- Sortable columns
- Pagination
- Quick view of key metrics (fees, rating, category)
- "Add to comparison" checkbox
- "View details" button
```

**3. Fund Detail Page**
```javascript
// Sections:
- Fund header (name, ISIN, rating)
- Key facts table
  - Management company
  - Category/Sector
  - Fees
  - Manager info
  - Inception date
- Investment strategy (collapsible)
- Portfolio allocation (if available)
- Benchmark information
```

**4. Compare Page (Static - Phase 1)**
```javascript
// Features:
- Select up to 5 funds for comparison
- Side-by-side table of key attributes
- Highlight differences
- Export comparison table
```

### 1.6 Phase 1 Deliverables

✅ Working backend API with upload and fund data endpoints  
✅ File upload handler with Excel parsing  
✅ In-memory data storage (DataStore singleton)  
✅ React frontend with file upload interface  
✅ Fund list view with search and filters  
✅ Fund detail view with complete static information  
✅ Static fund comparison page  
✅ Basic error handling and loading states  
✅ Data validation and error messages  

### 1.7 Phase 1 Testing

- Unit tests for data loading functions
- API endpoint tests
- Frontend component tests
- Manual testing of user flows

---

## Phase 2: Performance Analysis Core

### 2.1 Objectives
- Implement performance calculation engine
- Create time period selector
- Build total return charts
- Generate period return tables
- Display calendar year returns

### 2.2 Performance Calculations Module

```python
# backend/app/utils/calculations.py

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

class PerformanceCalculator:
    """Calculate fund performance metrics"""
    
    @staticmethod
    def calculate_total_return(returns: pd.Series) -> float:
        """
        Calculate cumulative return over period
        
        Args:
            returns: Series of monthly returns (as percentages)
        
        Returns:
            Total cumulative return (%)
        """
        if len(returns) == 0:
            return 0.0
        
        # Convert to decimal and compound
        cumulative = (1 + returns / 100).prod() - 1
        return cumulative * 100
    
    @staticmethod
    def calculate_annualized_return(returns: pd.Series, periods_per_year: int = 12) -> float:
        """
        Calculate annualized return (CAGR)
        
        Args:
            returns: Series of monthly returns
            periods_per_year: Number of periods per year (12 for monthly)
        
        Returns:
            Annualized return (%)
        """
        if len(returns) == 0:
            return 0.0
        
        total_return = PerformanceCalculator.calculate_total_return(returns)
        n_periods = len(returns)
        n_years = n_periods / periods_per_year
        
        if n_years == 0:
            return 0.0
        
        annualized = (((1 + total_return / 100) ** (1 / n_years)) - 1) * 100
        return annualized
    
    @staticmethod
    def calculate_period_returns(returns_df: pd.DataFrame, fund_name: str) -> Dict[str, float]:
        """
        Calculate returns for standard periods (1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, ITD)
        
        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns
            fund_name: Name of the fund
        
        Returns:
            Dictionary of period returns
        """
        # Sort by date
        returns_df = returns_df.sort_values('date')
        latest_date = returns_df['date'].max()
        
        periods = {
            '1M': 1,
            '3M': 3,
            '6M': 6,
            '1Y': 12,
            '3Y': 36,
            '5Y': 60,
            '10Y': 120
        }
        
        period_returns = {}
        
        for period_name, months in periods.items():
            start_date = latest_date - pd.DateOffset(months=months)
            period_data = returns_df[returns_df['date'] > start_date]['monthly_return']
            
            if len(period_data) >= months:
                if period_name in ['1M', '3M', '6M']:
                    # Cumulative return for short periods
                    period_returns[period_name] = PerformanceCalculator.calculate_total_return(period_data)
                else:
                    # Annualized for longer periods
                    period_returns[period_name] = PerformanceCalculator.calculate_annualized_return(period_data)
            else:
                period_returns[period_name] = None
        
        # Inception to date (annualized)
        if len(returns_df) > 0:
            period_returns['ITD'] = PerformanceCalculator.calculate_annualized_return(
                returns_df['monthly_return']
            )
        
        return period_returns
    
    @staticmethod
    def calculate_calendar_year_returns(returns_df: pd.DataFrame) -> Dict[int, float]:
        """
        Calculate calendar year returns
        
        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns
        
        Returns:
            Dictionary mapping year to annual return
        """
        returns_df = returns_df.copy()
        returns_df['year'] = returns_df['date'].dt.year
        
        year_returns = {}
        for year in returns_df['year'].unique():
            year_data = returns_df[returns_df['year'] == year]['monthly_return']
            year_returns[year] = PerformanceCalculator.calculate_total_return(year_data)
        
        return dict(sorted(year_returns.items()))
    
    @staticmethod
    def calculate_cumulative_returns_series(returns: pd.Series) -> pd.Series:
        """
        Calculate cumulative return at each point in time
        
        Args:
            returns: Series of monthly returns
        
        Returns:
            Series of cumulative returns indexed by date
        """
        # Convert to decimal
        decimal_returns = returns / 100
        
        # Calculate cumulative product
        cumulative = (1 + decimal_returns).cumprod() - 1
        
        # Convert back to percentage
        return cumulative * 100
```

### 2.3 API Endpoints - Phase 2

#### Endpoint 1: Get Returns Data
```python
# GET /api/returns/{fund_id}
# Query params: start_date, end_date

@router.get("/returns/{fund_id}")
async def get_returns(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get monthly returns for a fund
    
    Returns:
        List of date/return pairs
    """
    pass
```

**Response:**
```json
{
  "fund_id": 1,
  "fund_name": "10X S&P SA Top 50 ETF",
  "returns": [
    {"date": "2024-01-31", "monthly_return": 2.45},
    {"date": "2024-02-29", "monthly_return": 1.33},
    {"date": "2024-03-31", "monthly_return": 3.12}
  ],
  "start_date": "2024-01-31",
  "end_date": "2025-01-31"
}
```

#### Endpoint 2: Get Performance Metrics
```python
# GET /api/performance/{fund_id}

@router.get("/performance/{fund_id}")
async def get_performance(fund_id: int):
    """
    Get performance metrics for standard periods
    
    Returns:
        Performance metrics for 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, ITD
    """
    pass
```

**Response:**
```json
{
  "fund_id": 1,
  "fund_name": "10X S&P SA Top 50 ETF",
  "as_of_date": "2025-01-31",
  "performance": {
    "1M": 3.62,
    "3M": 0.91,
    "6M": 5.23,
    "1Y": 12.45,
    "3Y": 8.23,
    "5Y": 9.12,
    "10Y": 10.45,
    "ITD": 11.23
  },
  "inception_date": "2015-06-01"
}
```

#### Endpoint 3: Get Calendar Year Returns
```python
# GET /api/performance/{fund_id}/calendar-years

@router.get("/performance/{fund_id}/calendar-years")
async def get_calendar_year_returns(fund_id: int):
    """
    Get calendar year returns
    
    Returns:
        Annual returns by calendar year
    """
    pass
```

**Response:**
```json
{
  "fund_id": 1,
  "fund_name": "10X S&P SA Top 50 ETF",
  "calendar_year_returns": {
    "2015": 7.23,
    "2016": 8.45,
    "2017": 15.67,
    "2018": -5.23,
    "2019": 12.34,
    "2020": 3.45,
    "2021": 23.12,
    "2022": -8.45,
    "2023": 15.23,
    "2024": 11.45
  }
}
```

#### Endpoint 4: Compare Performance (Multiple Funds)
```python
# POST /api/performance/compare
# Body: { fund_ids: [1, 2, 3], start_date: "2020-01-31", end_date: "2025-01-31" }

@router.post("/performance/compare")
async def compare_performance(
    fund_ids: List[int],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Compare performance of multiple funds
    
    Returns:
        Performance data for all selected funds
    """
    pass
```

### 2.4 Frontend Components - Phase 2

#### New Components
```
src/
├── components/
│   ├── Performance/
│   │   ├── PerformanceOverview.js      # Main performance view
│   │   ├── PeriodSelector.js           # Time period selection
│   │   ├── PerformanceTable.js         # Period returns table
│   │   ├── CalendarYearTable.js        # Calendar year returns
│   │   ├── TotalReturnChart.js         # Line chart
│   │   └── PerformanceComparison.js    # Multi-fund comparison
│   └── Charts/
│       ├── LineChart.js                # Reusable line chart
│       └── ChartLegend.js              # Chart legend component
```

#### Period Selector Component
```javascript
// Features:
- Preset periods: 1M, 3M, 6M, YTD, 1Y, 3Y, 5Y, 10Y, ITD
- Custom date range picker
- "Compare to benchmark" toggle
- Export chart button
```

#### Total Return Chart
```javascript
// Features:
- Interactive line chart using Recharts/Plotly
- Multiple fund overlay
- Zoom and pan functionality
- Tooltip showing date and return value
- Toggle between cumulative and annualized returns
- Rebased to 100 at start date
- Downloadable as image
```

#### Performance Tables

**Period Returns Table:**
| Period | Fund A | Fund B | Fund C | Difference (A vs B) |
|--------|--------|--------|--------|---------------------|
| 1M     | 3.62%  | 2.45%  | 4.12%  | +1.17%              |
| 3M     | 0.91%  | 1.23%  | -0.45% | -0.32%              |
| 6M     | 5.23%  | 4.56%  | 6.78%  | +0.67%              |
| 1Y     | 12.45% | 11.23% | 13.67% | +1.22%              |
| 3Y*    | 8.23%  | 7.45%  | 9.12%  | +0.78%              |

*Annualized

**Calendar Year Returns Table:**
| Year | Fund A  | Fund B  | Fund C  |
|------|---------|---------|---------|
| 2024 | 11.45%  | 10.23%  | 12.67%  |
| 2023 | 15.23%  | 14.56%  | 16.12%  |
| 2022 | -8.45%  | -7.23%  | -9.12%  |
| 2021 | 23.12%  | 21.45%  | 24.67%  |
| 2020 | 3.45%   | 4.23%   | 2.89%   |

### 2.5 Phase 2 Deliverables

✅ Performance calculation engine with comprehensive metrics  
✅ API endpoints for returns and performance data  
✅ Time period selector with preset and custom ranges  
✅ Interactive total return chart  
✅ Period returns table  
✅ Calendar year returns table  
✅ Multi-fund performance comparison  
✅ Export chart functionality  

---

## Phase 3: Risk Analysis

### 3.1 Objectives
- Implement risk metrics calculations
- Create drawdown analysis
- Build risk-return scatter plot
- Display volatility metrics
- Compare risk profiles

### 3.2 Risk Calculations Module

```python
# backend/app/utils/risk_calculations.py

class RiskCalculator:
    """Calculate fund risk metrics"""
    
    @staticmethod
    def calculate_volatility(returns: pd.Series, annualize: bool = True) -> float:
        """Calculate standard deviation of returns"""
        if len(returns) < 2:
            return 0.0
        
        std_dev = returns.std()
        
        if annualize:
            std_dev = std_dev * np.sqrt(12)  # Monthly to annual
        
        return std_dev
    
    @staticmethod
    def calculate_downside_deviation(returns: pd.Series, annualize: bool = True) -> float:
        """Calculate downside deviation (semi-deviation)"""
        negative_returns = returns[returns < 0]
        
        if len(negative_returns) < 2:
            return 0.0
        
        downside_dev = negative_returns.std()
        
        if annualize:
            downside_dev = downside_dev * np.sqrt(12)
        
        return downside_dev
    
    @staticmethod
    def calculate_drawdown_series(cumulative_returns: pd.Series) -> pd.Series:
        """
        Calculate drawdown series
        
        Args:
            cumulative_returns: Series of cumulative returns
        
        Returns:
            Series of drawdown values (negative percentages)
        """
        # Convert to wealth index
        wealth_index = 1 + cumulative_returns / 100
        
        # Calculate running maximum
        running_max = wealth_index.expanding().max()
        
        # Calculate drawdown
        drawdown = (wealth_index - running_max) / running_max * 100
        
        return drawdown
    
    @staticmethod
    def calculate_max_drawdown(returns: pd.Series) -> Dict[str, any]:
        """
        Calculate maximum drawdown and related metrics
        
        Returns:
            Dictionary with max_drawdown, peak_date, trough_date, recovery_date
        """
        cumulative_returns = PerformanceCalculator.calculate_cumulative_returns_series(returns)
        drawdown_series = RiskCalculator.calculate_drawdown_series(cumulative_returns)
        
        max_dd = drawdown_series.min()
        max_dd_date = drawdown_series.idxmin()
        
        # Find peak before max drawdown
        pre_dd_returns = cumulative_returns[:max_dd_date]
        if len(pre_dd_returns) > 0:
            peak_date = pre_dd_returns.idxmax()
        else:
            peak_date = cumulative_returns.index[0]
        
        # Find recovery date (if recovered)
        post_dd_returns = cumulative_returns[max_dd_date:]
        peak_value = cumulative_returns[peak_date]
        recovery_dates = post_dd_returns[post_dd_returns >= peak_value]
        
        recovery_date = recovery_dates.index[0] if len(recovery_dates) > 0 else None
        
        return {
            'max_drawdown': max_dd,
            'peak_date': peak_date,
            'trough_date': max_dd_date,
            'recovery_date': recovery_date,
            'drawdown_duration_months': len(cumulative_returns[peak_date:max_dd_date]) if peak_date != max_dd_date else 0
        }
    
    @staticmethod
    def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
        """
        Calculate Sharpe ratio
        
        Args:
            returns: Series of monthly returns
            risk_free_rate: Annual risk-free rate (%)
        
        Returns:
            Sharpe ratio
        """
        if len(returns) < 2:
            return 0.0
        
        excess_returns = returns - (risk_free_rate / 12)  # Convert annual to monthly
        
        annualized_return = PerformanceCalculator.calculate_annualized_return(excess_returns)
        annualized_vol = RiskCalculator.calculate_volatility(returns, annualize=True)
        
        if annualized_vol == 0:
            return 0.0
        
        sharpe = annualized_return / annualized_vol
        return sharpe
    
    @staticmethod
    def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
        """Calculate Sortino ratio using downside deviation"""
        if len(returns) < 2:
            return 0.0
        
        excess_returns = returns - (risk_free_rate / 12)
        
        annualized_return = PerformanceCalculator.calculate_annualized_return(excess_returns)
        downside_dev = RiskCalculator.calculate_downside_deviation(returns, annualize=True)
        
        if downside_dev == 0:
            return 0.0
        
        sortino = annualized_return / downside_dev
        return sortino
    
    @staticmethod
    def calculate_risk_metrics(returns: pd.Series, risk_free_rate: float = 0.0) -> Dict[str, float]:
        """
        Calculate comprehensive risk metrics
        
        Returns:
            Dictionary of all risk metrics
        """
        metrics = {
            'volatility': RiskCalculator.calculate_volatility(returns),
            'downside_deviation': RiskCalculator.calculate_downside_deviation(returns),
            'best_month': returns.max(),
            'worst_month': returns.min(),
            'positive_months': (returns > 0).sum(),
            'negative_months': (returns < 0).sum(),
            'sharpe_ratio': RiskCalculator.calculate_sharpe_ratio(returns, risk_free_rate),
            'sortino_ratio': RiskCalculator.calculate_sortino_ratio(returns, risk_free_rate)
        }
        
        # Add max drawdown metrics
        max_dd_metrics = RiskCalculator.calculate_max_drawdown(returns)
        metrics.update(max_dd_metrics)
        
        return metrics
```

### 3.3 API Endpoints - Phase 3

#### Endpoint 1: Get Risk Metrics
```python
# GET /api/risk/{fund_id}
# Query params: start_date, end_date, risk_free_rate

@router.get("/risk/{fund_id}")
async def get_risk_metrics(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    risk_free_rate: float = 0.0
):
    """Get comprehensive risk metrics for a fund"""
    pass
```

**Response:**
```json
{
  "fund_id": 1,
  "fund_name": "10X S&P SA Top 50 ETF",
  "period": {
    "start_date": "2020-01-31",
    "end_date": "2025-01-31"
  },
  "risk_metrics": {
    "volatility": 12.34,
    "downside_deviation": 8.45,
    "max_drawdown": -15.23,
    "max_drawdown_details": {
      "peak_date": "2021-11-30",
      "trough_date": "2022-06-30",
      "recovery_date": "2023-03-31",
      "duration_months": 7
    },
    "best_month": 8.45,
    "worst_month": -6.23,
    "positive_months": 38,
    "negative_months": 22,
    "sharpe_ratio": 0.85,
    "sortino_ratio": 1.23
  }
}
```

#### Endpoint 2: Get Drawdown Series
```python
# GET /api/risk/{fund_id}/drawdown

@router.get("/risk/{fund_id}/drawdown")
async def get_drawdown_series(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get drawdown time series for charting"""
    pass
```

#### Endpoint 3: Compare Risk Metrics
```python
# POST /api/risk/compare

@router.post("/risk/compare")
async def compare_risk(
    fund_ids: List[int],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Compare risk metrics across multiple funds"""
    pass
```

### 3.4 Frontend Components - Phase 3

#### New Components
```
src/
├── components/
│   ├── Risk/
│   │   ├── RiskOverview.js          # Main risk view
│   │   ├── RiskMetricsTable.js      # Risk metrics display
│   │   ├── DrawdownChart.js         # Drawdown visualization
│   │   ├── RiskReturnScatter.js     # Risk vs return plot
│   │   └── RiskComparison.js        # Multi-fund risk comparison
```

#### Drawdown Chart
```javascript
// Features:
- Area chart showing drawdown over time
- Highlight maximum drawdown period
- Show recovery periods
- Multiple funds overlay
- Zoom to specific drawdown events
```

#### Risk-Return Scatter Plot
```javascript
// Features:
- X-axis: Annualized volatility
- Y-axis: Annualized return
- Each point represents a fund
- Point size: AUM or other metric
- Color code by category
- Efficient frontier line (optional)
- Quadrant labels (high return/low risk, etc.)
- Interactive tooltips
```

#### Risk Metrics Table
| Metric | Fund A | Fund B | Fund C | Category Avg |
|--------|--------|--------|--------|--------------|
| Annualized Return | 12.45% | 11.23% | 13.67% | 11.89% |
| Volatility | 12.34% | 10.23% | 15.45% | 12.56% |
| Max Drawdown | -15.23% | -12.34% | -18.45% | -14.67% |
| Sharpe Ratio | 0.85 | 0.92 | 0.76 | 0.81 |
| Sortino Ratio | 1.23 | 1.34 | 1.12 | 1.18 |
| Best Month | 8.45% | 7.23% | 10.12% | 8.12% |
| Worst Month | -6.23% | -5.12% | -7.89% | -6.34% |

### 3.5 Phase 3 Deliverables

✅ Comprehensive risk calculation engine  
✅ API endpoints for risk metrics and drawdown data  
✅ Drawdown chart with multiple funds  
✅ Risk-return scatter plot  
✅ Risk metrics comparison table  
✅ Detailed maximum drawdown analysis  

---

## Phase 4: Advanced Features

### 4.1 Objectives
- Custom date range selection with validation
- Support for up to 10 fund comparison
- Export functionality (PDF reports, Excel data)
- Performance attribution (if benchmark data available)
- Rolling returns analysis
- Correlation matrix

### 4.2 Features Overview

#### Custom Date Ranges
- Calendar picker for start/end dates
- Validation against fund inception dates
- Warning for short/incomplete periods
- Quick shortcuts (YTD, Last 12M, Last 3Y, etc.)

#### Multi-Fund Comparison (up to 10 funds)
- Select funds from searchable list
- Drag to reorder
- Save comparison sets
- Color-coded charts and tables
- Summary statistics

#### Export Functionality
```python
# Export formats:
1. PDF Report
   - Executive summary
   - Performance charts
   - Risk analysis
   - Tables with all metrics
   
2. Excel Workbook
   - Summary sheet
   - Returns data sheet
   - Metrics sheet
   - Charts embedded
   
3. CSV Data
   - Raw returns data
   - Calculated metrics
```

#### Rolling Returns
- Calculate N-month rolling returns
- Visualize as line chart or histogram
- Compare consistency across funds
- Identify periods of outperformance

#### Correlation Matrix
- Show correlation between selected funds
- Heatmap visualization
- Use for diversification analysis

### 4.3 Phase 4 Deliverables

✅ Custom date range picker with validation  
✅ Extended multi-fund comparison (10 funds)  
✅ PDF report generation  
✅ Excel export functionality  
✅ Rolling returns analysis  
✅ Correlation matrix  
✅ Saved comparison sets  

---

## Phase 5: Polish & Deployment

### 5.1 UI/UX Refinements
- Responsive design for mobile/tablet
- Improved loading states and animations
- Keyboard shortcuts
- Dark mode option
- Accessibility improvements (WCAG compliance)
- Help tooltips and documentation

### 5.2 Performance Optimization
- API response caching (Redis)
- Database query optimization
- Lazy loading of charts
- Code splitting
- CDN for static assets

### 5.3 Testing & Quality Assurance
- Unit tests (>80% coverage)
- Integration tests for API
- End-to-end tests for critical flows
- Performance testing
- Security audit

### 5.4 Documentation
- User guide
- API documentation
- Developer setup guide
- Deployment documentation

### 5.5 Deployment
- Docker containerization
- CI/CD pipeline setup
- Production environment configuration
- Monitoring and logging setup
- Backup strategy

### 5.6 Phase 5 Deliverables

✅ Polished, responsive UI  
✅ Comprehensive test suite  
✅ Complete documentation  
✅ Production deployment  
✅ Monitoring and alerting  
✅ User training materials  

---

## Technology Stack Summary

### Backend
- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Data Processing**: Pandas, NumPy
- **Testing**: pytest, pytest-cov
- **Documentation**: Swagger/OpenAPI (auto-generated)

### Frontend
- **Framework**: React 18+
- **Routing**: React Router v6
- **State Management**: React Context / Redux Toolkit
- **Styling**: Tailwind CSS / Material-UI
- **Charts**: Recharts or Plotly.js
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **Testing**: Jest, React Testing Library

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions / GitLab CI
- **Hosting**: AWS / Azure / DigitalOcean
- **Monitoring**: Sentry, LogRocket
- **Analytics**: Google Analytics (optional)

---

## Success Metrics

### Technical Metrics
- API response time < 500ms for 95% of requests
- Frontend page load < 2 seconds
- 80%+ code coverage
- Zero critical security vulnerabilities

### User Metrics
- Easy fund discovery (< 3 clicks to find fund)
- Fast comparison setup (< 30 seconds for 5 funds)
- Comprehensive analysis (all key metrics visible)
- Export ready in < 10 seconds

---

## Future Enhancements (Post-Launch)

1. **Benchmark Comparison**
   - Add benchmark indices
   - Relative performance metrics
   - Tracking error calculations

2. **Portfolio Analysis**
   - Create hypothetical portfolios
   - Rebalancing analysis
   - Asset allocation optimization

3. **Alerts & Notifications**
   - Performance alerts
   - Risk threshold notifications
   - New fund additions

4. **Advanced Analytics**
   - Factor analysis
   - Style drift detection
   - Peer group rankings

5. **User Features**
   - Save favorite funds
   - Custom watchlists
   - Personalized dashboards

---

## Risk Mitigation

### Technical Risks
- **Data Quality**: Implement validation and anomaly detection
- **Performance**: Use caching and database optimization
- **Scalability**: Design for horizontal scaling from start

### Project Risks
- **Scope Creep**: Stick to phased approach, document future enhancements
- **Timeline**: Buffer in each phase for unexpected issues
- **Resource Constraints**: Prioritize core features over nice-to-haves

---

*Document Version: 1.0*  
*Last Updated: November 8, 2025*  
*Author: Jordan - GSPW Investment Management*
