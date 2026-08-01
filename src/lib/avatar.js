const AVATAR_COLORS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0]?.toUpperCase() || '').join('');
  return letters || '?';
}

export function avatarColorClass(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `avatar-${AVATAR_COLORS[hash % AVATAR_COLORS.length]}`;
}
