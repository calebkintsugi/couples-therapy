import { Routes, Route, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import Waiting from './components/Waiting';
import Results from './components/Results';
import Tester from './components/Tester';

function App() {
  const location = useLocation();
  const isTester = location.pathname === '/tester';
  const isLanding = location.pathname === '/';

  return (
    <div className={isTester || isLanding ? '' : 'container'}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tester" element={<Tester />} />
        <Route path="/session/:sessionId" element={<Questionnaire />} />
        <Route path="/session/:sessionId/waiting" element={<Waiting />} />
        <Route path="/session/:sessionId/results" element={<Results />} />
      </Routes>
    </div>
  );
}

export default App;
