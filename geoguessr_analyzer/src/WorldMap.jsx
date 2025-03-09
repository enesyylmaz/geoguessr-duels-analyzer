import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup,
  Graticule
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { countryNameToCodeMap } from './constants/countryMappings';
import { createPortal } from 'react-dom';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

const CustomTooltip = ({ countryData }) => {
  if (!countryData) return null;
  
  return (
    <div className="bg-white rounded-lg p-4 min-w-48 shadow-lg border-l-4 border-blue-500 border-t border-r border-b">
      <h3 className="font-bold text-lg">{countryData.countryName}</h3>
      <div className="border-b border-gray-200 w-full my-2"></div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="text-gray-600">Rounds:</div>
        <div className="font-medium text-right">{countryData.count.toLocaleString()}</div>
        <div className="text-gray-600">Score:</div>
        <div className="font-medium text-right">{countryData.avgScore.toFixed(1)}</div>
        <div className="text-gray-600">Distance:</div>
        <div className="font-medium text-right">{(countryData.avgDistance / 1000).toFixed(1)} km</div>
      </div>
    </div>
  );
};

const WorldMap = ({ results }) => {
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const mapRef = useRef();
  const containerRef = useRef();
  
  const colorScale = useMemo(() => {
    return scaleLinear()
      .domain([0, 1000, 2000, 3000, 4000, 5000])
      .range(["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#a78bfa"]);
  }, []);
  
  const countryDataMap = useMemo(() => {
    if (!results || results.length === 0) return {};
    
    const map = {};
    results.forEach(country => {
      if (country.countryCode) {
        map[country.countryCode.toLowerCase()] = country;
      }
    });
    return map;
  }, [results]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: width,
          height: width * 0.6,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    if (!document.getElementById('map-tooltip-portal')) {
      const portalDiv = document.createElement('div');
      portalDiv.id = 'map-tooltip-portal';
      document.body.appendChild(portalDiv);
    }
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      const portalDiv = document.getElementById('map-tooltip-portal');
      if (portalDiv) {
        document.body.removeChild(portalDiv);
      }
    };
  }, []);

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 0.7) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  };

  const handleMoveEnd = (position) => {
    setPosition(position);
  };

  const handleMouseEnter = (geo, evt) => {
    const countryName = geo.properties.name;
    
    if (!countryName) return;
    
    const countryCode = countryNameToCodeMap[countryName];
    
    if (!countryCode) return;
    
    const countryData = countryDataMap[countryCode];
    
    if (countryData) {
      setTooltipData(countryData);
      
      const bounds = evt.target.getBoundingClientRect();
      
      let posX = bounds.left + bounds.width / 2;
      let posY = bounds.top - 140;
      
      const tooltipWidth = 200;
      
      if (posX - tooltipWidth/2 < 10) {
        posX = tooltipWidth/2 + 10;
      } else if (posX + tooltipWidth/2 > window.innerWidth - 10) {
        posX = window.innerWidth - tooltipWidth/2 - 10;
      }
      
      if (posY < 10) {
        posY = bounds.bottom + 10;
      }
      
      setTooltipPosition({
        x: posX,
        y: posY
      });
      
      setShowTooltip(true);
    }
  };
  
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  if (!results || results.length === 0) {
    return (
      <div className="border rounded-lg bg-gray-50 p-4 flex items-center justify-center h-64">
        <p className="text-gray-500">No data available to display on the map.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full mt-4 mb-6 overflow-hidden rounded-xl shadow-lg" ref={containerRef}>
      
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors duration-200"
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors duration-200"
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button
          onClick={handleReset}
          className="bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors duration-200"
          aria-label="Reset view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </div>
      
      <div style={{ width: dimensions.width, height: dimensions.height }} className="overflow-hidden">
        <ComposableMap
          projection="geoEqualEarth" 
          projectionConfig={{ scale: 225 }}
          ref={mapRef}
          width={dimensions.width}
          height={dimensions.height}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            translateExtent={[
              [-Infinity, -Infinity],
              [Infinity, Infinity]
            ]}
          >
            <Graticule stroke="#E0E0E0" strokeWidth={0.5} />
            
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const countryName = geo.properties.name;
                  
                  if (!countryName) return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#EAEAEC"
                      stroke="#D6D6DA"
                      strokeWidth={0.5}
                    />
                  );
                  
                  const countryCode = countryNameToCodeMap[countryName];
                  
                  if (!countryCode) return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#EAEAEC"
                      stroke="#D6D6DA"
                      strokeWidth={0.5}
                    />
                  );
                  
                  const countryData = countryDataMap[countryCode];
                  
                  const fillColor = countryData 
                    ? colorScale(countryData.avgScore)
                    : "#EAEAEC";
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        default: { 
                          outline: "none"
                        },
                        hover: { 
                          outline: "none", 
                          stroke: "#232323", 
                          strokeWidth: 1,
                          filter: "drop-shadow(1px 1px 4px rgba(0,0,0,0.3))",
                          cursor: "pointer"
                        },
                        pressed: { outline: "none" }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {showTooltip && document.getElementById('map-tooltip-portal') && createPortal(
        <div
          className="fixed z-50 transition-all duration-150"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translateX(-50%)",
            pointerEvents: "none"
          }}
        >
          <CustomTooltip countryData={tooltipData} />
        </div>,
        document.getElementById('map-tooltip-portal')
      )}
    </div>
  );
};

export default WorldMap;