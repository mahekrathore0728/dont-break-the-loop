import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  isGlitch?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isGlitch = false }) => {
  const [visibleMessage, setVisibleMessage] = useState(message);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setVisibleMessage(message);
    setFadeKey(prev => prev + 1);
  }, [message]);

  if (!visibleMessage) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%] text-center pointer-events-none select-none">
      <div 
        key={fadeKey}
        className={`inline-block px-5 py-2.5 rounded-lg backdrop-blur-md border shadow-2xl transition-all duration-300 ${
          isGlitch 
            ? 'bg-rose-950/85 border-rose-500/70 text-rose-200 animate-pulse text-glitch' 
            : 'bg-neutral-950/85 border-neutral-800/90 text-neutral-200'
        }`}
        data-text={visibleMessage}
      >
        <p className="text-sm md:text-base font-serif tracking-wide leading-relaxed">
          {visibleMessage}
        </p>
      </div>
    </div>
  );
};
