from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
import pandas as pd
from app.storage import DataStore
from app.api.dependencies import require_data
from app.utils.calculations import PerformanceCalculator
from app.utils.risk_calculations import RiskCalculator

router = APIRouter()


@router.get("/performance/{fund_id}", dependencies=[Depends(require_data)])
async def get_performance(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get performance metrics for standard periods

    Returns:
        Performance metrics for 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, ITD, YTD
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

    # Calculate period returns
    period_returns = PerformanceCalculator.calculate_period_returns(returns_df)

    # Calculate YTD
    ytd_return = PerformanceCalculator.calculate_ytd_return(returns_df)
    if ytd_return is not None:
        period_returns['YTD'] = ytd_return

    # Get inception date
    inception_date = returns_df['date'].min().strftime('%Y-%m-%d')
    as_of_date = returns_df['date'].max().strftime('%Y-%m-%d')

    return {
        "fund_id": fund_id,
        "fund_name": fund['fund_name'],
        "as_of_date": as_of_date,
        "inception_date": inception_date,
        "performance": period_returns
    }


@router.get("/performance/{fund_id}/calendar-years", dependencies=[Depends(require_data)])
async def get_calendar_year_returns(fund_id: int):
    """
    Get calendar year returns

    Returns:
        Annual returns by calendar year
    """
    data_store = DataStore()

    # Get fund info
    fund = data_store.get_fund_by_id(fund_id)
    if fund is None:
        raise HTTPException(status_code=404, detail="Fund not found")

    # Get returns
    returns_df = data_store.get_returns_by_fund_id(fund_id)
    if returns_df is None or len(returns_df) == 0:
        raise HTTPException(status_code=404, detail="No returns data found for this fund")

    # Calculate calendar year returns
    calendar_returns = PerformanceCalculator.calculate_calendar_year_returns(returns_df)

    return {
        "fund_id": fund_id,
        "fund_name": fund['fund_name'],
        "calendar_year_returns": calendar_returns
    }


@router.post("/performance/compare", dependencies=[Depends(require_data)])
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
    data_store = DataStore()

    funds_performance = []

    for fund_id in fund_ids:
        fund = data_store.get_fund_by_id(fund_id)
        if fund is None:
            continue

        returns_df = data_store.get_returns_by_fund_id(fund_id, start_date, end_date)
        if returns_df is None or len(returns_df) == 0:
            continue

        # Calculate metrics
        period_returns = PerformanceCalculator.calculate_period_returns(returns_df)
        ytd_return = PerformanceCalculator.calculate_ytd_return(returns_df)
        if ytd_return is not None:
            period_returns['YTD'] = ytd_return

        funds_performance.append({
            'fund_id': fund_id,
            'fund_name': fund['fund_name'],
            'performance': period_returns,
            'inception_date': returns_df['date'].min().strftime('%Y-%m-%d')
        })

    return {
        "funds": funds_performance,
        "as_of_date": end_date if end_date else None
    }


@router.get("/risk/{fund_id}", dependencies=[Depends(require_data)])
async def get_risk_metrics(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    risk_free_rate: float = 0.0
):
    """Get comprehensive risk metrics for a fund"""
    data_store = DataStore()

    # Get fund info
    fund = data_store.get_fund_by_id(fund_id)
    if fund is None:
        raise HTTPException(status_code=404, detail="Fund not found")

    # Get returns
    returns_df = data_store.get_returns_by_fund_id(fund_id, start_date, end_date)
    if returns_df is None or len(returns_df) == 0:
        raise HTTPException(status_code=404, detail="No returns data found for this fund")

    # Calculate risk metrics
    risk_metrics = RiskCalculator.calculate_risk_metrics(returns_df, risk_free_rate)

    return {
        "fund_id": fund_id,
        "fund_name": fund['fund_name'],
        "period": {
            "start_date": returns_df['date'].min().strftime('%Y-%m-%d'),
            "end_date": returns_df['date'].max().strftime('%Y-%m-%d')
        },
        "risk_metrics": risk_metrics
    }


@router.get("/risk/{fund_id}/drawdown", dependencies=[Depends(require_data)])
async def get_drawdown_series(
    fund_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get drawdown time series for charting"""
    data_store = DataStore()

    # Get fund info
    fund = data_store.get_fund_by_id(fund_id)
    if fund is None:
        raise HTTPException(status_code=404, detail="Fund not found")

    # Get returns
    returns_df = data_store.get_returns_by_fund_id(fund_id, start_date, end_date)
    if returns_df is None or len(returns_df) == 0:
        raise HTTPException(status_code=404, detail="No returns data found for this fund")

    # Calculate drawdown series
    drawdown_df = RiskCalculator.calculate_drawdown_series(returns_df)

    drawdown_list = []
    for _, row in drawdown_df.iterrows():
        drawdown_list.append({
            'date': row['date'].strftime('%Y-%m-%d'),
            'drawdown': float(row['drawdown'])
        })

    return {
        "fund_id": fund_id,
        "fund_name": fund['fund_name'],
        "drawdown_series": drawdown_list
    }
