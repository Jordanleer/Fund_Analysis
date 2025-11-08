# Fund Analysis Backend

FastAPI-based backend for the Fund Analysis WebApp.

## Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. Access the API:
- API Root: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## API Endpoints

### Upload
- `POST /api/upload` - Upload Morningstar Excel file
- `GET /api/data-status` - Check if data is loaded
- `DELETE /api/data` - Clear loaded data

### Funds
- `GET /api/funds` - List all funds (with filtering)
- `GET /api/funds/{fund_id}` - Get fund details
- `POST /api/funds/compare` - Compare multiple funds

## Data Storage

The application uses in-memory storage (DataStore singleton). Data persists until:
- A new file is uploaded (replaces existing data)
- The server is restarted
- Data is manually cleared via the API

## Testing

Run tests with:
```bash
pytest
```

## Development

The backend is structured as follows:
- `app/main.py` - FastAPI application
- `app/storage.py` - In-memory data store
- `app/api/` - API endpoints
- `app/utils/` - Utility functions (parsers, calculations)
- `tests/` - Test files
