import React from 'react';

function Fish({ className, color, style }) {
  return (
    <svg className={className} style={style} viewBox="-20 -5 120 70" width="70" height="42" aria-hidden="true">
      <path d="M10,30 L-18,8 L-18,52 Z" fill={color} opacity="0.9" />
      <ellipse cx="52" cy="30" rx="42" ry="22" fill={color} />
      <path d="M40,10 Q52,-4 66,8 Q54,10 40,10 Z" fill={color} opacity="0.85" />
      <circle cx="82" cy="24" r="3.5" fill="#0b1f26" />
    </svg>
  );
}

function Seaweed({ className, color, height, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 160" width="24" height={height} aria-hidden="true">
      <path
        d="M12,160 C2,130 22,110 8,80 C-4,55 18,35 10,0"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FISH = [
  { color: '#f4a340', top: '18%', duration: 34, delay: 0, size: 1 },
  { color: '#5fb3d9', top: '38%', duration: 46, delay: -14, size: 0.75, reverse: true },
  { color: '#e8615a', top: '58%', duration: 40, delay: -6, size: 0.9 },
  { color: '#f4d35e', top: '72%', duration: 52, delay: -30, size: 0.6, reverse: true },
];

const SEAWEED = [
  { left: '4%', height: 130, color: '#1f8a5f', delay: 0 },
  { left: '12%', height: 90, color: '#1a6e4c', delay: -2 },
  { left: '82%', height: 150, color: '#1f8a5f', delay: -1 },
  { left: '91%', height: 100, color: '#1a6e4c', delay: -3.5 },
];

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3) % 100}%`,
  size: 6 + ((i * 5) % 14),
  duration: 10 + ((i * 3) % 12),
  delay: -((i * 4) % 20),
}));

export default function AquariumBackground() {
  return (
    <div className="aquarium-bg" aria-hidden="true">
      <div className="aquarium-gradient" />
      {SEAWEED.map((p, i) => (
        <Seaweed
          key={i}
          className="seaweed"
          color={p.color}
          height={p.height}
          style={{ left: p.left, animationDelay: `${p.delay}s` }}
        />
      ))}
      {FISH.map((f, i) => (
        <div
          key={i}
          className={`fish-lane${f.reverse ? ' reverse' : ''}`}
          style={{ top: f.top, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}
        >
          <Fish
            className="fish"
            color={f.color}
            style={{ transform: `scale(${f.size})${f.reverse ? ' scaleX(-1)' : ''}` }}
          />
        </div>
      ))}
      <div className="bubble-field">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
