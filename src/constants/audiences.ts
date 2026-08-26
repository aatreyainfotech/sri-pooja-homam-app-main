// Shared audience-targeting options — used by the admin notification
// broadcaster and the home-tab promo popup config. Keep in sync with the
// backend's BROADCAST_AUDIENCE_ROLES map in backend/server.py.
export type Audience = 'all' | 'devotee' | 'poojari' | 'admin' | 'hotel_manager';

export const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: 'All Users' },
  { value: 'devotee', label: 'Devotees' },
  { value: 'poojari', label: 'Poojaris' },
  { value: 'admin', label: 'Admins' },
  { value: 'hotel_manager', label: 'Hotel Managers' },
];

export function audienceLabel(value: string | undefined | null): string {
  return AUDIENCE_OPTIONS.find((a) => a.value === value)?.label ?? 'All Users';
}

// True if a user with `role` (or `null` for a guest) should see content
// targeted at `audience`. 'all' always matches, including guests.
export function matchesAudience(audience: string | undefined | null, role: string | null | undefined): boolean {
  const a = (audience || 'all').toLowerCase();
  if (a === 'all') return true;
  if (a === 'admin') return role === 'admin' || role === 'super_admin';
  return role === a;
}
