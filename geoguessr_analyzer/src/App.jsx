import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GeoguessrDuelsAnalyzer from './GeoguessrDuelsAnalyzer';
import MapBackground from './components/MapBackground';

function App() {
  return (
    <Router>
      <MapBackground>
        <Routes>
          <Route path="/*" element={<GeoguessrDuelsAnalyzer />} />
        </Routes>
      </MapBackground>
    </Router>
  );
}

export default App;