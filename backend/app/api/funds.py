from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
import pandas as pd
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
        if 'Morningstar Category' in funds_df.columns:
            funds_df = funds_df[funds_df['Morningstar Category'] == category]

    if sector:
        if 'ASISA Sector (South Africa)' in funds_df.columns:
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
    for key, value in fund_dict.items():
        if pd.isna(value):
            fund_dict[key] = None

    return fund_dict


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

    # Only include fields that exist
    available_fields = [f for f in comparison_fields if f in selected_funds.columns]
    funds_list = selected_funds[available_fields].to_dict('records')

    # Replace NaN with None
    for fund in funds_list:
        for key, value in fund.items():
            if pd.isna(value):
                fund[key] = None

    return {
        "funds": funds_list,
        "comparison_fields": available_fields
    }
