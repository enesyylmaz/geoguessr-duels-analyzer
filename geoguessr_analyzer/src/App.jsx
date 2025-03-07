import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GeoguessrDuelsAnalyzer from './GeoguessrDuelsAnalyzer';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/*" element={<GeoguessrDuelsAnalyzer />} />
      </Routes>
    </Router>
  );
}

export default App
