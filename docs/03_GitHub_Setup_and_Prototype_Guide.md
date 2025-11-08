# Fund Analysis WebApp - GitHub Setup & Prototype Guide

## Document Overview
This guide provides step-by-step instructions for setting up the project on GitHub and building the initial prototype with file upload functionality.

---

## 1. GitHub Repository Setup

### 1.1 Create Repository

**Repository Name:** `fund-analysis-webapp`

**Description:** Interactive web application for analyzing and comparing mutual fund performance using Morningstar data

**Repository Settings:**
- Visibility: Private (recommended) or Public
- Initialize with README: Yes
- Add .gitignore: Python
- License: MIT (or your preference)

### 1.2 Repository Structure

```
fund-analysis-webapp/
├── .github/
│   └── workflows/              # GitHub Actions (CI/CD) - optional
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── storage.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py
│   │   │   ├── funds.py
│   │   │   ├── returns.py
│   │   │   └── dependencies.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── parser.py
│   │       ├── calculations.py
│   │       └── validators.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_parser.py
│   │   └── test_api.py
│   ├── uploads/                # Temp directory (in .gitignore)
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Upload/
│   │   │   ├── FundList/
│   │   │   ├── FundDetail/
│   │   │   └── Common/
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── FundsPage.js
│   │   │   ├── FundDetailPage.js
│   │   │   └── ComparePage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   └── constants.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── docs/
│   ├── 01_Data_Understanding_and_Architecture.md
│   ├── 02_WebApp_Development_Plan.md
│   └── api-documentation.md
├── .gitignore
├── README.md
└── LICENSE
```

### 1.3 .gitignore Configuration

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
dist/
*.egg-info/

