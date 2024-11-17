import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { MapToggle } from '../src/components/MapToggle';

// Import fonts
import { Instrument_Serif, Inter } from 'next/font/google';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Muhurat Trading Visualization</title>
        <meta name="description" content="Visualization of Muhurat Trading on Groww" />
      </Head>

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
          <h1 className={instrumentSerif.className} style={{ 
            fontSize: 'clamp(3rem, 7vw, 5.625rem)',
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
              display: 'inline-block',
              paddingRight: '0.1em',
              marginRight: '0.1em'
            }}>Muhurat '24</span> on Groww
          </h1>
          
          <p className={`${inter.className} subtext`}
            style={{ 
              margin: '0 auto clamp(2rem, 5vw, 3rem)',
              padding: '0 clamp(1rem, 3vw, 2rem)',
            }}>
            Muhurat Trading is a special trading session conducted in the Indian stock markets during Diwali, 
            symbolizing prosperity and wealth. Inspired by the{" "}
            <span className="diwali-text">
              Diwali image of NASA
              <span className="diwali-popup">
                <Image 
                  src="/images/diwali.png"
                  alt="NASA Diwali image"
                  width={400}
                  height={300}
                  priority
                />
              </span>
            </span>
            , this project 
            offers a visual perspective on the trades that took place during this auspicious time via{" "}
            <a 
              href="https://groww.in" 
              className="groww-link" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Groww↗︎
            </a>
          </p>
        </div>

        <MapToggle />

        <section className="video-section">
          <h2 className={`${instrumentSerif.className} header`}>
            Timelapse of the entire trading session
          </h2>
          <p className={`${inter.className} subtext`}>
            To visualize density of trades in the entire session
          </p>
          
          
          <div className="video-container">
          <iframe 
            className="video-iframe"
            src="https://www.youtube.com/embed/f0Y3r_W85TE?si=V-i_LWbnoTB0kkRz?modestbranding=1&showinfo=0&rel=0"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          </div>
        </section>

        <div style={{
          width: '90vw',
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          margin: '2rem auto'
        }} />

        <footer style={{ 
          padding: '30px 0',
          display: 'flex',
          flexDirection: 'column-reverse', // Default for mobile
          gap: '40px',
          '@media (min-width: 768px)': {  // For desktop
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }
        }}>
          {/* Disclaimer Section */}
          <div style={{
            width: '100%', // Full width on mobile
            '@media (min-width: 768px)': {
              flex: '1',
              maxWidth: '60%',
              lineHeight: '1.6'
            }
          }}>
            <div className={inter.className} style={{
              fontSize: '10px',
              color: 'white',
              opacity: 0.4,
              
            }}>
              <strong>Disclaimer</strong><br /> <br />
              The visualizations in this project are based on anonymized data provided by Groww and are intended for educational and informational purposes only. The data used represents only mainland India and excludes territories such as the Andaman and Nicobar Islands. While every effort has been made to ensure accuracy, minor discrepancies may exist due to data processing or technical factors. These visualizations are not intended to reflect exact trade values or patterns and should not be used for analytical or decision-making purposes. </div>
          </div>

          {/* Creator Section */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '20px',
            width: '100%', // Full width on mobile
            justifyContent: 'center', // Center on mobile
            '@media (min-width: 768px)': {
              width: 'auto',
              justifyContent: 'flex-start'
            }
          }}>
            <Image 
              src="/images/profile.png"
              alt="Kartik Tyagi"
              width={72}
              height={72}
              className="profile-image"
              priority
            />
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '4px'
            }}>
              <div className={instrumentSerif.className} style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
                color: 'white',
                lineHeight: '1.2'
              }}>
                Built with ❤️ and 🤖
              </div>
              <div className={inter.className} style={{
                fontSize: 'clamp(1rem, 1.25vw, 1.5rem)',
                color: '#808084',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
              }}>
                <span>by</span>
                <a 
                  href="https://x.com/tkartik_me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="groww-link"
                >
                  Kartik Tyagi ↗︎
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 