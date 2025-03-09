import React from 'react';
import backgroundImage from '../assets/images/background.jpg';

const MapBackground = ({ children, blurAmount = 5 }) => {
  return (
    <div className="relative w-full">
      <div 
        className="fixed top-0 left-0 w-full h-full"
        style={{ zIndex: -10 }}
      >
        <img
          className="absolute inset-0 w-full h-full"
          src={backgroundImage}
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: `blur(${blurAmount}px)`,
            transform: 'scale(1.1)',
          }}
        />
        
        <div className="absolute inset-0 w-full h-full bg-black/30" />
      </div>
      
      <div className="relative w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default MapBackground;