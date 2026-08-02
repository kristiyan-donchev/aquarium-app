import React from 'react';
import { initials, avatarColorClass } from '../lib/avatar.js';

export default function UserAvatar({ name, photoURL, size, className = '' }) {
  const sizeClass = size ? `avatar-${size}` : '';
  const classes = `avatar ${sizeClass} ${className}`.trim();

  if (photoURL) {
    return <img src={photoURL} alt="" className={`${classes} avatar-photo`} />;
  }
  return (
    <div className={`${classes} ${avatarColorClass(name)}`} aria-hidden="true">
      {initials(name)}
    </div>
  );
}
