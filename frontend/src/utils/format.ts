export const formatCurrency = (amount: number, compact = false): string => {
  if (compact) {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatRank = (rank: number): string => {
  if (rank <= 0) return '—';
  return `#${rank.toLocaleString()}`;
};

export const formatScore = (score: number): string => {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(2)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toFixed(2);
};

export const getRankSuffix = (rank: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = rank % 100;
  return rank + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const formatCountdown = (targetDate: string): {
  days: number; hours: number; minutes: number; seconds: number; total: number;
} => {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);

  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

export const getRankColor = (rank: number): string => {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  if (rank <= 10) return '#00D4FF';
  if (rank <= 100) return '#8B9FFF';
  return '#6B7280';
};

export const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', TR: '🇹🇷', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷',
  JP: '🇯🇵', BR: '🇧🇷', KR: '🇰🇷', CA: '🇨🇦', AU: '🇦🇺',
  RU: '🇷🇺', CN: '🇨🇳', IN: '🇮🇳', MX: '🇲🇽', IT: '🇮🇹',
  ES: '🇪🇸', NL: '🇳🇱', SE: '🇸🇪', NO: '🇳🇴', PL: '🇵🇱',
  AR: '🇦🇷', SA: '🇸🇦', AE: '🇦🇪', SG: '🇸🇬', TH: '🇹🇭',
};

export const getFlag = (country?: string): string => {
  if (!country) return '';
  return COUNTRY_FLAGS[country.toUpperCase()] || '';
};
