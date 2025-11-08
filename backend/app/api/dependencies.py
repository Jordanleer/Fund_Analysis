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
