import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AccountsPage from './pages/AccountsPage';
import CashFlowPage from './pages/CashFlowPage';
import CreditCardsPage from './pages/CreditCardsPage';
import DashboardHome from './pages/DashboardHome';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/credit-cards" element={<CreditCardsPage />} />
        <Route path="/cash-flow" element={<CashFlowPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
