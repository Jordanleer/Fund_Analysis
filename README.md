# Fund Analysis WebApp

An interactive web application for analyzing and comparing mutual fund performance using Morningstar data.

## Overview

This application allows investment analysts, portfolio managers, and advisors to:
- Upload and analyze Morningstar fund data
- View detailed fund information
- Search and filter funds by various criteria
- Compare multiple funds side-by-side
- Visualize performance and risk metrics (coming in Phase 2)

## Technology Stack

### Backend
- **Python 3.9+**
- **FastAPI** - Modern, fast web framework
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **uvicorn** - ASGI server

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization (for future phases)

## Project Structure

```
Fund_Analysis/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── storage.py         # In-memory data store
│   │   ├── api/               # API endpoints
│   │   └── utils/             # Utilities (parser, calculations)
│   ├── tests/                 # Backend tests
│   └── requirements.txt       # Python dependencies
│
├── frontend/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── utils/             # Utilities
│   └── package.json           # Node dependencies
│
├── docs/                      # Documentation
└── Fund analysis Instructions/ # Original requirement docs
```

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API Root: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

4. Run the development server:
```bash
npm start
```

The application will open at http://localhost:3000

## Usage

1. **Start both servers** (backend on port 8000, frontend on port 3000)

2. **Upload Data**:
   - Open http://localhost:3000
   - Upload a Morningstar Excel file (.xlsx or .xls)
   - The sample file `Morningstar_Data (Short).xlsx` is included in the repository

3. **Explore Funds**:
   - Browse the fund list
   - Search by fund name
   - Click on any fund to view detailed information

## Development Phases

### ✅ Phase 1: Foundation & Static Data (Current)
- [x] File upload functionality
- [x] Excel parsing for Morningstar data
- [x] In-memory data storage
- [x] Fund list with search and filtering
- [x] Detailed fund information view
- [x] Basic fund comparison

### 🚧 Phase 2: Performance Analysis Core (Next)
- [ ] Time period selector
- [ ] Performance calculations engine
- [ ] Total return charts
- [ ] Calendar year returns
- [ ] Period return tables

### 📋 Phase 3: Risk Analysis
- [ ] Risk metrics calculation
- [ ] Drawdown analysis
- [ ] Risk-return scatter plots
- [ ] Volatility metrics

### 📋 Phase 4: Advanced Features
- [ ] Custom date ranges
- [ ] Multi-fund comparison (up to 10 funds)
- [ ] Export to PDF/Excel
- [ ] Rolling returns analysis

### 📋 Phase 5: Polish & Deployment
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Production deployment

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints

**Upload:**
- `POST /api/upload` - Upload Morningstar Excel file
- `GET /api/data-status` - Check if data is loaded
- `DELETE /api/data` - Clear loaded data

**Funds:**
- `GET /api/funds` - List all funds (with filtering)
- `GET /api/funds/{fund_id}` - Get fund details
- `POST /api/funds/compare` - Compare multiple funds

## Data Storage

The application uses **in-memory storage** for the prototype:
- Data is stored in a singleton DataStore class
- Data persists until a new file is uploaded or the server restarts
- No database required for Phase 1
- Future phases may add PostgreSQL for production deployment

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

This is an internal project for GSPW Investment Management. For questions or suggestions, please contact the development team.

## License

Proprietary - GSPW Investment Management

## Acknowledgments

- Data provided by Morningstar
- Built for GSPW Performance & Positioning Review

---

**Version:** 0.1.0
**Last Updated:** November 8, 2025
**Author:** Jordan - GSPW Investment Management
