import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="animated-bg-container" aria-hidden="true">
      {/* Radial Gradient Glowing Aurora Spheres */}
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />
      <div className="glow-orb orb-3" />

      {/* Cyber Grid & Dot Pattern */}
      <div className="cyber-grid-overlay" />

      {/* Floating Ambient Particles Layer */}
      <div className="particles-layer">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>
    </div>
  );
};
