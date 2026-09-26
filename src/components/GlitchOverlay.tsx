import React from 'react';

interface GlitchOverlayProps {
  anomalyLevel: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ anomalyLevel }) => {
  if (anomalyLevel < 15) return null;

  const opacity = Math.min(0.4, (anomalyLevel / 100) * 0.4);
  const flickerChance = anomalyLevel > 70 ? 'animate-flicker' : '';

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Scanline CRT overlay */}
      <div 
        className="scanlines absolute inset-0 mix-blend-overlay"
        style={{ opacity: opacity + 0.1 }}
      />

      {/* Vignette darkening */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90" />

      {/* High anomaly visual fractures */}
      {anomalyLevel >= 60 && (
        <div 
          className={`absolute inset-0 pointer-events-none ${flickerChance}`}
          style={{
            backdropFilter: anomalyLevel > 85 ? 'blur(0.5px) contrast(1.15)' : 'none',
          }}
        />
      )}
    </div>
  );
};
