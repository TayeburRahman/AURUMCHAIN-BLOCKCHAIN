"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectLocation {
  id: number;
  name: string;
  x: number;
  y: number;
  country: string;
}

const projectLocations: ProjectLocation[] = [
  { id: 1, name: "Sierra Leone", x: 48, y: 52, country: "Sierra Leone" },
  { id: 2, name: "Georgia", x: 58, y: 42, country: "Georgia" },
  { id: 3, name: "Brazil", x: 32, y: 68, country: "Brazil" },
];

export default function WorldMap({ interactive = true, onLocationClick }: { interactive?: boolean; onLocationClick?: (id: number) => void }) {
  const router = useRouter();
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLocationClick = (id: number) => {
    if (onLocationClick) {
      onLocationClick(id);
    } else if (interactive) {
      router.push(`/projects?highlight=${id}`);
    }
  };

  const handleMapClick = () => {
    if (interactive && !onLocationClick) {
      setIsExpanded(true);
      setTimeout(() => {
        router.push('/projects');
      }, 300);
    }
  };

  return (
    <div
      className={`relative w-full h-full transition-all duration-300 ${interactive && !onLocationClick ? 'cursor-pointer hover:scale-105' : ''} ${isExpanded ? 'scale-110 opacity-0' : ''}`}
      onClick={interactive && !onLocationClick ? handleMapClick : undefined}
    >
      <svg className="w-full h-full" viewBox="0 0 100 60" fill="none">
        <defs>
          <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5B35A" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#E5B35A" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#C89B3C" stopOpacity="0.3" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Simplified world map continents */}
        <g opacity="0.15" stroke="#E5B35A" strokeWidth="0.3" fill="url(#mapGrad)">
          {/* North America */}
          <path d="M 15,20 L 25,18 L 30,25 L 28,35 L 22,38 L 18,35 L 15,30 Z" />

          {/* South America */}
          <path d="M 28,40 L 32,42 L 35,52 L 33,70 L 30,72 L 28,68 L 26,55 L 27,45 Z" />

          {/* Europe */}
          <path d="M 48,22 L 52,20 L 56,22 L 58,28 L 55,32 L 50,30 L 48,26 Z" />

          {/* Africa */}
          <path d="M 48,35 L 52,33 L 56,38 L 58,50 L 55,58 L 50,60 L 46,55 L 45,42 L 47,38 Z" />

          {/* Asia */}
          <path d="M 60,18 L 75,15 L 85,20 L 88,28 L 82,35 L 70,38 L 62,35 L 58,28 L 60,22 Z" />

          {/* Australia */}
          <path d="M 78,50 L 85,48 L 88,52 L 87,56 L 82,58 L 78,56 Z" />
        </g>

        {/* Grid lines */}
        <g opacity="0.05" stroke="#E5B35A" strokeWidth="0.1">
          {[...Array(12)].map((_, i) => (
            <line key={`lat-${i}`} x1="0" y1={i * 5} x2="100" y2={i * 5} />
          ))}
          {[...Array(20)].map((_, i) => (
            <line key={`lon-${i}`} x1={i * 5} y1="0" x2={i * 5} y2="60" />
          ))}
        </g>

        {/* Connection lines between locations */}
        <g opacity="0.4">
          <line x1={projectLocations[0].x} y1={projectLocations[0].y} x2={projectLocations[1].x} y2={projectLocations[1].y} stroke="#E5B35A" strokeWidth="0.3" strokeDasharray="1,1">
            <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1={projectLocations[1].x} y1={projectLocations[1].y} x2={projectLocations[2].x} y2={projectLocations[2].y} stroke="#E5B35A" strokeWidth="0.3" strokeDasharray="1,1">
            <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="3s" begin="1s" repeatCount="indefinite" />
          </line>
          <line x1={projectLocations[2].x} y1={projectLocations[2].y} x2={projectLocations[0].x} y2={projectLocations[0].y} stroke="#E5B35A" strokeWidth="0.3" strokeDasharray="1,1">
            <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="3s" begin="2s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Data flow particles along connections */}
        {[0, 1, 2].map((i) => (
          <circle key={`particle-${i}`} r="0.5" fill="#F5D78E" filter="url(#glow)">
            <animateMotion
              dur="4s"
              begin={`${i * 1.3}s`}
              repeatCount="indefinite"
              path={`M ${projectLocations[i % 3].x},${projectLocations[i % 3].y} L ${projectLocations[(i + 1) % 3].x},${projectLocations[(i + 1) % 3].y}`}
            />
            <animate attributeName="opacity" values="0;1;0" dur="4s" begin={`${i * 1.3}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Project location markers */}
        {projectLocations.map((location, index) => (
          <g
            key={location.id}
            className={`${onLocationClick ? 'cursor-pointer' : ''} transition-transform`}
            onMouseEnter={() => onLocationClick && setHoveredLocation(location.id)}
            onMouseLeave={() => onLocationClick && setHoveredLocation(null)}
            onClick={(e) => {
              if (onLocationClick) {
                e.stopPropagation();
                handleLocationClick(location.id);
              }
            }}
            style={{
              transform: hoveredLocation === location.id ? 'scale(1.3)' : 'scale(1)',
              transformOrigin: `${location.x}% ${location.y}%`
            }}
          >
            {/* Pulsing circle */}
            <circle
              cx={location.x}
              cy={location.y}
              r="2"
              fill="none"
              stroke="#E5B35A"
              strokeWidth="0.2"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                values="2;4;2"
                dur="2s"
                begin={`${index * 0.6}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;0.1;0.4"
                dur="2s"
                begin={`${index * 0.6}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Core marker */}
            <circle
              cx={location.x}
              cy={location.y}
              r="1.2"
              fill="#0a1628"
              stroke="#E5B35A"
              strokeWidth="0.3"
              filter="url(#glow)"
            >
              <animate
                attributeName="fill"
                values="#0a1628;#E5B35A;#0a1628"
                dur="3s"
                begin={`${index * 0.6}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Label */}
            {onLocationClick && (
              <text
                x={location.x}
                y={location.y - 3}
                textAnchor="middle"
                fill="#E5B35A"
                fontSize="2"
                fontFamily="var(--font-mono)"
                opacity={hoveredLocation === location.id ? 1 : 0}
                className="transition-opacity duration-200"
              >
                {location.country}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Overlay logo coins on locations */}
      <div className="absolute inset-0 pointer-events-none">
        {projectLocations.map((location) => (
          <div
            key={`logo-${location.id}`}
            className="absolute transition-all duration-300"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              transform: `translate(-50%, -50%) ${hoveredLocation === location.id ? 'scale(1.3)' : 'scale(1)'}`,
            }}
          >
            <div className={`w-8 h-8 ${hoveredLocation === location.id ? 'animate-pulse' : ''}`}>
              <Image
                src="/logo.png"
                alt="Gold"
                width={32}
                height={32}
                className="drop-shadow-xl opacity-80"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Hover prompt */}
      {interactive && !onLocationClick && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gold/60 text-xs tracking-widest uppercase opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Click to explore projects
        </div>
      )}
    </div>
  );
}
