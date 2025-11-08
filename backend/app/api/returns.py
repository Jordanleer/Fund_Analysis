from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
import pandas as pd
from app.storage import DataStore
from app.api.dependencies import require_data
from app.utils.calculations import PerformanceCalculator

router = APIRouter()


class MultipleReturnsRequest(BaseModel):
    fund_ids: List[int]
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/returns/{fund_id}", dependencies=[Depends(require_data)])
async def get_returns(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get monthly returns for a fund

    Args:
        fund_id: Fund ID
        start_date: Optional start date (YYYY-MM-DD)
        end_date: Optional end date (YYYY-MM-DD)

    Returns:
        List of date/return pairs with cumulative returns
    """
    data_store = DataStore()

    # Get fund info
    fund = data_store.get_fund_by_id(fund_id)
    if fund is None:
        raise HTTPException(status_code=404, detail="Fund not found")

    # Get returns
    returns_df = data_store.get_returns_by_fund_id(fund_id, start_date, end_date)
    if returns_df is None or len(returns_df) == 0:
        raise HTTPException(status_code=404, detail="No returns data found for this fund")

    # Calculate cumulative returns
    cumulative_df = PerformanceCalculator.calculate_cumulative_returns_series(returns_df)

    # Merge with monthly returns
    result_df = returns_df.merge(cumulative_df, on='date')
    result_df = result_df.sort_values('date')

    # Format for response
    returns_list = []
    for _, row in result_df.iterrows():
        returns_list.append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'monthly_return': float(row['monthly_return']),
            'cumulative_return': float(row['cumulative_return'])
        })

    return {
        "fund_id": fund_id,
        "fund_name": fund['fund_name'],
        "returns": returns_list,
        "start_date": result_df['date'].min().strftime('%Y-%m-%d'),
        "end_date": result_df['date'].max().strftime('%Y-%m-%d'),
        "total_periods": len(returns_list)
    }


@router.post("/returns/multiple", dependencies=[Depends(require_data)])
async def get_multiple_returns(request: MultipleReturnsRequest):
    """
    Get returns for multiple funds

    Args:
        request: Request containing fund_ids, start_date, and end_date

    Returns:
        Returns data for all requested funds
    """
    data_store = DataStore()

    funds_returns = []

    for fund_id in request.fund_ids:
        fund = data_store.get_fund_by_id(fund_id)
        if fund is None:
            continue

        returns_df = data_store.get_returns_by_fund_id(fund_id, request.start_date, request.end_date)
        if returns_df is None or len(returns_df) == 0:
            continue

        # Calculate cumulative returns
        cumulative_df = PerformanceCalculator.calculate_cumulative_returns_series(returns_df)
        result_df = returns_df.merge(cumulative_df, on='date').sort_values('date')

        returns_list = []
        for _, row in result_df.iterrows():
            returns_list.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'monthly_return': float(row['monthly_return']),
                'cumulative_return': float(row['cumulative_return'])
            })

        funds_returns.append({
            'fund_id': fund_id,
            'fund_name': fund['fund_name'],
            'returns': returns_list
        })

    return {
        "funds": funds_returns,
        "start_date": request.start_date,
        "end_date": request.end_date
    }
