"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function HeroVisual() {
  const [nodes, setNodes] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Create distributed nodes
    const nodePositions = [
      { x: 50, y: 30 }, { x: 150, y: 60 }, { x: 250, y: 40 },
      { x: 350, y: 70 }, { x: 450, y: 35 }, { x: 100, y: 120 },
      { x: 200, y: 150 }, { x: 300, y: 130 }, { x: 400, y: 155 },
    ];

    const createdNodes = nodePositions.map((pos, i) => ({
      id: i,
      x: pos.x,
      y: pos.y,
      delay: i * 0.2,
    }));
    setNodes(createdNodes);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 500 200" fill="none">
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Gold gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D78E" />
            <stop offset="50%" stopColor="#E5B35A" />
            <stop offset="100%" stopColor="#C89B3C" />
          </linearGradient>
        </defs>

        {/* Connection lines */}
        <g opacity="0.3">
          {[
            [50, 30, 150, 60], [150, 60, 250, 40], [250, 40, 350, 70],
            [350, 70, 450, 35], [100, 120, 200, 150], [200, 150, 300, 130],
            [300, 130, 400, 155], [50, 30, 100, 120], [150, 60, 200, 150],
            [250, 40, 300, 130], [350, 70, 400, 155],
          ].map((coords, i) => (
            <line
              key={i}
              x1={coords[0]}
              y1={coords[1]}
              x2={coords[2]}
              y2={coords[3]}
              stroke="url(#goldGrad)"
              strokeWidth="1"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0.5;0"
                dur="4s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
        </g>

        {/* Data flow particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={`particle-${i}`}
            r="2"
            fill="#E5B35A"
            filter="url(#glow)"
          >
            <animateMotion
              dur="6s"
              begin={`${i * 1.2}s`}
              repeatCount="indefinite"
              path="M 50,30 Q 200,100 450,35"
            />
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="6s"
              begin={`${i * 1.2}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="6"
              fill="#0a1628"
              stroke="url(#goldGrad)"
              strokeWidth="2"
              filter="url(#glow)"
            >
              <animate
                attributeName="r"
                values="6;8;6"
                dur="3s"
                begin={`${node.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={node.x}
              cy={node.y}
              r="3"
              fill="url(#goldGrad)"
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                begin={`${node.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}

        {/* Central hub */}
        <g transform="translate(250, 90)">
          <circle
            r="20"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="2"
            opacity="0.4"
          >
            <animate
              attributeName="r"
              values="20;30;20"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.1;0.4"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>

          <circle r="12" fill="url(#goldGrad)" opacity="0.9" filter="url(#glow)">
            <animate
              attributeName="opacity"
              values="0.9;1;0.9"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Gold coins floating */}
        {[0, 1, 2].map((i) => (
          <g key={`coin-${i}`}>
            <circle
              cx={100 + i * 150}
              cy={180}
              r="8"
              fill="#E5B35A"
              opacity="0"
            >
              <animate
                attributeName="cy"
                values="180;20;180"
                dur="8s"
                begin={`${i * 2.5}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.7;0"
                dur="8s"
                begin={`${i * 2.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>

      {/* Overlay logo coins */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-24 h-24">
          <Image
            src="/logo.png"
            alt="Gold"
            width={96}
            height={96}
            className="animate-float drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
