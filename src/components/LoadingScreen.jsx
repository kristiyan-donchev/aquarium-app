import React from 'react';

function Fish({ className }) {
  return (
    <svg className={className} viewBox="-20 -5 120 70" width="70" height="42" aria-hidden="true">
      <path d="M10,30 L-18,8 L-18,52 Z" fill="#f4a340" opacity="0.9" />
      <ellipse cx="52" cy="30" rx="42" ry="22" fill="#f4a340" />
      <path d="M40,10 Q52,-4 66,8 Q54,10 40,10 Z" fill="#f4a340" opacity="0.85" />
      <circle cx="82" cy="24" r="3.5" fill="#0b1f26" />
    </svg>
  );
}

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="loading-screen">
      <div className="loading-tank">
        <div className="loading-fish-lane">
          <Fish className="loading-fish" />
        </div>
        <div className="loading-sign">{message}</div>
      </div>
    </div>
  );
}
