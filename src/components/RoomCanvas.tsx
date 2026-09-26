import React, { useState } from 'react';
import { RoomObjectKey, RoomState, BehaviorProfile } from '../types/game';
import { sound } from '../audio/soundEngine';

interface RoomCanvasProps {
  loopCount: number;
  anomalyLevel: number;
  roomState: RoomState;
  behaviorProfile: BehaviorProfile;
  onObjectClick: (target: RoomObjectKey) => void;
  hoveredObject: RoomObjectKey | null;
  setHoveredObject: (target: RoomObjectKey | null) => void;
}

export const RoomCanvas: React.FC<RoomCanvasProps> = ({
  loopCount,
  anomalyLevel,
  roomState,
  behaviorProfile,
  onObjectClick,
  hoveredObject,
  setHoveredObject,
}) => {
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x, y });
  };

  const getObjectTooltip = (key: RoomObjectKey): string => {
    switch (key) {
      case 'door': return roomState.doorUnlocked ? 'Door (Unlocked)' : 'Heavy Iron Door';
      case 'clock': return 'Grandfather Clock';
      case 'painting': return loopCount >= 7 ? 'Painting (Distorted)' : 'Oil Portrait';
      case 'desk': return 'Writing Desk';
      case 'drawer': return roomState.drawerOpen ? 'Desk Drawer (Open)' : 'Desk Drawer';
      case 'lamp': return roomState.lampUV ? 'Brass Lamp (UV Active)' : 'Brass Desk Lamp';
      case 'mirror': return loopCount >= 3 ? 'Tall Mirror (Desynchronized)' : 'Tall Wall Mirror';
      case 'note': return 'Strange Note';
      case 'tile': return 'Loose Floor Tile';
      case 'keyItem': return 'Small Brass Key';
      default: return '';
    }
  };

  // Lamp lighting classes
  const isUV = roomState.lampUV && roomState.lampOn;
  const isDark = !roomState.lampOn;

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-5xl aspect-[16/10] bg-[#07090e] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl room-shadow select-none"
    >
      {/* 1. ROOM BACKGROUND SVG (Walls, Flooring, Volumetric Lighting) */}
      <svg 
        viewBox="0 0 1000 625" 
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          {/* Floor perspective gradient */}
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#090b10" />
            <stop offset="100%" stopColor="#141822" />
          </linearGradient>

          {/* Wall shading */}
          <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b0e15" />
            <stop offset="100%" stopColor="#06080d" />
          </linearGradient>

          {/* Lamp Light Cone Normal */}
          <radialGradient id="lampConeNormal" cx="62%" cy="52%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#d97706" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Lamp Light Cone UV */}
          <radialGradient id="lampConeUV" cx="62%" cy="52%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#9333ea" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Door light leak */}
          <linearGradient id="doorLightLeak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={roomState.doorUnlocked ? "#38bdf8" : "#1e293b"} stopOpacity={roomState.doorUnlocked ? "0.6" : "0.2"} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Back Wall */}
        <polygon points="120,40 880,40 880,460 120,460" fill="url(#wallGrad)" />

        {/* Left Wall Perspective */}
        <polygon points="0,0 120,40 120,460 0,625" fill="#080a0f" />

        {/* Right Wall Perspective */}
        <polygon points="880,40 1000,0 1000,625 880,460" fill="#06070a" />

        {/* Ceiling */}
        <polygon points="0,0 1000,0 880,40 120,40" fill="#040508" />

        {/* Wooden Planks Floor */}
        <polygon points="0,625 120,460 880,460 1000,625" fill="url(#floorGrad)" />
        {/* Floorboard perspective lines */}
        {[200, 320, 440, 560, 680, 800].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1="460"
            x2={x + (x - 500) * 1.3}
            y2="625"
            stroke="#1c2230"
            strokeWidth="1.2"
            opacity="0.4"
          />
        ))}

        {/* Ambient Lamp Light Pool */}
        {roomState.lampOn && (
          <ellipse
            cx="620"
            cy="470"
            rx="280"
            ry="180"
            fill={isUV ? "url(#lampConeUV)" : "url(#lampConeNormal)"}
            className="mix-blend-screen pointer-events-none transition-all duration-500"
          />
        )}

        {/* Door light spill onto floor */}
        <polygon
          points="70,470 140,460 260,625 110,625"
          fill="url(#doorLightLeak)"
          className="mix-blend-screen pointer-events-none transition-all duration-700"
        />

        {/* UV Hidden Runes on Back Wall (Visible only in UV mode) */}
        {isUV && loopCount >= 3 && (
          <g className="uv-hidden-rune">
            <text x="460" y="160" fill="#e879f9" fontSize="22" fontFamily="monospace" fontWeight="bold" letterSpacing="4">
              III · VI · IX
            </text>
            <path d="M 440 170 L 580 170" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4 2" />
          </g>
        )}
      </svg>

      {/* 2. INTERACTIVE OBJECTS LAYER (Precise absolute positioned clickable hotspots) */}

      {/* OBJECT 1: DOOR */}
      <div 
        onClick={() => onObjectClick('door')}
        onMouseEnter={() => setHoveredObject('door')}
        onMouseLeave={() => setHoveredObject(null)}
        title={getObjectTooltip('door')}
        className="group absolute left-[4%] top-[18%] w-[13%] h-[58%] cursor-pointer z-10"
      >
        <div className={`w-full h-full rounded-t-lg border-2 transition-all duration-300 relative flex flex-col items-center justify-center ${
          hoveredObject === 'door'
            ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20'
            : roomState.doorUnlocked 
            ? 'border-cyan-500/70 bg-cyan-950/20' 
            : 'border-neutral-800 bg-neutral-900/60'
        }`}>
          {/* Iron Door Rivets & Texture */}
          <div className="absolute top-4 left-3 w-1.5 h-1.5 rounded-full bg-neutral-700" />
          <div className="absolute top-4 right-3 w-1.5 h-1.5 rounded-full bg-neutral-700" />
          <div className="absolute bottom-6 left-3 w-1.5 h-1.5 rounded-full bg-neutral-700" />
          <div className="absolute bottom-6 right-3 w-1.5 h-1.5 rounded-full bg-neutral-700" />

          {/* Door Handle */}
          {!roomState.doorMissingHandle && (
            <div className={`absolute right-2.5 top-[52%] w-3 h-8 rounded border transition-colors ${
              roomState.loop4HabitNeutralized === false && loopCount === 4
                ? 'bg-rose-600 border-rose-400 shadow-sm shadow-rose-500 animate-pulse'
                : 'bg-amber-600 border-amber-500'
            }`} />
          )}

          {/* Keyhole / Keypad LED */}
          <div className={`w-3.5 h-3.5 rounded-full border mb-4 ${
            roomState.doorUnlocked ? 'bg-cyan-400 border-cyan-300 shadow-sm shadow-cyan-400' : 'bg-neutral-800 border-neutral-700'
          }`} />

          {/* Loop 7 Shimmer effect */}
          {loopCount === 7 && (
            <div className="absolute inset-0 bg-purple-500/20 animate-pulse rounded-t-lg backdrop-blur-[1px]" />
          )}
        </div>
      </div>

      {/* OBJECT 2: GRANDFATHER CLOCK */}
      <div 
        onClick={() => onObjectClick('clock')}
        onMouseEnter={() => setHoveredObject('clock')}
        onMouseLeave={() => setHoveredObject(null)}
        title={getObjectTooltip('clock')}
        className="group absolute left-[19%] top-[12%] w-[9%] h-[68%] cursor-pointer z-10"
      >
        <div className={`w-full h-full rounded-t-2xl border transition-all duration-300 relative flex flex-col items-center p-1.5 ${
          hoveredObject === 'clock'
            ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/20'
            : 'border-amber-900/60 bg-[#120e0a]/90'
        }`}>
          {/* Clock Top Finial */}
          <div className="w-4 h-2 bg-amber-700 rounded-t-full mb-1" />

          {/* Clock Face */}
          <div className="w-12 h-12 rounded-full border border-amber-600 bg-amber-100/90 flex items-center justify-center shadow-inner relative overflow-hidden">
            <span className="text-[7px] font-serif text-black font-bold absolute top-0.5">XII</span>
            <span className="text-[7px] font-serif text-black font-bold absolute bottom-0.5">VI</span>
            <span className="text-[7px] font-serif text-black font-bold absolute left-0.5">IX</span>
            <span className="text-[7px] font-serif text-black font-bold absolute right-0.5">III</span>
            
            {/* Clock Hands */}
            <div 
              className={`w-0.5 h-3 bg-neutral-900 absolute origin-bottom rounded-full ${
                loopCount === 2 ? 'rotate-[-45deg]' : 'rotate-[120deg]'
              }`} 
            />
            <div 
              className={`w-0.5 h-4 bg-neutral-700 absolute origin-bottom rounded-full ${
                loopCount === 2 ? 'rotate-[-90deg]' : 'rotate-[48deg]'
              }`} 
            />
          </div>

          {/* Pendulum Glass Trunk */}
          <div className="w-full flex-1 border-t border-amber-900/80 mt-2 relative flex justify-center overflow-hidden">
            <div className={`w-1 bg-amber-600 h-28 origin-top relative ${
              loopCount === 2 ? 'animate-swing-reverse' : 'animate-subtle-float'
            }`}>
              <div className="absolute -bottom-2 -left-1.5 w-4 h-4 rounded-full bg-amber-500 border border-amber-400 shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* OBJECT 3: OIL PAINTING */}
      <div 
        onClick={() => onObjectClick('painting')}
        onMouseEnter={() => setHoveredObject('painting')}
        onMouseLeave={() => setHoveredObject(null)}
        title={getObjectTooltip('painting')}
        className="group absolute left-[45%] top-[10%] w-[18%] h-[24%] cursor-pointer z-10"
      >
        <div className={`w-full h-full border-4 transition-all duration-300 relative rounded shadow-xl flex items-center justify-center p-2 ${
          hoveredObject === 'painting'
            ? 'border-cyan-400 shadow-cyan-500/30'
            : 'border-amber-800 bg-[#0e0c0a]'
        }`}>
          {/* Painting Canvas */}
          <div className="w-full h-full bg-[#181412] relative overflow-hidden flex items-center justify-center">
            {loopCount < 7 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Silhouette corridor */}
                <div className="w-8 h-14 bg-[#0a0807] border-t border-l border-r border-amber-900/40 relative">
                  <div className="w-2 h-4 bg-amber-400/80 mx-auto mt-5 rounded-t-sm shadow-sm shadow-amber-400" />
                </div>
                {/* Tally marks for loops */}
                {loopCount >= 2 && (
                  <div className="absolute top-1 left-1.5 font-mono text-[8px] text-amber-500/70">
                    {'|'.repeat(Math.min(6, loopCount))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[9px] font-mono text-cyan-400 text-center leading-tight">
                {behaviorProfile.dominantTrait.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OBJECT 4: WRITING DESK & DRAWER */}
      <div 
        onClick={() => onObjectClick('desk')}
        onMouseEnter={() => setHoveredObject('desk')}
        onMouseLeave={() => setHoveredObject(null)}
        title={getObjectTooltip('desk')}
        className="group absolute left-[38%] top-[42%] w-[38%] h-[32%] cursor-pointer z-10"
      >
        <div className={`w-full h-full border transition-all duration-300 relative rounded-lg p-2 flex flex-col justify-between ${
          hoveredObject === 'desk'
            ? 'border-amber-400/90 bg-[#251810]/90 shadow-xl shadow-amber-500/10'
            : 'border-amber-950 bg-[#1c120c]/90'
        }`}>
          {/* Desk Surface */}
          <div className="w-full h-7 border-b border-amber-950 flex items-center justify-between px-3">
            <div className="w-12 h-1 bg-amber-900/60 rounded" />
            <div className="w-20 h-1 bg-amber-900/60 rounded" />
          </div>

          {/* Desk Legs & Compartments */}
          <div className="w-full flex-1 flex justify-between px-3 pt-2">
            <div className="w-4 h-full bg-amber-950/80 rounded" />

            {/* OBJECT 5: DRAWER (Inside Desk) */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onObjectClick('drawer');
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredObject('drawer');
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                setHoveredObject(null);
              }}
              title={getObjectTooltip('drawer')}
              className={`w-28 h-14 border rounded cursor-pointer transition-all duration-200 flex items-center justify-center ${
                hoveredObject === 'drawer'
                  ? 'border-cyan-400 bg-cyan-950/40 scale-105'
                  : 'border-amber-800 bg-[#2b1b11]'
              }`}
            >
              <div className="w-8 h-2 rounded bg-amber-600 border border-amber-500 shadow-sm" />
            </div>

            <div className="w-4 h-full bg-amber-950/80 rounded" />
          </div>
        </div>
      </div>

      {/* OBJECT 6: BRASS DESK LAMP (Rests on desk surface) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onObjectClick('lamp');
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          setHoveredObject('lamp');
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          setHoveredObject(null);
        }}
        title={getObjectTooltip('lamp')}
        className="group absolute left-[40%] top-[34%] w-[7%] h-[15%] cursor-pointer z-20"
      >
        <div className={`w-full h-full transition-all duration-200 flex flex-col items-center justify-end ${
          hoveredObject === 'lamp' ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''
        }`}>
          {/* Lamp Shade */}
          <div className={`w-10 h-5 rounded-t-full border transition-colors ${
            isUV ? 'bg-purple-900 border-purple-400' : roomState.lampOn ? 'bg-amber-600 border-amber-400' : 'bg-neutral-800 border-neutral-700'
          }`} />
          {/* Gooseneck */}
          <div className="w-1.5 h-6 bg-amber-700" />
          {/* Brass Base */}
          <div className="w-7 h-2 rounded bg-amber-800 border border-amber-600 shadow" />
        </div>
      </div>

      {/* OBJECT 8: STRANGE NOTE (Rests on desk surface) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onObjectClick('note');
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          setHoveredObject('note');
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          setHoveredObject(null);
        }}
        title={getObjectTooltip('note')}
        className="group absolute left-[54%] top-[43%] w-[6%] h-[7%] cursor-pointer z-20"
      >
        <div className={`w-full h-full bg-[#f4ebd0] border rotate-[-6deg] transition-all duration-200 rounded-sm shadow-md flex items-center justify-center p-1 ${
          hoveredObject === 'note' ? 'scale-125 border-cyan-400 shadow-cyan-400/40' : 'border-neutral-400'
        }`}>
          <div className="w-full h-full flex flex-col justify-around py-0.5">
            <div className="w-full h-0.5 bg-neutral-700/80 rounded" />
            <div className="w-3/4 h-0.5 bg-neutral-700/80 rounded" />
            <div className="w-4/5 h-0.5 bg-neutral-700/80 rounded" />
          </div>
        </div>
      </div>

      {/* OBJECT 7: TALL WALL MIRROR */}
      <div 
        onClick={() => onObjectClick('mirror')}
        onMouseEnter={() => setHoveredObject('mirror')}
        onMouseLeave={() => setHoveredObject(null)}
        title={getObjectTooltip('mirror')}
        className="group absolute right-[6%] top-[14%] w-[12%] h-[64%] cursor-pointer z-10"
      >
        <div className={`w-full h-full rounded-t-3xl border-2 transition-all duration-300 relative flex flex-col items-center p-1.5 ${
          hoveredObject === 'mirror'
            ? 'border-cyan-400 shadow-xl shadow-cyan-400/30'
            : 'border-cyan-900/60 bg-[#091018]/90'
        }`}>
          {/* Reflective Glass Surface */}
          <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-[#0e1b29] to-[#080d14] border border-cyan-900/40 relative overflow-hidden flex items-center justify-center">
            {/* Mirror Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/5 to-transparent pointer-events-none" />

            {/* Silhouette reflection */}
            <div className={`w-10 h-28 rounded-t-full bg-neutral-900/80 transition-all duration-700 ${
              loopCount >= 3 ? 'delay-500 scale-95' : ''
            }`}>
              <div className="w-6 h-6 rounded-full bg-neutral-900 mx-auto -mt-3 shadow-inner" />
            </div>

            {/* Loop 8 Darkness Secret Relic Glow */}
            {loopCount === 8 && !roomState.lampOn && (
              <div className="absolute w-5 h-5 rounded-full bg-purple-500/80 blur-[2px] animate-ping" />
            )}
          </div>
        </div>
      </div>

      {/* OBJECT 9: LOOSE FLOOR TILE */}
      <div 
        onClick={() => onObjectClick('tile')}
        onMouseEnter={() => setHoveredObject('tile')}
        onMouseLeave={() => setHoveredObject(null)}
        title={getObjectTooltip('tile')}
        className="group absolute left-[44%] bottom-[6%] w-[12%] h-[8%] cursor-pointer z-20"
      >
        <div className={`w-full h-full border transition-all duration-200 rounded transform skew-x-[-12deg] flex items-center justify-center ${
          hoveredObject === 'tile'
            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
            : 'border-amber-950/80 bg-[#16120e]'
        }`}>
          <div className="w-4 h-0.5 bg-neutral-700/60 rounded" />
        </div>
      </div>

      {/* HOVER TOOLTIP FLOATER */}
      {hoveredObject && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="px-3.5 py-1 rounded-full bg-neutral-950/90 border border-neutral-700 text-xs font-mono text-cyan-300 tracking-wider shadow-lg">
            {getObjectTooltip(hoveredObject)}
          </div>
        </div>
      )}
    </div>
  );
};
