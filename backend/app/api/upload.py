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
