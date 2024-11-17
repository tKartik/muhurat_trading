import dynamic from 'next/dynamic';

const ExactLocationMap = dynamic(
  () => import("../Final_timeline.js"),
  { ssr: false }
);

export const MapToggle = () => {
  return (
    <div style={{ textAlign: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}></div>
      <ExactLocationMap />
    </div>
  );
}; 