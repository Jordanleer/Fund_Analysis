import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime


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
    def calculate_period_returns(returns_df: pd.DataFrame) -> Dict[str, Optional[float]]:
        """
        Calculate returns for standard periods (1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, ITD)

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns

        Returns:
            Dictionary of period returns
        """
        if len(returns_df) == 0:
            return {}

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
        if len(returns_df) == 0:
            return {}

        returns_df = returns_df.copy()
        returns_df['year'] = returns_df['date'].dt.year

        year_returns = {}
        for year in sorted(returns_df['year'].unique()):
            year_data = returns_df[returns_df['year'] == year]['monthly_return']
            year_returns[int(year)] = PerformanceCalculator.calculate_total_return(year_data)

        return year_returns

    @staticmethod
    def calculate_cumulative_returns_series(returns_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate cumulative return at each point in time

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns

        Returns:
            DataFrame with date and cumulative_return columns
        """
        if len(returns_df) == 0:
            return pd.DataFrame(columns=['date', 'cumulative_return'])

        df = returns_df.sort_values('date').copy()

        # Convert to decimal
        decimal_returns = df['monthly_return'] / 100

        # Calculate cumulative product
        cumulative = (1 + decimal_returns).cumprod() - 1

        # Convert back to percentage
        df['cumulative_return'] = cumulative * 100

        return df[['date', 'cumulative_return']]

    @staticmethod
    def calculate_ytd_return(returns_df: pd.DataFrame) -> Optional[float]:
        """
        Calculate Year-To-Date return

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns

        Returns:
            YTD return (%)
        """
        if len(returns_df) == 0:
            return None

        latest_date = returns_df['date'].max()
        current_year = latest_date.year
        year_start = pd.Timestamp(f'{current_year}-01-01')

        ytd_data = returns_df[returns_df['date'] >= year_start]['monthly_return']

        if len(ytd_data) == 0:
            return None

        return PerformanceCalculator.calculate_total_return(ytd_data)

    @staticmethod
    def calculate_rolling_returns(
        returns_df: pd.DataFrame,
        window_months: int = 12
    ) -> pd.DataFrame:
        """
        Calculate rolling returns over specified window

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns
            window_months: Rolling window size in months

        Returns:
            DataFrame with date and rolling_return columns
        """
        if len(returns_df) < window_months:
            return pd.DataFrame(columns=['date', 'rolling_return'])

        df = returns_df.sort_values('date').copy()

        rolling_returns = []
        for i in range(window_months - 1, len(df)):
            window_data = df.iloc[i - window_months + 1:i + 1]['monthly_return']
            rolling_return = PerformanceCalculator.calculate_annualized_return(window_data)
            rolling_returns.append({
                'date': df.iloc[i]['date'],
                'rolling_return': rolling_return
            })

        return pd.DataFrame(rolling_returns)
