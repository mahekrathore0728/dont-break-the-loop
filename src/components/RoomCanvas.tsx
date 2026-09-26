import React, { useRef, useState, useCallback, useMemo } from 'react';
import { RoomObjectKey, RoomState, BehaviorProfile, InventoryItem } from '../types/game';

interface RoomCanvasProps {
  loopCount: number;
  anomalyLevel: number;
  roomState: RoomState;
  behaviorProfile: BehaviorProfile;
  inventory: InventoryItem[];
  onObjectClick: (target: RoomObjectKey) => void;
  hoveredObject: RoomObjectKey | null;
  setHoveredObject: (target: RoomObjectKey | null) => void;
}

export const RoomCanvas: React.FC<RoomCanvasProps> = ({
  loopCount,
  anomalyLevel,
  roomState,
  behaviorProfile,
  inventory,
  onObjectClick,
  hoveredObject,
  setHoveredObject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cursorPixel, setCursorPixel] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x: nx, y: ny });
    setCursorPixel({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0, y: 0 });
    setHoveredObject(null);
  }, [setHoveredObject]);

  const hasItem = (id: string) => inventory.some(i => i.id === id);
  const isUV = roomState.lampUV && roomState.lampOn;

  const bgTransform = `translate(${mouse.x * -8}px, ${mouse.y * -5}px)`;
  const mgTransform = `translate(${mouse.x * -16}px, ${mouse.y * -10}px)`;
  const fgTransform = `translate(${mouse.x * -24}px, ${mouse.y * -15}px)`;
  const stageTilt = `perspective(1200px) rotateX(${-mouse.y * 3.5}deg) rotateY(${mouse.x * 4.5}deg)`;

  const anomalyColor = anomalyLevel > 75
    ? 'rgba(239, 68, 68, 0.08)'
    : anomalyLevel > 40
    ? 'rgba(245, 158, 11, 0.05)'
    : 'rgba(0, 0, 0, 0)';

  const hourAngle = useMemo(() => ((loopCount * 42) - 90) * (Math.PI / 180), [loopCount]);
  const minuteAngle = useMemo(() => ((loopCount * 150) - 90) * (Math.PI / 180), [loopCount]);

  const getObjectLabel = (key: RoomObjectKey): string => {
    switch (key) {
      case 'door': return roomState.doorUnlocked ? 'Heavy Door \u2014 UNLOCKED' : 'Heavy Iron Door';
      case 'clock': return loopCount === 2 ? 'Grandfather Clock \u2014 SWINGING BACKWARD' : 'Grandfather Clock';
      case 'painting': return loopCount >= 7 ? `Oil Portrait \u2014 ${behaviorProfile.dominantTrait.toUpperCase()}` : 'Oil Portrait';
      case 'desk': return 'Mahogany Writing Desk';
      case 'drawer': return roomState.drawerOpen ? 'Desk Drawer \u2014 OPEN' : roomState.drawerBolted ? 'Desk Drawer \u2014 BOLTED' : 'Desk Drawer';
      case 'lamp': return roomState.lampUV ? 'Brass Lamp \u2014 UV BLACKLIGHT' : roomState.lampOn ? 'Brass Lamp \u2014 ILLUMINATING' : 'Brass Lamp \u2014 OFF';
      case 'mirror': return loopCount === 5 ? 'Tall Wall Mirror \u2014 POINTING DOWNWARD' : loopCount >= 3 ? 'Tall Wall Mirror \u2014 DESYNCHRONIZED' : 'Tall Wall Mirror';
      case 'note': return 'Parchment Note';
      case 'tile': return roomState.tileLifted ? 'Floorboard \u2014 CAVITY EXPOSED' : 'Loose Floor Tile';
      case 'keyItem': return 'Small Brass Key';
      default: return '';
    }
  };

  const glowFilter = (key: RoomObjectKey, accent = '#38bdf8') =>
    hoveredObject === key
      ? `drop-shadow(0 0 12px ${accent}99) drop-shadow(0 0 4px ${accent}bb)`
      : 'none';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-5xl aspect-[16/10] bg-[#030407] rounded-2xl overflow-hidden room-cinematic-shadow select-none cursor-default border border-neutral-800/80 transition-shadow duration-500"
    >
      <div className="absolute inset-0 w-full h-full room-stage" style={{ transform: stageTilt }}>
        <svg viewBox="0 0 1000 625" className="absolute inset-0 w-full h-full block pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wallGradient" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#0a0c12" />
              <stop offset="40%" stopColor="#0f131c" />
              <stop offset="100%" stopColor="#080a0f" />
            </linearGradient>

            <linearGradient id="floorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0c12" />
              <stop offset="30%" stopColor="#141822" />
              <stop offset="100%" stopColor="#1e2230" />
            </linearGradient>

            <linearGradient id="sideWallLeft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#050608" />
              <stop offset="100%" stopColor="#0d1017" />
            </linearGradient>

            <linearGradient id="sideWallRight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d1017" />
              <stop offset="100%" stopColor="#040507" />
            </linearGradient>

            <radialGradient id="lampWarmLight" cx="62%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={roomState.lampOn && !isUV ? '0.58' : '0'} />
              <stop offset="35%" stopColor="#d97706" stopOpacity={roomState.lampOn && !isUV ? '0.24' : '0'} />
              <stop offset="70%" stopColor="#78350f" stopOpacity={roomState.lampOn && !isUV ? '0.08' : '0'} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="lampUVLight" cx="62%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity={isUV ? '0.7' : '0'} />
              <stop offset="35%" stopColor="#9333ea" stopOpacity={isUV ? '0.3' : '0'} />
              <stop offset="70%" stopColor="#581c87" stopOpacity={isUV ? '0.1' : '0'} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="doorLightSeep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={roomState.doorUnlocked ? '#38bdf8' : '#1e293b'} stopOpacity={roomState.doorUnlocked ? '0.75' : '0.15'} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="mahoganyDesk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b170c" />
              <stop offset="50%" stopColor="#3d2212" />
              <stop offset="100%" stopColor="#1a0c06" />
            </linearGradient>

            <radialGradient id="clockDial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#faf5e8" />
              <stop offset="85%" stopColor="#e3d6b1" />
              <stop offset="100%" stopColor="#bca578" />
            </radialGradient>

            <linearGradient id="mirrorGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#081420" />
              <stop offset="40%" stopColor="#0d2133" />
              <stop offset="70%" stopColor="#081826" />
              <stop offset="100%" stopColor="#040b12" />
            </linearGradient>

            <radialGradient id="roomVignette" cx="50%" cy="50%" r="72%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="80%" stopColor="#000000" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
            </radialGradient>

            <linearGradient id="loop8Beam" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#f0f9ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* LAYER 1: BACKGROUND */}
          <g style={{ transform: bgTransform, transition: 'transform 0.15s ease-out' }}>
            <polygon points="0,0 1000,0 870,70 130,70" fill="#040507" />
            <line x1="130" y1="70" x2="870" y2="70" stroke="#1c202a" strokeWidth="1.5" />
            <polygon points="130,70 870,70 870,440 130,440" fill="url(#wallGradient)" />
            <polygon points="0,0 130,70 130,440 0,625" fill="url(#sideWallLeft)" />
            <polygon points="870,70 1000,0 1000,625 870,440" fill="url(#sideWallRight)" />
            <line x1="130" y1="280" x2="870" y2="280" stroke="#1c212e" strokeWidth="2" />
            <line x1="0" y1="310" x2="130" y2="280" stroke="#141822" strokeWidth="1.5" />
            <line x1="870" y1="280" x2="1000" y2="310" stroke="#141822" strokeWidth="1.5" />

            {[170, 210, 250, 290, 330, 370, 410, 450, 490, 530, 570, 610, 650, 690, 730, 770, 810, 850].map((x, idx) => (
              <line key={idx} x1={x} y1="70" x2={x} y2="280" stroke="#090b10" strokeWidth="1.2" opacity="0.45" />
            ))}

            <polygon points="0,625 130,440 870,440 1000,625" fill="url(#floorGradient)" />
            {[200, 310, 420, 500, 580, 690, 800].map((x, idx) => (
              <line key={idx} x1={x} y1="440" x2={x + (x - 500) * 1.25} y2="625" stroke="#181d28" strokeWidth="1.2" opacity="0.65" />
            ))}

            {/* Loop 2 Scratches leading to floor tile */}
            {loopCount === 2 && (
              <g opacity="0.55">
                <line x1="490" y1="375" x2="495" y2="540" stroke="#92400e" strokeWidth="1.8" strokeDasharray="8 6" />
                <line x1="500" y1="375" x2="508" y2="540" stroke="#78350f" strokeWidth="1.2" strokeDasharray="5 5" />
              </g>
            )}

            {/* Loop 3 UV Runes on Wall */}
            {isUV && loopCount >= 3 && (
              <g className="uv-hidden-rune">
                <text x="218" y="72" textAnchor="middle" fill="#e879f9" fontSize="13" fontFamily="monospace" fontWeight="bold" letterSpacing="3" opacity="0.95">
                  ALIGN GEAR IX
                </text>
                <text x="430" y="150" fill="#e879f9" fontSize="20" fontFamily="monospace" fontWeight="bold" letterSpacing="6" opacity="0.9">
                  III \u2022 VI \u2022 IX
                </text>
                <path d="M 405 160 L 595 160" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.8" />
                <text x="415" y="215" fill="#c084fc" fontSize="11" fontFamily="monospace" letterSpacing="4" opacity="0.75">
                  THE PATTERN IS YOU
                </text>
              </g>
            )}

            {/* Loop 6 Prediction Scanline effect */}
            {loopCount === 6 && (
              <g opacity="0.2" className="animate-pulse">
                <line x1="130" y1="200" x2="870" y2="200" stroke="#c084fc" strokeWidth="1" strokeDasharray="12 4" />
                <text x="500" y="195" textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="monospace" letterSpacing="4">
                  PREDICTION MATRIX ACTIVE
                </text>
              </g>
            )}

            <ellipse
              cx="630" cy="460" rx="270" ry="160"
              fill={isUV ? 'url(#lampUVLight)' : 'url(#lampWarmLight)'}
              className="mix-blend-screen pointer-events-none transition-all duration-700"
            />

            <polygon
              points="60,450 140,440 260,625 90,625"
              fill="url(#doorLightSeep)"
              className="mix-blend-screen pointer-events-none transition-all duration-700"
            />

            {/* Loop 8 Final Freedom Ray */}
            {loopCount === 8 && roomState.loop8PatternBroken && (
              <polygon
                points="40,154 150,154 850,625 0,625"
                fill="url(#loop8Beam)"
                className="mix-blend-screen pointer-events-none animate-pulse"
              />
            )}
          </g>

          {/* LAYER 2: MIDGROUND */}
          <g style={{ transform: mgTransform, transition: 'transform 0.12s ease-out' }}>

            {/* --- OBJECT 3: OIL PAINTING --- */}
            <g
              id="obj-painting"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('painting', '#f59e0b') }}
              onClick={() => onObjectClick('painting')}
              onMouseEnter={() => setHoveredObject('painting')}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <rect x="420" y="90" width="160" height="120" rx="3" fill="#4a2e10" />
              <rect x="424" y="94" width="152" height="112" rx="2" fill="#784b1a" />
              <rect x="428" y="98" width="144" height="104" rx="1" fill="#181109" />
              <circle cx="425" cy="95" r="2.5" fill="#a16207" />
              <circle cx="575" cy="95" r="2.5" fill="#a16207" />
              <circle cx="425" cy="205" r="2.5" fill="#a16207" />
              <circle cx="575" cy="205" r="2.5" fill="#a16207" />

              {loopCount < 7 ? (
                <>
                  <ellipse cx="500" cy="135" rx="16" ry="20" fill="#26170d" />
                  <rect x="484" y="152" width="32" height="42" rx="4" fill="#1f120a" />
                  <circle cx="496" cy="132" r="1.5" fill="#d97706" opacity="0.6" />
                  <circle cx="504" cy="132" r="1.5" fill="#d97706" opacity="0.6" />
                  {loopCount >= 2 && (
                    <text x="435" y="115" fill="#92400e" fontSize="10" fontFamily="monospace" opacity="0.8">
                      {'|'.repeat(Math.min(loopCount, 8))}
                    </text>
                  )}
                </>
              ) : (
                <g>
                  <rect x="428" y="98" width="144" height="104" fill="#090514" />
                  <text
                    x="500"
                    y="142"
                    textAnchor="middle"
                    fill="#a855f7"
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="bold"
                    letterSpacing="2"
                    className="animate-pulse"
                  >
                    {behaviorProfile.dominantTrait.toUpperCase()}
                  </text>
                  <text
                    x="500"
                    y="164"
                    textAnchor="middle"
                    fill="#7c3aed"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="1.5"
                    opacity="0.8"
                  >
                    IDENTIFIED
                  </text>
                  <line x1="430" y1="125" x2="570" y2="125" stroke="#7c3aed" strokeWidth="1" opacity="0.5" />
                  <line x1="440" y1="178" x2="560" y2="178" stroke="#4f46e5" strokeWidth="0.8" opacity="0.4" />
                </g>
              )}
            </g>

            {/* --- OBJECT 2: GRANDFATHER CLOCK --- */}
            <g
              id="obj-clock"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('clock', '#f59e0b') }}
              onClick={() => onObjectClick('clock')}
              onMouseEnter={() => setHoveredObject('clock')}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <rect x="180" y="85" width="76" height="345" rx="5" fill="#1f1109" />
              <rect x="183" y="88" width="70" height="339" rx="4" fill="#2d190d" />
              <path d="M 175 118 Q 218 88 261 118 L 261 155 L 175 155 Z" fill="#382012" />
              <circle cx="218" cy="98" r="4" fill="#d97706" />

              <circle cx="218" cy="142" r="28" fill="url(#clockDial)" />
              <circle cx="218" cy="142" r="26.5" fill="none" stroke="#68471c" strokeWidth="2" />
              <text x="218" y="122" textAnchor="middle" fill="#2d1c08" fontSize="8" fontFamily="serif" fontWeight="bold">XII</text>
              <text x="240" y="145" textAnchor="middle" fill="#2d1c08" fontSize="8" fontFamily="serif" fontWeight="bold">III</text>
              <text x="218" y="165" textAnchor="middle" fill="#2d1c08" fontSize="8" fontFamily="serif" fontWeight="bold">VI</text>
              <text x="196" y="145" textAnchor="middle" fill="#2d1c08" fontSize="8" fontFamily="serif" fontWeight="bold">IX</text>

              <line
                x1="218" y1="142"
                x2={218 + 14 * Math.sin(hourAngle)}
                y2={142 - 14 * Math.cos(hourAngle)}
                stroke="#170c03" strokeWidth="2.5" strokeLinecap="round"
              />
              <line
                x1="218" y1="142"
                x2={218 + 20 * Math.sin(minuteAngle)}
                y2={142 - 20 * Math.cos(minuteAngle)}
                stroke="#2a1606" strokeWidth="1.8" strokeLinecap="round"
              />
              <circle cx="218" cy="142" r="2.5" fill="#78350f" />

              <rect x="195" y="180" width="46" height="135" rx="3" fill="#090d14" opacity="0.8" />
              <line x1="218" y1="180" x2="218" y2="315" stroke="#1c2433" strokeWidth="0.8" />

              <g
                className={loopCount === 2 ? 'animate-pendulum-reverse' : 'animate-pendulum'}
                style={{ transformOrigin: '218px 185px' }}
              >
                <line x1="218" y1="185" x2="218" y2="280" stroke="#b45309" strokeWidth="2" />
                <circle cx="218" cy="282" r="9" fill="#d97706" />
                <circle cx="218" cy="282" r="7.5" fill="#f59e0b" />
              </g>

              <rect x="176" y="415" width="84" height="15" rx="2" fill="#2d190d" />
            </g>

            {/* --- OBJECT 7: TALL WALL MIRROR --- */}
            <g
              id="obj-mirror"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('mirror', '#38bdf8') }}
              onClick={() => onObjectClick('mirror')}
              onMouseEnter={() => setHoveredObject('mirror')}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <rect x="740" y="85" width="88" height="330" rx="44" fill="#1b202c" />
              <rect x="744" y="89" width="80" height="322" rx="40" fill="#10141d" />
              <rect x="747" y="92" width="74" height="316" rx="37" fill="url(#mirrorGlass)" />
              <line x1="755" y1="100" x2="755" y2="390" stroke="#38bdf8" strokeWidth="1" opacity="0.12" />
              <line x1="813" y1="120" x2="813" y2="380" stroke="#38bdf8" strokeWidth="0.8" opacity="0.1" />

              <g
                className={loopCount >= 3 ? 'animate-mirror-shimmer' : ''}
                style={{
                  transform: loopCount >= 3
                    ? `translate(${mouse.x * 12}px, ${mouse.y * 6}px)`
                    : 'none',
                  transition: 'transform 0.4s ease-out'
                }}
              >
                <ellipse cx="784" cy="180" rx="12" ry="16" fill="#060c14" opacity={loopCount >= 3 ? 0.92 : 0.65} />
                <rect x="772" y="194" width="24" height="60" rx="4" fill="#040910" opacity={loopCount >= 3 ? 0.92 : 0.65} />

                {/* Loop 5: Arm pointing downward toward floor tile */}
                {loopCount === 5 && (
                  <g opacity="0.9">
                    <line x1="772" y1="210" x2="736" y2="265" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    <polygon points="730,270 740,260 740,272" fill="#38bdf8" opacity="0.9" />
                  </g>
                )}
              </g>

              {loopCount === 8 && !roomState.lampOn && (
                <circle cx="784" cy="240" r="10" fill="#a855f7" opacity="0.85" className="animate-ping" />
              )}
            </g>

            {/* --- OBJECT 4: WRITING DESK --- */}
            <g
              id="obj-desk"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('desk', '#d97706') }}
              onClick={() => onObjectClick('desk')}
              onMouseEnter={() => setHoveredObject('desk')}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <polygon points="340,300 700,300 740,355 290,355" fill="url(#mahoganyDesk)" />
              <rect x="295" y="355" width="440" height="30" fill="#1e1008" />
              <polygon points="390,304 650,304 680,336 350,336" fill="#0c1710" opacity="0.85" />
              <polygon points="390,304 650,304 680,336 350,336" fill="none" stroke="#68471c" strokeWidth="0.8" opacity="0.6" />
              <rect x="300" y="385" width="18" height="50" rx="2" fill="#170c06" />
              <rect x="710" y="385" width="18" height="50" rx="2" fill="#170c06" />
            </g>

            {/* --- OBJECT 5: DESK DRAWER --- */}
            <g
              id="obj-drawer"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('drawer', '#38bdf8') }}
              onClick={(e) => {
                e.stopPropagation();
                onObjectClick('drawer');
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredObject('drawer');
              }}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <rect
                x="455"
                y="358"
                width={roomState.drawerOpen ? 130 : 120}
                height="24"
                rx="2"
                fill={roomState.drawerOpen ? '#331a0d' : '#261309'}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
              <rect x="457" y="360" width="116" height="20" rx="1" fill="none" stroke="#4a2814" strokeWidth="0.8" />
              <rect x="500" y="366" width="30" height="7" rx="3.5" fill="#92400e" />
              <rect x="502" y="367" width="26" height="5" rx="2.5" fill="#d97706" />
              <circle cx="515" cy="362" r="1.5" fill="#0f0704" />

              {roomState.drawerBolted && (
                <g>
                  <rect x="495" y="357" width="6" height="26" rx="1" fill="#ef4444" opacity="0.9" />
                  <circle cx="498" cy="360" r="1.5" fill="#fecaca" />
                  <circle cx="498" cy="380" r="1.5" fill="#fecaca" />
                </g>
              )}
            </g>

            {/* --- OBJECT 6: BRASS DESK LAMP --- */}
            <g
              id="obj-lamp"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('lamp', '#f59e0b') }}
              onClick={(e) => {
                e.stopPropagation();
                onObjectClick('lamp');
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredObject('lamp');
              }}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <ellipse cx="640" cy="308" rx="22" ry="6" fill="#854d0e" />
              <ellipse cx="640" cy="306" rx="18" ry="4" fill="#a16207" />
              <rect x="637" y="278" width="6" height="30" rx="1" fill="#b45309" />
              <path
                d="M 640 278 Q 632 250 616 242"
                stroke="#b45309"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 596 235 Q 616 222 636 235 L 631 252 Q 616 244 601 252 Z"
                fill={isUV ? '#6b21a8' : roomState.lampOn ? '#b45309' : '#3f2510'}
                stroke={isUV ? '#c084fc' : '#d97706'}
                strokeWidth="1"
              />
              {roomState.lampOn && (
                <ellipse
                  cx="616"
                  cy="245"
                  rx={isUV ? 14 : 10}
                  ry={isUV ? 8 : 6}
                  fill={isUV ? '#e879f9' : '#fef08a'}
                  className={isUV ? '' : 'animate-lamp-flicker'}
                  opacity="0.95"
                />
              )}
            </g>

            {/* --- OBJECT 8: STRANGE NOTE --- */}
            <g
              id="obj-note"
              className="pointer-events-auto cursor-pointer"
              style={{
                filter: glowFilter('note', '#38bdf8'),
                transform: 'rotate(-7deg)',
                transformOrigin: '580px 325px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onObjectClick('note');
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredObject('note');
              }}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <rect x="555" y="306" width="52" height="38" rx="1.5" fill="#f5edd6" />
              <rect x="557" y="308" width="48" height="34" rx="1" fill="#eee1c2" />
              <line x1="562" y1="315" x2="600" y2="315" stroke="#57422b" strokeWidth="1" />
              <line x1="562" y1="322" x2="595" y2="322" stroke="#57422b" strokeWidth="1" />
              <line x1="562" y1="329" x2="598" y2="329" stroke="#57422b" strokeWidth="1" />
              <line x1="562" y1="336" x2="588" y2="336" stroke="#57422b" strokeWidth="1" />
            </g>
          </g>

          {/* LAYER 3: FOREGROUND */}
          <g style={{ transform: fgTransform, transition: 'transform 0.08s ease-out' }}>

            {/* --- OBJECT 1: HEAVY IRON DOOR --- */}
            <g
              id="obj-door"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('door', roomState.doorUnlocked ? '#38bdf8' : '#64748b') }}
              onClick={() => onObjectClick('door')}
              onMouseEnter={() => setHoveredObject('door')}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <rect x="36" y="150" width="118" height="295" rx="4" fill="#080a0e" />
              <rect x="40" y="154" width="110" height="287" rx="3" fill="#0d1117" />
              <rect
                x="44"
                y="158"
                width="102"
                height="279"
                rx="2"
                fill={roomState.doorUnlocked ? '#111928' : '#080b10'}
                style={{ transition: 'fill 0.5s ease' }}
              />

              <rect x="52" y="170" width="40" height="60" rx="2" fill="#05070a" />
              <rect x="98" y="170" width="40" height="60" rx="2" fill="#05070a" />
              <rect x="52" y="245" width="86" height="95" rx="2" fill="#05070a" />
              <rect x="52" y="355" width="86" height="68" rx="2" fill="#05070a" />

              {[175, 235, 345, 418].map((y, idx) => (
                <React.Fragment key={idx}>
                  <circle cx="48" cy={y} r="2" fill="#2d3748" />
                  <circle cx="142" cy={y} r="2" fill="#2d3748" />
                </React.Fragment>
              ))}

              {!roomState.doorMissingHandle ? (
                <g>
                  <circle
                    cx="132"
                    cy="295"
                    r="9"
                    fill={roomState.loop4HabitNeutralized === false && loopCount === 4 ? '#dc2626' : '#92400e'}
                    className={roomState.loop4HabitNeutralized === false && loopCount === 4 ? 'animate-pulse' : ''}
                  />
                  <circle
                    cx="132"
                    cy="295"
                    r="6.5"
                    fill={roomState.loop4HabitNeutralized === false && loopCount === 4 ? '#ef4444' : '#b45309'}
                  />
                </g>
              ) : (
                <circle cx="132" cy="295" r="5" fill="#000000" />
              )}

              <circle cx="132" cy="315" r="4" fill="#020305" />
              <rect x="130" y="315" width="4" height="7" fill="#020305" />

              <circle
                cx="132"
                cy="338"
                r="3.5"
                fill={roomState.doorUnlocked ? '#38bdf8' : '#1e293b'}
                className={roomState.doorUnlocked ? 'animate-pulse' : ''}
                style={{ transition: 'fill 0.4s ease' }}
              />

              {roomState.doorUnlocked && (
                <rect
                  x="40"
                  y="154"
                  width="110"
                  height="287"
                  rx="3"
                  fill="#38bdf8"
                  opacity="0.12"
                  className="mix-blend-screen pointer-events-none"
                />
              )}

              {loopCount === 7 && (
                <rect
                  x="40"
                  y="154"
                  width="110"
                  height="287"
                  rx="3"
                  fill="#7c3aed"
                  opacity="0.18"
                  className="mix-blend-screen pointer-events-none animate-pulse"
                />
              )}
            </g>

            {/* --- OBJECT 9: LOOSE FLOOR TILE --- */}
            <g
              id="obj-tile"
              className="pointer-events-auto cursor-pointer"
              style={{ filter: glowFilter('tile', '#38bdf8') }}
              onClick={() => onObjectClick('tile')}
              onMouseEnter={() => setHoveredObject('tile')}
              onMouseLeave={() => setHoveredObject(null)}
            >
              <polygon
                points="420,545 570,545 595,585 395,585"
                fill={roomState.tileLifted ? '#080a10' : '#141822'}
                style={{ transition: 'fill 0.3s ease' }}
              />
              <polygon
                points="420,545 570,545 595,585 395,585"
                fill="none"
                stroke="#242c3d"
                strokeWidth="1.5"
              />
              {!roomState.tileLifted ? (
                <path d="M 485 565 Q 495 562 505 565" stroke="#4a5568" strokeWidth="2" fill="none" />
              ) : (
                <ellipse cx="495" cy="565" rx="55" ry="12" fill="#000000" opacity="0.85" />
              )}
            </g>

            {/* --- OBJECT 10: KEY ITEM (Loop 1 Brass Key) --- */}
            {loopCount === 1 && !hasItem('brass_key') && !roomState.drawerOpen && (
              <g
                id="obj-keyItem"
                className="pointer-events-auto cursor-pointer animate-pulse"
                style={{ filter: glowFilter('keyItem', '#f59e0b') }}
                onClick={(e) => {
                  e.stopPropagation();
                  onObjectClick('keyItem');
                }}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoveredObject('keyItem');
                }}
                onMouseLeave={() => setHoveredObject(null)}
              >
                <circle cx="510" cy="370" r="5" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <line x1="510" y1="375" x2="510" y2="388" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="510" y1="382" x2="514" y2="382" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="510" y1="386" x2="513" y2="386" stroke="#f59e0b" strokeWidth="1.8" />
              </g>
            )}
          </g>

          {/* OVERLAYS: Anomaly Tint, Vignette & UV Wash */}
          <rect
            x="0" y="0" width="1000" height="625"
            fill={anomalyColor}
            className="mix-blend-screen pointer-events-none transition-colors duration-700"
          />

          <rect
            x="0" y="0" width="1000" height="625"
            fill="url(#roomVignette)"
            className="pointer-events-none"
          />

          {isUV && (
            <rect
              x="0" y="0" width="1000" height="625"
              fill="#581c87"
              opacity="0.1"
              className="mix-blend-color pointer-events-none"
            />
          )}
        </svg>

        {/* Ambient Dust Motes */}
        {roomState.lampOn && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="dust-mote w-1.5 h-1.5 top-[52%] left-[62%] [animation-delay:0s]" />
            <span className="dust-mote w-1 h-1 top-[48%] left-[58%] [animation-delay:3s]" />
            <span className="dust-mote w-2 h-2 top-[60%] left-[65%] [animation-delay:6s]" />
            <span className="dust-mote w-1.5 h-1.5 top-[56%] left-[60%] [animation-delay:9s]" />
          </div>
        )}
      </div>

      {/* MINIMAL FLOATING CONTEXTUAL CHIP */}
      {hoveredObject && (
        <div
          className="absolute z-40 pointer-events-none transition-opacity duration-150"
          style={{
            left: `${cursorPixel.x}px`,
            top: `${cursorPixel.y}px`,
            transform: 'translate(-50%, -150%)',
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700/80 shadow-2xl text-[11px] font-mono tracking-widest text-cyan-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{getObjectLabel(hoveredObject)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
