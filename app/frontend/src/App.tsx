import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AccountsPage from './pages/AccountsPage';
import CashFlowPage from './pages/CashFlowPage';
import CreditCardsPage from './pages/CreditCardsPage';
import DashboardHome from './pages/DashboardHome';
import DebtPage from './pages/DebtPage';
import InvestmentsPage from './pages/InvestmentsPage';
import NotificationsPage from './pages/NotificationsPage';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/credit-cards" element={<CreditCardsPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/debt" element={<DebtPage />} />
        <Route path="/cash-flow" element={<CashFlowPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
