import { Routes, Route, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import HowItWorks from './components/HowItWorks';
import Questionnaire from './components/Questionnaire';
import Waiting from './components/Waiting';
import Results from './components/Results';
import Tester from './components/Tester';
import Journal from './components/Journal';
import JournalStart from './components/JournalStart';
import Analytics from './components/Analytics';
import PromoAdmin from './components/PromoAdmin';
import Login from './components/Login';
import AuthVerify from './components/AuthVerify';
import Account from './components/Account';

function App() {
  const location = useLocation();
  const isTester = location.pathname === '/tester';
  const isLanding = location.pathname === '/';
  const isHowItWorks = location.pathname === '/how-it-works';
  const isSession = location.pathname.startsWith('/session/');
  const isJournal = location.pathname.startsWith('/journal');
  const isAuth = location.pathname.startsWith('/auth') || location.pathname === '/login' || location.pathname === '/account';

  return (
    <div className={isTester || isLanding || isHowItWorks || isSession || isJournal || isAuth ? '' : 'container'}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/tester" element={<Tester />} />
        <Route path="/session/:sessionId" element={<Questionnaire />} />
        <Route path="/session/:sessionId/waiting" element={<Waiting />} />
        <Route path="/session/:sessionId/results" element={<Results />} />
        <Route path="/journal/start" element={<JournalStart />} />
        <Route path="/journal/:journalId" element={<Journal />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/promo-admin" element={<PromoAdmin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </div>
  );
}

export default App;
