"use client"

export function SkeletonSearch() {
  return (
    <div className="flex items-center justify-center py-12 animate-in fade-in duration-500">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {/* Gradient for mystical glow */}
            <radialGradient id="wheel-glow">
              <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="rgb(6, 182, 212)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.4" />
            </radialGradient>

            <linearGradient id="spoke-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(251, 191, 36)" />
              <stop offset="50%" stopColor="rgb(6, 182, 212)" />
              <stop offset="100%" stopColor="rgb(168, 85, 247)" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className="animate-spin-wheel" style={{ transformOrigin: "100px 100px" }}>
            {/* Outer decorative ring */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="url(#wheel-glow)"
              strokeWidth="3"
              filter="url(#glow)"
              opacity="0.6"
            />

            {/* Inner ring */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="url(#spoke-gradient)"
              strokeWidth="2"
              filter="url(#glow)"
            />

            {/* 8 spokes radiating from center */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1="100"
                y1="100"
                x2={100 + 70 * Math.cos((angle * Math.PI) / 180)}
                y2={100 + 70 * Math.sin((angle * Math.PI) / 180)}
                stroke="url(#spoke-gradient)"
                strokeWidth="2"
                filter="url(#glow)"
                opacity="0.8"
              />
            ))}

            {/* Decorative nodes at spoke ends */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <circle
                key={`node-${i}`}
                cx={100 + 70 * Math.cos((angle * Math.PI) / 180)}
                cy={100 + 70 * Math.sin((angle * Math.PI) / 180)}
                r="5"
                fill={i % 3 === 0 ? "rgb(251, 191, 36)" : i % 3 === 1 ? "rgb(6, 182, 212)" : "rgb(168, 85, 247)"}
                filter="url(#glow)"
                className="animate-node-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}

            {/* Center hub with mystical symbol */}
            <circle
              cx="100"
              cy="100"
              r="15"
              fill="url(#wheel-glow)"
              filter="url(#glow)"
              className="animate-center-pulse"
            />

            {/* Fortune symbols on outer ring */}
            {[0, 90, 180, 270].map((angle, i) => (
              <circle
                key={`fortune-${i}`}
                cx={100 + 85 * Math.cos((angle * Math.PI) / 180)}
                cy={100 + 85 * Math.sin((angle * Math.PI) / 180)}
                r="8"
                fill="none"
                stroke="rgb(251, 191, 36)"
                strokeWidth="2"
                filter="url(#glow)"
                className="animate-fortune-glow"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            ))}
          </g>
        </svg>
      </div>

      <style jsx>{`
        @keyframes spin-wheel {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes node-pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
        
        @keyframes center-pulse {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes fortune-glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        
        .animate-spin-wheel {
          animation: spin-wheel 4s linear infinite;
        }
        
        .animate-node-pulse {
          animation: node-pulse 2s ease-in-out infinite;
        }
        
        .animate-center-pulse {
          animation: center-pulse 2s ease-in-out infinite;
        }
        
        .animate-fortune-glow {
          animation: fortune-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
