"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface MiningLocation {
  id: number;
  name: string;
  lat: number; // latitude
  lng: number; // longitude
  location: string;
  status: string;
  fundingGoal: number;
  fundingCurrent: number;
  expectedReturn: string;
  goldReserve: string;
}

const miningLocations: MiningLocation[] = [
  {
    id: 1,
    name: "Sierra Leone Artisanal Mine",
    lat: 8.5,
    lng: -11.5,
    location: "Eastern Province, Sierra Leone",
    status: "Funding",
    fundingGoal: 250000,
    fundingCurrent: 187500,
    expectedReturn: "12-15%",
    goldReserve: "~500 oz",
  },
  {
    id: 2,
    name: "Georgian Mountain Gold",
    lat: 42.3,
    lng: 43.4,
    location: "Svaneti Region, Georgia",
    status: "Funding",
    fundingGoal: 180000,
    fundingCurrent: 95000,
    expectedReturn: "10-14%",
    goldReserve: "~350 oz",
  },
  {
    id: 3,
    name: "Brazilian Alluvial Deposit",
    lat: -19.9,
    lng: -43.9,
    location: "Minas Gerais, Brazil",
    status: "Coming Soon",
    fundingGoal: 320000,
    fundingCurrent: 0,
    expectedReturn: "14-18%",
    goldReserve: "~650 oz",
  },
  {
    id: 4,
    name: "Papua New Guinea Highlands",
    lat: -6.0,
    lng: 147.0,
    location: "Eastern Highlands, Papua New Guinea",
    status: "Funding",
    fundingGoal: 420000,
    fundingCurrent: 215000,
    expectedReturn: "15-19%",
    goldReserve: "~850 oz",
  },
  {
    id: 5,
    name: "Dominican Gold Stream",
    lat: 19.0,
    lng: -70.5,
    location: "Pueblo Viejo District, Dominican Republic",
    status: "Funding",
    fundingGoal: 290000,
    fundingCurrent: 145000,
    expectedReturn: "11-14%",
    goldReserve: "~580 oz",
  },
  {
    id: 6,
    name: "Yusufeli River Gold",
    lat: 40.8,
    lng: 41.5,
    location: "Yusufeli, Artvin, Turkey",
    status: "Coming Soon",
    fundingGoal: 375000,
    fundingCurrent: 0,
    expectedReturn: "13-16%",
    goldReserve: "~720 oz",
  },
];

