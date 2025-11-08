import pandas as pd
from typing import Optional, Dict
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