# Backend
backend/uploads/*
backend/.env

# Frontend
frontend/node_modules/
frontend/build/
frontend/.env
frontend/.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Data files (don't commit uploaded data)
*.xlsx
*.xls
*.csv

# Logs
*.log
```

---

## 2. Initial Project Setup

### 2.1 Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/fund-analysis-webapp.git
cd fund-analysis-webapp
```

### 2.2 Backend Setup

#### Step 1: Create Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

#### Step 2: Install Dependencies

Create `requirements.txt`:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pandas==2.1.3
openpyxl==3.1.2
numpy==1.26.2
pydantic==2.5.0
python-dateutil==2.8.2
pytest==7.4.3
pytest-cov==4.1.0
httpx==0.25.1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

#### Step 3: Create Basic Backend Structure

**backend/app/main.py:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, funds

app = FastAPI(
    title="Fund Analysis API",
    description="API for analyzing mutual fund performance",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(funds.router, prefix="/api", tags=["funds"])

@app.get("/")
async def root():
    return {"message": "Fund Analysis API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**backend/app/storage.py:**

```python
import pandas as pd
from typing import Optional, Dict
from datetime import datetime

class DataStore:
    """Singleton in-memory data store for uploaded fund data"""
    
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

**backend/app/utils/parser.py:**

```python
import pandas as pd
from typing import Tuple, List

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

**backend/app/api/dependencies.py:**

```python
from fastapi import HTTPException, Depends
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

**backend/app/api/upload.py:**

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.parser import MorningstarParser
from app.storage import DataStore
import io

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
        raise HTTPException(
            status_code=400, 
            detail="File must be Excel format (.xlsx or .xls)"
        )
    
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
            "summary": data_store.get_summary()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing file: {str(e)}"
        )

@router.get("/data-status")
async def get_data_status():
    """Check if data is loaded and get summary"""
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
    """Clear loaded data from memory"""
    data_store = DataStore()
    data_store.clear_data()
    
    return {
        "status": "success",
        "message": "Data cleared successfully"
    }
```

**backend/app/api/funds.py:**

```python
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from app.storage import DataStore
from app.api.dependencies import require_data

router = APIRouter()

@router.get("/funds", dependencies=[Depends(require_data)])
async def get_funds(
    category: Optional[str] = None,
    sector: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get list of funds with optional filtering"""
    data_store = DataStore()
    funds_df = data_store.get_funds()
    
    # Apply filters
    if category:
        funds_df = funds_df[funds_df['Morningstar Category'] == category]
    
    if sector:
        funds_df = funds_df[funds_df['ASISA Sector (South Africa)'] == sector]
    
    if search:
        funds_df = funds_df[
            funds_df['fund_name'].str.contains(search, case=False, na=False)
        ]
    
    # Paginate
    total = len(funds_df)
    funds_df = funds_df.iloc[skip:skip+limit]
    
    # Select key fields
    key_fields = [
        'fund_id', 'fund_name', 'ISIN', 'Firm Name',
        'Morningstar Category', 'ASISA Sector (South Africa)',
        'Morningstar Rating Overall', 'Management Fee'
    ]
    
    # Only include fields that exist
    available_fields = [f for f in key_fields if f in funds_df.columns]
    funds_list = funds_df[available_fields].to_dict('records')
    
    # Replace NaN with None for JSON serialization
    for fund in funds_list:
        for key, value in fund.items():
            if pd.isna(value):
                fund[key] = None
    
    return {
        "total": total,
        "funds": funds_list
    }

@router.get("/funds/{fund_id}", dependencies=[Depends(require_data)])
async def get_fund_detail(fund_id: int):
    """Get detailed information for a single fund"""
    data_store = DataStore()
    fund = data_store.get_fund_by_id(fund_id)
    
    if fund is None:
        raise HTTPException(status_code=404, detail="Fund not found")
    
    # Get inception date
    returns = data_store.get_returns_by_fund_id(fund_id)
    inception_date = returns['date'].min() if returns is not None and len(returns) > 0 else None
    
    # Convert to dict
    fund_dict = fund.to_dict()
    fund_dict['inception_date'] = inception_date.strftime('%Y-%m-%d') if inception_date else None
    
    # Replace NaN with None
    import pandas as pd
    for key, value in fund_dict.items():
        if pd.isna(value):
            fund_dict[key] = None
    
    return fund_dict
```

#### Step 4: Run Backend

```bash
# Make sure you're in backend directory with venv activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Test the API:
- Open browser: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

### 2.3 Frontend Setup

#### Step 1: Create React App

```bash
# From project root
cd frontend

# Create React app
npx create-react-app .

# Or if directory already exists:
npx create-react-app fund-analysis-frontend
# Then move files into frontend directory
```

#### Step 2: Install Dependencies

```bash
npm install axios react-router-dom recharts
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
# Or use Tailwind CSS instead
```

#### Step 3: Create Basic Frontend Structure

**frontend/src/services/api.js:**

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getDataStatus = async () => {
  const response = await api.get('/data-status');
  return response.data;
};

export const getFunds = async (filters = {}) => {
  const response = await api.get('/funds', { params: filters });
  return response.data;
};

export const getFundDetail = async (fundId) => {
  const response = await api.get(`/funds/${fundId}`);
  return response.data;
};

export default api;
```

**frontend/src/components/Upload/FileUpload.js:**

```javascript
import React, { useState } from 'react';
import { uploadFile } from '../../services/api';

function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadFile(file);
      onUploadSuccess(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h2>Upload Morningstar Data</h2>
      <input 
        type="file" 
        accept=".xlsx,.xls" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button 
        onClick={handleUpload}
        disabled={uploading || !file}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default FileUpload;
```

**frontend/src/App.js:**

```javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileUpload from './components/Upload/FileUpload';
import { getDataStatus } from './services/api';
import './App.css';

function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);

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

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Fund Analysis WebApp</h1>
        </header>
        
        <main>
          {!dataLoaded ? (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <div className="data-summary">
              <h2>Data Loaded Successfully</h2>
              <p>Total Funds: {dataSummary?.total_funds}</p>
              <p>Date Range: {dataSummary?.date_range?.start} to {dataSummary?.date_range?.end}</p>
              <p>Total Periods: {dataSummary?.total_periods}</p>
              <button onClick={() => window.location.reload()}>Upload New File</button>
            </div>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
```

#### Step 4: Create .env File

**frontend/.env:**

```
REACT_APP_API_URL=http://localhost:8000/api
```

#### Step 5: Run Frontend

```bash
# Make sure you're in frontend directory
npm start
```

Application will open at `http://localhost:3000`

---

## 3. Testing the Prototype

### 3.1 Manual Testing

1. **Start Backend**
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   uvicorn app.main:app --reload
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Upload**
   - Open `http://localhost:3000`
   - Upload your Morningstar Excel file
   - Verify data summary appears

4. **Test API Directly**
   - Open `http://localhost:8000/docs`
   - Test upload endpoint
   - Test funds endpoint

### 3.2 Automated Tests

**backend/tests/test_parser.py:**

```python
import pytest
from app.utils.parser import MorningstarParser

def test_parser_initialization():
    parser = MorningstarParser()
    assert parser is not None

# Add more tests as you develop
```

Run tests:

```bash
cd backend
pytest
```

---

## 4. Git Workflow

### 4.1 Initial Commit

```bash
# From project root
git add .
git commit -m "Initial project setup with file upload functionality"
git push origin main
```

### 4.2 Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/fund-list-view

# Make changes, then commit
git add .
git commit -m "Add fund list view component"

# Push to remote
git push origin feature/fund-list-view

# Create pull request on GitHub
# After review and merge, pull main
git checkout main
git pull origin main
```

---

## 5. Next Steps

### Phase 1 Completion Checklist

- [x] Backend file upload API
- [x] Frontend upload component
- [ ] Fund list view
- [ ] Fund detail view
- [ ] Fund comparison (static)
- [ ] Search and filtering
- [ ] Error handling
- [ ] Loading states

### Development Priorities

1. Complete fund list view with filtering
2. Add fund detail page
3. Implement basic comparison
4. Add better UI/UX (styling)
5. Move to Phase 2 (Performance analysis)

---

## 6. Deployment Considerations (Future)

### Local Development
- Currently set up for local development
- Data stored in memory (resets on restart)

### Production Deployment Options
1. **Heroku** (simple deployment)
2. **AWS EC2 + S3** (scalable)
3. **Docker + Cloud Run** (containerized)
4. **Vercel (frontend) + Railway (backend)**

---

## 7. Troubleshooting

### Common Issues

**CORS errors:**
```python
# Ensure CORS is configured in backend/app/main.py
# Allow your frontend origin
```

**Import errors:**
```bash
# Make sure virtual environment is activated
# Reinstall dependencies if needed
pip install -r requirements.txt
```

**Port already in use:**
```bash
# Change port in uvicorn command
uvicorn app.main:app --reload --port 8001
```

**React proxy issues:**
```json
// Add to frontend/package.json
"proxy": "http://localhost:8000"
```

---

*Document Version: 1.0*  
*Last Updated: November 8, 2025*  
*Author: Jordan - GSPW Investment Management*
