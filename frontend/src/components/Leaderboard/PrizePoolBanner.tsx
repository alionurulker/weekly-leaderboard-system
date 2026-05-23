import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatCurrency } from '../../utils/format';

interface PrizePoolBannerProps {
  prizePool: number;
  totalPlayers: number;
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const frame = useRef<number>();

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(animate);
      else prev.current = end;
    };

    frame.current = requestAnimationFrame(animate);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [value]);

  return <>{formatCurrency(display)}</>;
};

const PrizePoolBanner: React.FC<PrizePoolBannerProps> = ({ prizePool, totalPlayers }) => {
  return (
    <Tooltip
      title="2% of all player earnings collected this week. Auto-distributed to top 100 players on Monday."
      arrow
      placement="bottom"
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          background: `linear-gradient(135deg,
            rgba(255,215,0,0.12) 0%,
            rgba(255,183,0,0.06) 50%,
            rgba(255,150,0,0.12) 100%)`,
          border: '1px solid rgba(255,215,0,0.25)',
          p: { xs: 2, sm: 3 },
          cursor: 'default',
          transition: 'border-color 0.3s',
          '&:hover': { borderColor: 'rgba(255,215,0,0.45)' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: '-100%',
            width: '60%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.05), transparent)',
            animation: 'shimmer 3s infinite linear',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            {/* Label — Oxanium, tight tracking */}
            <Typography
              sx={{
                fontFamily: '"Oxanium", sans-serif',
                fontWeight: 600,
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                color: 'rgba(255,215,0,0.55)',
                mb: 0.5,
                textTransform: 'uppercase',
              }}
            >
              💰 Weekly Prize Pool
            </Typography>

            {/* Prize number — Orbitron, hero size */}
            <Typography
              sx={{
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 800,
                fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' },
                color: '#FFD700',
                lineHeight: 1,
                textShadow: '0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.2)',
                letterSpacing: '0.02em',
              }}
            >
              <AnimatedNumber value={prizePool} />
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            {/* Label */}
            <Typography
              sx={{
                fontFamily: '"Oxanium", sans-serif',
                fontWeight: 600,
                fontSize: '0.6rem',
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                mb: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Competing Players
            </Typography>

            {/* Player count — Orbitron */}
            <Typography
              sx={{
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 700,
                fontSize: { xs: '1.4rem', sm: '1.8rem' },
                color: '#F0F2F8',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {totalPlayers.toLocaleString()}
            </Typography>

            {/* Prize tier chips */}
            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
              {[
                { label: '1st', value: '20%', color: '#FFD700' },
                { label: '2nd', value: '15%', color: '#C0C0C0' },
                { label: '3rd', value: '10%', color: '#CD7F32' },
                { label: '4–100', value: '55%', color: '#8B9FFF' },
              ].map(({ label, value, color }) => (
                <Box
                  key={label}
                  sx={{
                    px: 1, py: 0.3,
                    borderRadius: 1,
                    background: alpha(color, 0.1),
                    border: `1px solid ${alpha(color, 0.25)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {/* Tier label — Rajdhani */}
                  <Typography
                    sx={{
                      fontFamily: '"Rajdhani", sans-serif',
                      fontWeight: 600,
                      fontSize: '0.6rem',
                      color: 'rgba(255,255,255,0.45)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {label}
                  </Typography>
                  {/* Tier value — Oxanium bold */}
                  <Typography
                    sx={{
                      fontFamily: '"Oxanium", sans-serif',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      color,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default PrizePoolBanner;