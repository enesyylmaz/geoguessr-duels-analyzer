import React from 'react';

const MapBackground = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <svg className="w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <path d="M300,150 Q450,50 600,150 T900,150 T1200,150" stroke="currentColor" fill="none" strokeWidth="0.8" />
          <path d="M300,250 Q450,150 600,250 T900,250 T1200,250" stroke="currentColor" fill="none" strokeWidth="0.8" />
          <path d="M300,350 Q450,250 600,350 T900,350 T1200,350" stroke="currentColor" fill="none" strokeWidth="0.8" />
          <path d="M300,450 Q450,350 600,450 T900,450 T1200,450" stroke="currentColor" fill="none" strokeWidth="0.8" />
          <path d="M300,550 Q450,450 600,550 T900,550 T1200,550" stroke="currentColor" fill="none" strokeWidth="0.8" />
          
          <circle cx="500" cy="200" r="5" fill="currentColor" />
          <circle cx="700" cy="300" r="5" fill="currentColor" />
          <circle cx="900" cy="200" r="5" fill="currentColor" />
          <circle cx="600" cy="400" r="5" fill="currentColor" />
          <circle cx="800" cy="500" r="5" fill="currentColor" />
          
          <path d="M500,200 L700,300" stroke="currentColor" strokeWidth="0.5" />
          <path d="M700,300 L900,200" stroke="currentColor" strokeWidth="0.5" />
          <path d="M700,300 L600,400" stroke="currentColor" strokeWidth="0.5" />
          <path d="M600,400 L800,500" stroke="currentColor" strokeWidth="0.5" />
          
          <circle cx="200" cy="600" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="600" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="600" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          
          <circle cx="1000" cy="400" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="1000" cy="400" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="1000" cy="400" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          
          <path d="M100,100 L120,120 M140,100 L120,120 M120,80 L120,120" stroke="currentColor" strokeWidth="0.5" />
          <path d="M1100,600 L1120,620 M1140,600 L1120,620 M1120,580 L1120,620" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/80 to-blue-50/90 z-0"></div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MapBackground;