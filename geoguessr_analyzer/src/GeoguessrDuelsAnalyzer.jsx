import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { ArrowUpDown } from 'lucide-react';


const GeoguessrDuelsAnalyzer = () => {
  const [authToken, setAuthToken] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle',
    message: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'count',
    direction: 'descending'
  });
  const [error, setError] = useState(null);

  const sortedResults = React.useMemo(() => {
    if (!results) return [];

    return [...results].sort((a, b) => {
      let modifier = sortConfig.direction === 'ascending' ? 1 : -1;
      
      switch(sortConfig.key) {
        case 'countryName':
          return modifier * a.countryName.localeCompare(b.countryName);
        case 'count':
          return modifier * (a.count - b.count);
        case 'avgScore':
          return modifier * (a.avgScore - b.avgScore);
        case 'avgDistance':
          return modifier * (a.avgDistance - b.avgDistance);
        default:
          return 0;
      }
    });
  }, [results, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'descending' 
        ? 'ascending' 
        : 'descending'
    }));
  };

  const checkSession = useCallback(async (sid) => {
    try {
      const response = await fetch(`/api/progress?sessionId=${sid}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          localStorage.removeItem('geoguessrSessionId');
          createNewSession();
          return;
        }
        throw new Error('Failed to check session');
      }
      
      const data = await response.json();
      setProgress(data);
      
      if (data.status === 'analyzing' || data.status === 'fetching_duels' || 
          data.status === 'fetching_duel_ids' || data.status === 'starting') {
        setIsAnalyzing(true);
      } else if (data.status === 'complete') {
        setIsAnalyzing(false);
        fetchResults(sid);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const checkProgress = useCallback(async (sid) => {
    try {
      const response = await fetch(`/api/progress?sessionId=${sid}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      
      const data = await response.json();
      setProgress(data);
      
      if (data.status === 'complete') {
        fetchResults(sid);
      } else if (data.status === 'error') {
        setError(data.message);
        setIsAnalyzing(false);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      localStorage.setItem('geoguessrSessionId', data.sessionId);
    } catch (err) {
      setError('Failed to create session: ' + err.message);
    }
  };

  const fetchResults = async (sid) => {
    try {
      const response = await fetch(`/api/results?sessionId=${sid}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      
      if (data.status === 'complete') {
        setResults(data.data);
        setIsAnalyzing(false);
      }
    } catch (err) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const storedSessionId = localStorage.getItem('geoguessrSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      checkSession(storedSessionId);
    } else {
      createNewSession();
    }
  }, [checkSession]);

  useEffect(() => {
    let intervalId;
    
    if (isAnalyzing && sessionId) {
      intervalId = setInterval(() => checkProgress(sessionId), 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing, sessionId, checkProgress]);

  const startAnalysis = async () => {
    if (!authToken) {
      setError('_ncfa cookie is required');
      return;
    }
    
    if (!sessionId) {
      await createNewSession();
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await fetch(`/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          authToken,
          sessionId
        }),
        credentials: 'include'
      });

      setAuthToken('');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start analysis');
      }
      
      const data = await response.json();
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('geoguessrSessionId', data.sessionId);
      }
    } catch (err) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  const renderProgressBar = () => {
    const percentage = progress.total > 0 
      ? Math.round((progress.current / progress.total) * 100) 
      : 0;
    
    return (
      <div className="w-full mt-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {progress.message}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {progress.current} / {progress.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!results || results.length === 0) return null;
    
    //const topCountries = results.slice(0, 10);
    
    return (
      <div className="mt-8">
        
        {/*
        <div className="h-80 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topCountries}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="countryName" 
                angle={-45} 
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Number of Rounds" fill="#3b82f6" />
              <Bar dataKey="avgScore" name="Avg. Score" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        */}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('countryName')}>
                <div className="flex items-center">
                  Country
                  <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('count')}>
                <div className="flex items-center">
                  Rounds
                  <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('avgScore')}>
                <div className="flex items-center">
                  Avg. Score
                  <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('avgDistance')}>
                <div className="flex items-center">
                  Avg. Distance (km)
                  <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                </div>
              </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResults.map((country) => (
                <tr key={country.countryCode}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {country.countryName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{country.count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{country.avgScore.toFixed(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{(country.avgDistance / 1000).toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <Label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="auth-token">
            _ncfa Cookie
            <span className="text-xs font-normal ml-2 text-gray-500">
              (from your _ncfa cookie on geoguessr.com)
            </span>
          </Label>
          <Input
            id="auth-token"
            type="text"
            placeholder="Enter your _ncfa cookie"
            className="w-full p-2 border border-gray-300 rounded"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between">
          <Button
            onClick={startAnalysis}
            disabled={isAnalyzing || !authToken}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
        <Label className="text-xs text-gray-500 mt-3">
        Your _ncfa cookie is only used for API requests and is never stored permanently. This cookie provides access to your GeoGuessr account, so never share it with anyone else.
            </Label>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {isAnalyzing && renderProgressBar()}
      
      {results && renderResults()}
    </div>
  );
};

export default GeoguessrDuelsAnalyzer;