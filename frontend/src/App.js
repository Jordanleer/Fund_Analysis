import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FundDetailPage from './pages/FundDetailPage';
import PerformancePage from './pages/PerformancePage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import ComparePage from './pages/ComparePage';
import FundList from './components/FundList/FundList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/funds" element={<FundList />} />
          <Route path="/fund/:fundId" element={<FundDetailPage />} />
          <Route path="/fund/:fundId/performance" element={<PerformancePage />} />
          <Route path="/fund/:fundId/risk" element={<RiskAnalysisPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
