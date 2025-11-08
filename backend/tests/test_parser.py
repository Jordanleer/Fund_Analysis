import pytest
from app.utils.parser import MorningstarParser


def test_parser_initialization():
    """Test that parser can be initialized"""
    parser = MorningstarParser()
    assert parser is not None


# Additional tests will be added as we develop
# Test with actual Morningstar file structure
# Test error handling
# Test data validation
