import pandas as pd
from typing import Tuple, List


class MorningstarParser:
    """Parse Morningstar Excel files"""

    def parse_excel(self, file_obj) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Parse Morningstar Excel file and extract funds and returns data

        Args:
            file_obj: File-like object or path to Excel file

        Returns:
            Tuple of (funds_df, returns_df)
        """
        # Read Excel with multi-level headers (rows 8 and 9)
        df = pd.read_excel(file_obj, header=[7, 8])

        # Separate static columns from date columns
        static_cols = [col for col in df.columns if 'Unnamed' in str(col[0])]
        date_cols = [col for col in df.columns if 'Unnamed' not in str(col[0])]

        # Process funds (static data)
        funds_df = self._process_funds(df, static_cols)

        # Process returns (time-series data)
        returns_df = self._process_returns(df, date_cols, funds_df)

        return funds_df, returns_df

    def _process_funds(self, df: pd.DataFrame, static_cols: List) -> pd.DataFrame:
        """Extract and clean fund static data"""
        funds = df[static_cols].copy()
        funds.columns = [col[1] for col in funds.columns]

        # Clean data
        funds = funds[funds['Group/Investment'].notna()]
        funds = funds[funds['Group/Investment'] != 'Local Funds']
        funds = funds.reset_index(drop=True)

        # Rename primary column
        funds = funds.rename(columns={'Group/Investment': 'fund_name'})

        # Add fund_id
        funds['fund_id'] = range(1, len(funds) + 1)

        # Move fund_id to first column
        cols = ['fund_id'] + [col for col in funds.columns if col != 'fund_id']
        funds = funds[cols]

        return funds

    def _process_returns(self, df: pd.DataFrame, date_cols: List, funds_df: pd.DataFrame) -> pd.DataFrame:
        """Convert returns to long format with fund_id"""
        returns_list = []

        # Create mapping of fund_name to fund_id
        fund_name_to_id = dict(zip(funds_df['fund_name'], funds_df['fund_id']))

        for idx in range(len(df)):
            fund_name = df.iloc[idx][('Unnamed: 0_level_0', 'Group/Investment')]

            if pd.isna(fund_name) or fund_name == 'Local Funds':
                continue

            fund_id = fund_name_to_id.get(fund_name)
            if fund_id is None:
                continue

            for date_col in date_cols:
                return_value = df.iloc[idx][date_col]

                if pd.notna(return_value):
                    # Parse date
                    date_str = date_col[0]
                    date_obj = pd.to_datetime(date_str, format='%d/%m/%Y')

                    returns_list.append({
                        'fund_id': fund_id,
                        'fund_name': fund_name,
                        'date': date_obj,
                        'monthly_return': float(return_value)
                    })

        returns_df = pd.DataFrame(returns_list)

        # Sort by fund_id and date
        returns_df = returns_df.sort_values(['fund_id', 'date']).reset_index(drop=True)

        return returns_df