export default function EarthGlobe({ interactive = true, onLocationClick }: { interactive?: boolean; onLocationClick?: (id: number) => void }) {
  const router = useRouter();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive || onLocationClick) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!interactive || onLocationClick) return;
    // Auto-rotation when not dragging
    const interval = setInterval(() => {
      if (!isDragging) {
        setRotation(prev => ({ ...prev, y: prev.y + 0.2 }));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isDragging, interactive, onLocationClick]);

  const projectPoint = (lat: number, lng: number, rotX: number, rotY: number) => {
    // Convert to radians
    const latRad = (lat * Math.PI) / 180;
    const lngRad = ((lng + rotY) * Math.PI) / 180;
    const rotXRad = (rotX * Math.PI) / 180;

    // 3D to 2D projection
    const radius = 180;
    const centerX = 250;
    const centerY = 250;

    let x = radius * Math.cos(latRad) * Math.sin(lngRad);
    let y = radius * Math.sin(latRad);
    let z = radius * Math.cos(latRad) * Math.cos(lngRad);

    // Apply rotation around X axis
    const newY = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
    const newZ = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);

    // Visibility check (is point on front of sphere?)
    const visible = newZ > 0;

    return {
      x: centerX + x,
      y: centerY - newY,
      visible,
      z: newZ,
    };
  };

  const handleLocationClick = (id: number) => {
    if (onLocationClick) {
      onLocationClick(id);
    } else if (interactive) {
      router.push(`/projects?highlight=${id}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${interactive && !onLocationClick ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg className="w-full h-full" viewBox="0 0 500 500" style={{ filter: 'drop-shadow(0 0 30px rgba(229, 179, 90, 0.2))' }}>
        <defs>
          <radialGradient id="sphereGradient">
            <stop offset="0%" stopColor="#1a2744" />
            <stop offset="50%" stopColor="#0f1a2e" />
            <stop offset="100%" stopColor="#060f1a" />
          </radialGradient>

          <radialGradient id="sphereHighlight">
            <stop offset="0%" stopColor="rgba(229, 179, 90, 0.3)" />
            <stop offset="50%" stopColor="rgba(229, 179, 90, 0.1)" />
            <stop offset="100%" stopColor="rgba(229, 179, 90, 0)" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="dotGradient">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Main sphere */}
        <circle
          cx="250"
          cy="250"
          r="180"
          fill="url(#sphereGradient)"
          stroke="rgba(229, 179, 90, 0.3)"
          strokeWidth="2"
        />

        {/* Highlight/shine effect */}
        <ellipse
          cx="280"
          cy="220"
          rx="100"
          ry="120"
          fill="url(#sphereHighlight)"
          opacity="0.6"
        />

        {/* Continents */}
        {mounted && <g opacity="0.4" fill="#E5B35A" stroke="#C89B3C" strokeWidth="0.5">
          {/* Africa */}
          {(() => {
            const africaPoints = [
              { lat: 37, lng: 10 }, { lat: 32, lng: 30 }, { lat: 12, lng: 43 },
              { lat: -5, lng: 42 }, { lat: -15, lng: 40 }, { lat: -28, lng: 32 },
              { lat: -34, lng: 20 }, { lat: -30, lng: 16 }, { lat: -10, lng: 12 },
              { lat: 0, lng: 8 }, { lat: 15, lng: -17 }, { lat: 32, lng: -8 },
              { lat: 37, lng: 10 }
            ];
            const projectedPoints = africaPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* Europe */}
          {(() => {
            const europePoints = [
              { lat: 71, lng: 25 }, { lat: 70, lng: 30 }, { lat: 60, lng: 32 },
              { lat: 50, lng: 40 }, { lat: 42, lng: 40 }, { lat: 36, lng: 28 },
              { lat: 36, lng: -10 }, { lat: 43, lng: -9 }, { lat: 50, lng: 2 },
              { lat: 60, lng: 10 }, { lat: 71, lng: 25 }
            ];
            const projectedPoints = europePoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* Asia */}
          {(() => {
            const asiaPoints = [
              { lat: 77, lng: 100 }, { lat: 70, lng: 140 }, { lat: 60, lng: 160 },
              { lat: 50, lng: 142 }, { lat: 35, lng: 138 }, { lat: 20, lng: 122 },
              { lat: 1, lng: 104 }, { lat: 10, lng: 95 }, { lat: 23, lng: 88 },
              { lat: 35, lng: 75 }, { lat: 40, lng: 60 }, { lat: 45, lng: 50 },
              { lat: 70, lng: 40 }, { lat: 77, lng: 100 }
            ];
            const projectedPoints = asiaPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* North America */}
          {(() => {
            const naPoints = [
              { lat: 72, lng: -95 }, { lat: 70, lng: -70 }, { lat: 60, lng: -55 },
              { lat: 45, lng: -65 }, { lat: 30, lng: -80 }, { lat: 25, lng: -82 },
              { lat: 20, lng: -88 }, { lat: 15, lng: -95 }, { lat: 33, lng: -117 },
              { lat: 50, lng: -125 }, { lat: 65, lng: -140 }, { lat: 72, lng: -95 }
            ];
            const projectedPoints = naPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* South America */}
          {(() => {
            const saPoints = [
              { lat: 12, lng: -72 }, { lat: 5, lng: -61 }, { lat: -5, lng: -50 },
              { lat: -23, lng: -43 }, { lat: -33, lng: -53 }, { lat: -55, lng: -68 },
              { lat: -50, lng: -73 }, { lat: -20, lng: -70 }, { lat: 0, lng: -78 },
              { lat: 10, lng: -78 }, { lat: 12, lng: -72 }
            ];
            const projectedPoints = saPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* Australia */}
          {(() => {
            const ausPoints = [
              { lat: -10, lng: 130 }, { lat: -12, lng: 142 }, { lat: -20, lng: 149 },
              { lat: -28, lng: 153 }, { lat: -38, lng: 147 }, { lat: -39, lng: 140 },
              { lat: -35, lng: 116 }, { lat: -22, lng: 114 }, { lat: -10, lng: 130 }
            ];
            const projectedPoints = ausPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* Antarctica */}
          {(() => {
            const antarcticaPoints = [
              { lat: -60, lng: 0 }, { lat: -65, lng: 45 }, { lat: -70, lng: 90 },
              { lat: -68, lng: 135 }, { lat: -65, lng: 180 }, { lat: -68, lng: -135 },
              { lat: -70, lng: -90 }, { lat: -65, lng: -45 }, { lat: -60, lng: 0 }
            ];
            const projectedPoints = antarcticaPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* Greenland */}
          {(() => {
            const greenlandPoints = [
              { lat: 83, lng: -35 }, { lat: 77, lng: -20 }, { lat: 70, lng: -22 },
              { lat: 60, lng: -45 }, { lat: 60, lng: -50 }, { lat: 70, lng: -52 },
              { lat: 78, lng: -70 }, { lat: 83, lng: -35 }
            ];
            const projectedPoints = greenlandPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}

          {/* New Zealand */}
          {(() => {
            const nzPoints = [
              { lat: -34, lng: 173 }, { lat: -41, lng: 175 }, { lat: -47, lng: 168 },
              { lat: -46, lng: 166 }, { lat: -40, lng: 172 }, { lat: -34, lng: 173 }
            ];
            const projectedPoints = nzPoints.map(p => projectPoint(p.lat, p.lng, rotation.x, rotation.y));
            if (projectedPoints.some(p => !p.visible)) return null;
            return (
              <path d={`M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} opacity={Math.min(...projectedPoints.map(p => p.z)) / 180} />
            );
          })()}
        </g>}

        {/* Latitude lines */}
        <g opacity="0.08" stroke="#E5B35A" strokeWidth="0.5" fill="none">
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = 250 - 180 * Math.sin((lat * Math.PI) / 180) * Math.cos((rotation.x * Math.PI) / 180);
            const rx = 180 * Math.cos((lat * Math.PI) / 180);
            const ry = rx * Math.sin((rotation.x * Math.PI) / 180);

            return (
              <ellipse
                key={lat}
                cx="250"
                cy={y}
                rx={rx}
                ry={Math.abs(ry)}
              />
            );
          })}
        </g>

        {/* Longitude lines */}
        <g opacity="0.08" stroke="#E5B35A" strokeWidth="0.5" fill="none">
          {[0, 30, 60, 90, 120, 150].map((lng) => {
            const angle = ((lng + rotation.y) * Math.PI) / 180;
            const visible = Math.cos(angle) > 0;

            if (!visible) return null;

            const rx = 180 * Math.abs(Math.cos(angle));
            const rotXRad = (rotation.x * Math.PI) / 180;
            const ry = 180;

            return (
              <ellipse
                key={lng}
                cx="250"
                cy="250"
                rx={rx}
                ry={ry}
                transform={`rotate(${rotation.x} 250 250)`}
                opacity={Math.abs(Math.cos(angle))}
              />
            );
          })}
        </g>

        {/* Mining locations */}
        {miningLocations.map((location) => {
          const point = projectPoint(location.lat, location.lng, rotation.x, rotation.y);

          if (!point.visible) return null;

          const isHovered = hoveredLocation === location.id;
          const scale = isHovered ? 1.5 : 1;
          const opacity = 0.3 + (point.z / 180) * 0.7; // Fade based on depth

          return (
            <g
              key={location.id}
              className="cursor-pointer transition-transform"
              onMouseEnter={() => setHoveredLocation(location.id)}
              onMouseLeave={() => setHoveredLocation(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleLocationClick(location.id);
              }}
              style={{ transformOrigin: `${point.x}px ${point.y}px` }}
            >
              {/* Pulsing outer ring */}
              <circle
                cx={point.x}
                cy={point.y}
                r={8 * scale}
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
                opacity={opacity * 0.6}
              >
                <animate
                  attributeName="r"
                  values={`${8 * scale};${14 * scale};${8 * scale}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values={`${opacity * 0.6};${opacity * 0.2};${opacity * 0.6}`}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Glowing dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={5 * scale}
                fill="url(#dotGradient)"
                filter="url(#glow)"
                opacity={opacity}
              >
                <animate
                  attributeName="opacity"
                  values={`${opacity};${opacity * 1.5};${opacity}`}
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>

            </g>
          );
        })}

        {/* Connection lines between locations (on surface) */}
        {mounted && <g opacity="0.3" stroke="#4ade80" strokeWidth="1" fill="none" strokeDasharray="2,2">
          {miningLocations.map((loc1, i) => {
            return miningLocations.slice(i + 1).map((loc2) => {
              const point1 = projectPoint(loc1.lat, loc1.lng, rotation.x, rotation.y);
              const point2 = projectPoint(loc2.lat, loc2.lng, rotation.x, rotation.y);

              if (!point1.visible || !point2.visible) return null;

              return (
                <path
                  key={`${loc1.id}-${loc2.id}`}
                  d={`M ${point1.x} ${point1.y} Q 250 250 ${point2.x} ${point2.y}`}
                  opacity={Math.min(point1.z, point2.z) / 180}
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="20"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
              );
            });
          })}
        </g>}
      </svg>

      {/* Project info hover card */}
      {hoveredLocation && (() => {
        const location = miningLocations.find(loc => loc.id === hoveredLocation);
        if (!location) return null;

        const point = projectPoint(location.lat, location.lng, rotation.x, rotation.y);
        if (!point.visible) return null;

        // Calculate card position (as percentage of container)
        const cardX = (point.x / 500) * 100;
        const cardY = (point.y / 500) * 100;

        // Determine if card should appear on left or right side of dot
        const showLeft = cardX > 50;

        return (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: `${cardX}%`,
              top: `${cardY}%`,
              transform: showLeft ? 'translate(-100%, -50%) translateX(-20px)' : 'translate(0%, -50%) translateX(20px)',
            }}
          >
            <div className="glass rounded-xl p-4 border border-gold/40 shadow-2xl shadow-gold/20 min-w-[280px] animate-scale-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gold mb-1">{location.name}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location.location}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  location.status === "Funding"
                    ? "bg-gold/90 text-navy"
                    : "bg-gray-700/90 text-gray-300"
                }`}>
                  {location.status}
                </span>
              </div>

              {location.status === "Funding" && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gold font-bold">
                      ${(location.fundingCurrent / 1000).toFixed(0)}k / ${(location.fundingGoal / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="relative w-full bg-navy/60 rounded-full h-1.5 overflow-hidden border border-gold/20">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-gold to-gold-light rounded-full"
                      style={{ width: `${(location.fundingCurrent / location.fundingGoal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-navy/60 rounded p-2 border border-gold/10">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Return</div>
                  <div className="text-xs text-gold font-bold">{location.expectedReturn}</div>
                </div>
                <div className="bg-navy/60 rounded p-2 border border-gold/10">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Gold Reserve</div>
                  <div className="text-xs text-white font-bold">{location.goldReserve}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gold/10">
                <div className="text-[10px] text-gray-500 text-center">
                  Click to view full details
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
