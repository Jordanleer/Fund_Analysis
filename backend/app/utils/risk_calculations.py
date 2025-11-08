import pandas as pd
import numpy as np
from typing import Dict, Optional
from app.utils.calculations import PerformanceCalculator


class RiskCalculator:
    """Calculate fund risk metrics"""

    @staticmethod
    def calculate_volatility(returns: pd.Series, annualize: bool = True) -> float:
        """
        Calculate standard deviation of returns

        Args:
            returns: Series of monthly returns (as percentages)
            annualize: Whether to annualize the result

        Returns:
            Volatility (%)
        """
        if len(returns) < 2:
            return 0.0

        std_dev = returns.std()

        if annualize:
            std_dev = std_dev * np.sqrt(12)  # Monthly to annual

        return float(std_dev)

    @staticmethod
    def calculate_downside_deviation(returns: pd.Series, annualize: bool = True) -> float:
        """
        Calculate downside deviation (semi-deviation)

        Args:
            returns: Series of monthly returns
            annualize: Whether to annualize the result

        Returns:
            Downside deviation (%)
        """
        negative_returns = returns[returns < 0]

        if len(negative_returns) < 2:
            return 0.0

        downside_dev = negative_returns.std()

        if annualize:
            downside_dev = downside_dev * np.sqrt(12)

        return float(downside_dev)

    @staticmethod
    def calculate_drawdown_series(returns_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate drawdown series

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns

        Returns:
            DataFrame with date and drawdown columns
        """
        if len(returns_df) == 0:
            return pd.DataFrame(columns=['date', 'drawdown'])

        df = returns_df.sort_values('date').copy()

        # Calculate cumulative returns
        cumulative_returns = PerformanceCalculator.calculate_cumulative_returns_series(df)

        # Convert to wealth index (starting at 100)
        wealth_index = 100 * (1 + cumulative_returns['cumulative_return'] / 100)

        # Calculate running maximum
        running_max = wealth_index.expanding().max()

        # Calculate drawdown
        drawdown = ((wealth_index - running_max) / running_max * 100).values

        return pd.DataFrame({
            'date': cumulative_returns['date'],
            'drawdown': drawdown
        })

    @staticmethod
    def calculate_max_drawdown(returns_df: pd.DataFrame) -> Dict[str, any]:
        """
        Calculate maximum drawdown and related metrics

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns

        Returns:
            Dictionary with max_drawdown, peak_date, trough_date, recovery_date
        """
        if len(returns_df) == 0:
            return {
                'max_drawdown': 0.0,
                'peak_date': None,
                'trough_date': None,
                'recovery_date': None,
                'duration_months': 0
            }

        drawdown_df = RiskCalculator.calculate_drawdown_series(returns_df)

        if len(drawdown_df) == 0:
            return {
                'max_drawdown': 0.0,
                'peak_date': None,
                'trough_date': None,
                'recovery_date': None,
                'duration_months': 0
            }

        max_dd = drawdown_df['drawdown'].min()
        max_dd_idx = drawdown_df['drawdown'].idxmin()
        max_dd_date = drawdown_df.loc[max_dd_idx, 'date']

        # Find peak before max drawdown
        pre_dd = drawdown_df.loc[:max_dd_idx]
        peak_candidates = pre_dd[pre_dd['drawdown'] == 0]
        if len(peak_candidates) > 0:
            peak_date = peak_candidates['date'].iloc[-1]
        else:
            peak_date = drawdown_df['date'].iloc[0]

        # Find recovery date (if recovered)
        post_dd = drawdown_df.loc[max_dd_idx:]
        recovery_candidates = post_dd[post_dd['drawdown'] == 0]
        if len(recovery_candidates) > 0:
            recovery_date = recovery_candidates['date'].iloc[0]
        else:
            recovery_date = None

        # Calculate duration
        peak_idx = drawdown_df[drawdown_df['date'] == peak_date].index[0]
        duration_months = max_dd_idx - peak_idx if max_dd_idx > peak_idx else 0

        return {
            'max_drawdown': float(max_dd),
            'peak_date': peak_date.strftime('%Y-%m-%d') if peak_date is not pd.NaT else None,
            'trough_date': max_dd_date.strftime('%Y-%m-%d') if max_dd_date is not pd.NaT else None,
            'recovery_date': recovery_date.strftime('%Y-%m-%d') if recovery_date and recovery_date is not pd.NaT else None,
            'duration_months': int(duration_months)
        }

    @staticmethod
    def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
        """
        Calculate Sharpe ratio

        Args:
            returns: Series of monthly returns
            risk_free_rate: Annual risk-free rate (%)

        Returns:
            Sharpe ratio
        """
        if len(returns) < 2:
            return 0.0

        excess_returns = returns - (risk_free_rate / 12)  # Convert annual to monthly

        annualized_return = PerformanceCalculator.calculate_annualized_return(excess_returns)
        annualized_vol = RiskCalculator.calculate_volatility(returns, annualize=True)

        if annualized_vol == 0:
            return 0.0

        sharpe = annualized_return / annualized_vol
        return float(sharpe)

    @staticmethod
    def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.0) -> float:
        """
        Calculate Sortino ratio using downside deviation

        Args:
            returns: Series of monthly returns
            risk_free_rate: Annual risk-free rate (%)

        Returns:
            Sortino ratio
        """
        if len(returns) < 2:
            return 0.0

        excess_returns = returns - (risk_free_rate / 12)

        annualized_return = PerformanceCalculator.calculate_annualized_return(excess_returns)
        downside_dev = RiskCalculator.calculate_downside_deviation(returns, annualize=True)

        if downside_dev == 0:
            return 0.0

        sortino = annualized_return / downside_dev
        return float(sortino)

    @staticmethod
    def calculate_risk_metrics(returns_df: pd.DataFrame, risk_free_rate: float = 0.0) -> Dict[str, any]:
        """
        Calculate comprehensive risk metrics

        Args:
            returns_df: DataFrame with 'date' and 'monthly_return' columns
            risk_free_rate: Annual risk-free rate (%)

        Returns:
            Dictionary of all risk metrics
        """
        if len(returns_df) == 0:
            return {}

        returns = returns_df['monthly_return']

        metrics = {
            'volatility': RiskCalculator.calculate_volatility(returns),
            'downside_deviation': RiskCalculator.calculate_downside_deviation(returns),
            'best_month': float(returns.max()),
            'worst_month': float(returns.min()),
            'positive_months': int((returns > 0).sum()),
            'negative_months': int((returns < 0).sum()),
            'sharpe_ratio': RiskCalculator.calculate_sharpe_ratio(returns, risk_free_rate),
            'sortino_ratio': RiskCalculator.calculate_sortino_ratio(returns, risk_free_rate)
        }

        # Add max drawdown metrics
        max_dd_metrics = RiskCalculator.calculate_max_drawdown(returns_df)
        metrics.update(max_dd_metrics)

        return metrics

    @staticmethod
    def calculate_correlation_matrix(funds_returns: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """
        Calculate correlation matrix for multiple funds

        Args:
            funds_returns: Dictionary mapping fund_id to returns DataFrame

        Returns:
            Correlation matrix as DataFrame
        """
        if len(funds_returns) < 2:
            return pd.DataFrame()

        # Align all returns by date
        all_dates = set()
        for returns_df in funds_returns.values():
            all_dates.update(returns_df['date'].values)

        all_dates = sorted(all_dates)

        # Build a DataFrame with one column per fund
        returns_matrix = pd.DataFrame()
        for fund_name, returns_df in funds_returns.items():
            returns_dict = {row['date']: row['monthly_return'] for _, row in returns_df.iterrows()}
            returns_matrix[fund_name] = [returns_dict.get(date, np.nan) for date in all_dates]

        returns_matrix.index = all_dates

        # Calculate correlation matrix
        correlation = returns_matrix.corr()

        return correlation
