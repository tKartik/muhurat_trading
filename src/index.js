import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';


import ExactLocationMap from "./Final_timeline.js";
// import ExactLocationMapNew from "./video.js";

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
    <div style={{ textAlign: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}></div>
      <FlashingStatesMap />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div style={{ 
      backgroundColor: '#02020A',
      minHeight: '100vh',
      textAlign: 'center',
      padding: 'clamp(1rem, 5vw, 2rem)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}> 
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="muhuratGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#FCCB4E', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#5D43E6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
      
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <h1 style={{ 
          fontFamily: 'Instrument Serif',
          fontSize: 'clamp(2.5rem, 7vw, 5.625rem)',
          fontWeight: 400,
          marginBottom: 'clamp(1rem, 3vw, 2rem)',
          color: 'white',
          letterSpacing: '-0.02em',
          lineHeight: '1.1'
        }}>
          How India traded during<br/>
          <span style={{ 
            fontStyle: 'italic',
            backgroundImage: 'linear-gradient(90deg, #FCCB4E 0%, #5D43E6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'inline-block'
          }}>Muhurat '24</span> on Groww
        </h1>
        
        <p className='subtext' 
        style={{ margin: '0 auto clamp(2rem, 5vw, 3rem)',
                padding: '0 clamp(1rem, 3vw, 2rem)',}}>
          Muhurat Trading is a special trading session conducted in the Indian stock markets during Diwali, 
          symbolizing prosperity and wealth. Inspired by the{" "}
          <span className="diwali-text" >
            Diwali image of NASA
            <span className="diwali-popup">
              <img 
                src={require('./data/diwali.png')} 
                alt="NASA Diwali image"
              />
            </span>
          </span>
          {" "}, this project 
          offers a visual perspective on the trades that took place during this auspicious time via <a 
      href="https://groww.in" 
      className="groww-link" 
      target="Groww.in" 
      rel="noopener noreferrer"
    >
      Groww ↗︎
    </a>.
        </p>
      </div>

      <MapToggle />

      <section className="video-section">
        <h2 className="header">
          Timelapse of the entire trading session
        </h2>
        <p className="subtext">
          To visualize density of trades in the entire session
        </p>
        
        <div className="video-container">
          <iframe 
            className="video-iframe"
            src="https://www.youtube.com/embed/f0Y3r_W85TE?si=V-i_LWbnoTB0kkRz"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>

      

      {/* Footer   */}

      <div style={{
        width: '90vw',
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        margin: '0 auto'
      }} />

      <div style={{ 
        padding: '60px 0',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '20px'
      }}>
        <img 
          src={require('./data/profile.png')} 
          alt="Kartik Tyagi" 
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            filter: 'grayscale(100%)',
            transition: 'all 0.8s ease',
            cursor: 'pointer',
            '&:hover': {
              filter: 'grayscale(0%)',
            }
          }}
          onMouseEnter={e => {
            e.target.style.filter = 'grayscale(0%)';
          }}
          onMouseLeave={e => {
            e.target.style.filter = 'grayscale(100%)';
          }}
        />
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '4px'
        }}>
          <div style={{
            fontFamily: 'Instrument Serif',
            fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
            color: 'white',
            lineHeight: '1.2'
          }}>
            Built with ❤️ and 🤖
          </div> <div style={{
              fontFamily: 'Inter',
              fontSize: 'clamp(1rem, 1.25vw, 1.5rem)',
              color: '#808084',
              display: 'flex',lexDirection: 'row',
              gap: '4px',
              alignItems: 'center',
              textDecoration: 'none',
            }}>
              <span> by</span> 
          <a 
            href="https://x.com/tkartik_me" 
            target="_blank" 
            rel="noopener noreferrer"
            className='groww-link'
            style={{
              textDecoration: 'none',
              color: '#ffffff',
              
              transition: 'color 1s ease'
            }}
            onMouseEnter={e => e.target.style.color = '#04B488'}
            onMouseLeave={e => e.target.style.color = '#ffffff'}
          >
            Kartik Tyagi ↗︎
          </a></div>
        </div>
      </div>
    </div>
  </React.StrictMode>
);

// reportWebVitals();
