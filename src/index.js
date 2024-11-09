import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';


import ExactLocationMap from "./Exact_location_geojson_svg.js";
import ExactLocationMapNew from "./Exact_location_topojson_canvas_2.js";

import FlashingStatesMap from "./flashingStatesMap.js"; 
import WebFont from 'webfontloader';

WebFont.load({
  google: {
    families: ['Instrument Serif:400,700,400italic', 'Inter:400,500,600']
  }
});

const MapToggle = () => {
  const [activeMap, setActiveMap] = useState('exact');


  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
   
      </div>
      <ExactLocationMapNew  />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div style={{ 
      backgroundColor: '#181818',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}> 
      <h1 style={{ 
        fontFamily: 'Instrument Serif',
        fontSize: '5.625rem',
        fontWeight: 400,
        marginBottom: '2rem',
        color: 'white',
        letterSpacing: '-0.02em',
        lineHeight: '1'
      }}>
        How India traded during<br/>
        <span style={{ 
          color: '#8CEC9D',
          fontStyle: 'italic'
        }}>Muhurat '24</span> on Groww
      </h1>
      <MapToggle />
    </div>
  </React.StrictMode>
);

// reportWebVitals();
