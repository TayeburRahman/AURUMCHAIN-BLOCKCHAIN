"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function MiningAnimation() {
  const [goldPieces, setGoldPieces] = useState<Array<{ id: number; delay: number }>>([]);

  useEffect(() => {
    // Create 5 gold pieces traveling on the belt
    const pieces = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      delay: i * 2,
    }));
    setGoldPieces(pieces);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-8 p-8">
      {/* Mining Card */}
      <div className="relative glass rounded-2xl p-6 border border-gold/30 backdrop-blur-sm w-64 h-64 flex flex-col items-center justify-center animate-fade-in">
        <div className="absolute top-3 left-3">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
        </div>

        {/* Mining Icon/Visual */}
        <div className="relative mb-4">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Simple mine shaft */}
            <rect x="25" y="40" width="30" height="35" fill="#4A4A4A" stroke="#E5B35A" strokeWidth="2" rx="2" />
            <path d="M 25 40 L 40 25 L 55 40" fill="#6B6B6B" stroke="#E5B35A" strokeWidth="2" />

            {/* Pickaxe */}
            <g className="pickaxe-swing" style={{ transformOrigin: '45px 35px' }}>
              <line x1="45" y1="35" x2="45" y2="55" stroke="#C89B3C" strokeWidth="2" />
              <path d="M 40 30 L 50 30 L 52 35 L 38 35 Z" fill="#E5B35A" />
            </g>

            {/* Ground with sparkles */}
            <circle cx="35" cy="60" r="2" fill="#F5D78E" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <div className="text-center">
          <div className="text-white font-bold text-sm mb-1">Mining Site</div>
          <div className="text-gray-400 text-xs">Gold Production</div>
        </div>
      </div>

      {/* Conveyor Belt Connection */}
      <div className="relative flex-1 max-w-xs">
        {/* Belt Line */}
        <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2">
          <div className="w-full h-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg border-2 border-gray-500/50"></div>

          {/* Belt markings */}
          <div className="absolute inset-0 flex items-center overflow-hidden">
            <div className="belt-marks-container">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="belt-mark"
                  style={{ animationDelay: `${i * 0.3}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Gold coins traveling */}
        <div className="absolute inset-0 pointer-events-none">
          {goldPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute top-1/2 -translate-y-1/2 gold-traveling"
              style={{
                left: '-40px',
                animationDelay: `${piece.delay}s`,
              }}
            >
              <Image
                src="/logo.png"
                alt="Gold"
                width={32}
                height={32}
                className="drop-shadow-xl"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Investor Card */}
      <div className="relative glass rounded-2xl p-6 border border-gold/30 backdrop-blur-sm w-64 h-64 flex flex-col items-center justify-center animate-fade-in delay-300">
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Investor Icon/Visual */}
        <div className="relative mb-4">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Person silhouette */}
            <circle cx="40" cy="25" r="10" fill="#E5B35A" />
            <path d="M 25 55 Q 25 38, 40 38 Q 55 38, 55 55 L 55 65 Q 55 70, 50 70 L 30 70 Q 25 70, 25 65 Z" fill="#E5B35A" />

            {/* Wallet/Money indicator */}
            <rect x="32" y="45" width="16" height="12" fill="#C89B3C" stroke="#F5D78E" strokeWidth="1.5" rx="2" />
            <circle cx="40" cy="51" r="2" fill="#F5D78E" />

            {/* Gold accumulation sparkle */}
            <circle cx="50" cy="40" r="3" fill="#F5D78E" opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        <div className="text-center">
          <div className="text-white font-bold text-sm mb-1">Investor</div>
          <div className="text-gray-400 text-xs">Receives Returns</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes goldTravel {
          0% {
            left: -40px;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            left: calc(100% + 40px);
            opacity: 0;
          }
        }

        @keyframes beltMarkMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(40px);
          }
        }

        @keyframes pickaxeSwing {
          0%, 100% {
            transform: rotate(-10deg);
          }
          50% {
            transform: rotate(10deg);
          }
        }

        .gold-traveling {
          animation: goldTravel 8s linear infinite;
        }

        .belt-marks-container {
          display: flex;
          gap: 20px;
          animation: beltMarkMove 2s linear infinite;
        }

        .belt-mark {
          width: 8px;
          height: 4px;
          background: #4A4A4A;
          border-radius: 2px;
          opacity: 0.7;
        }

        .pickaxe-swing {
          animation: pickaxeSwing 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
