export const PROFILE_AVATAR_KEY = 'cocokiki:profile-avatar:v1';

export const PROFILE_AVATARS = [
  { id: 'coco', label: 'Coco', image: '/images/avatars/coco.webp' },
  { id: 'kiki', label: 'Kiki', image: '/images/avatars/kiki.webp' },
  { id: 'lua', label: 'Lua', image: '/images/avatars/luiaard.webp' },
  { id: 'samen', label: 'Samen', image: '/images/avatars/samen.webp' },
  { id: 'stokstaartje', label: 'Stokstaartje', image: '/images/avatars/lua.webp' },
  { id: 'avonturier', label: 'Avonturier', image: '/images/avatars/avonturier.webp' },
] as const;

export type ProfileAvatarId = typeof PROFILE_AVATARS[number]['id'];

export function loadProfileAvatar(): ProfileAvatarId {
  if (typeof window === 'undefined') return 'coco';
  try {
    const stored = window.localStorage.getItem(PROFILE_AVATAR_KEY);
    if (stored === 'luiaard') return 'lua';
    return PROFILE_AVATARS.some(avatar => avatar.id === stored) ? stored as ProfileAvatarId : 'coco';
  } catch {
    return 'coco';
  }
}

export function saveProfileAvatar(avatar: ProfileAvatarId) {
  try {
    window.localStorage.setItem(PROFILE_AVATAR_KEY, avatar);
  } catch {
    // Profile selection remains usable for the current session when storage is unavailable.
  }
}
