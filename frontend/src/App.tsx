import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SideNav from './components/SideNav';
import AccountsPage from './pages/AccountsPage';
import CashFlowPage from './pages/CashFlowPage';
import ConciliationsPage from './pages/ConciliationsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import DashboardHome from './pages/DashboardHome';
import DocumentsPage from './pages/DocumentsPage';
import QueryPage from './pages/QueryPage';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <SideNav />
        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/credit-cards" element={<CreditCardsPage />} />
            <Route path="/cash-flow" element={<CashFlowPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/conciliations" element={<ConciliationsPage />} />
            <Route path="/query" element={<QueryPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
