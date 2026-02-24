import { Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import Waiting from './components/Waiting';
import Results from './components/Results';

function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId" element={<Questionnaire />} />
        <Route path="/session/:sessionId/waiting" element={<Waiting />} />
        <Route path="/session/:sessionId/results" element={<Results />} />
      </Routes>
    </div>
  );
}

export default App;
