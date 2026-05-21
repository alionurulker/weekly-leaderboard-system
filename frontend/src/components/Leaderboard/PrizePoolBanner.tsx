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
            <Typography
              variant="subtitle1"
              sx={{ color: 'rgba(255,215,0,0.6)', mb: 0.5, fontSize: '0.65rem' }}
            >
              💰 WEEKLY PRIZE POOL
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: '#FFD700',
                lineHeight: 1,
                textShadow: '0 0 30px rgba(255,215,0,0.5)',
                fontFamily: '"Bebas Neue", sans-serif',
              }}
            >
              <AnimatedNumber value={prizePool} />
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography
              variant="subtitle1"
              sx={{ color: 'rgba(255,255,255,0.4)', mb: 0.5, fontSize: '0.65rem' }}
            >
              COMPETING PLAYERS
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: '#F0F2F8',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              {totalPlayers.toLocaleString()}
            </Typography>

            <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
              {[
                { label: '1st', value: '20%', color: '#FFD700' },
                { label: '2nd', value: '15%', color: '#C0C0C0' },
                { label: '3rd', value: '10%', color: '#CD7F32' },
                { label: '4–100', value: '55%', color: '#8B9FFF' },
              ].map(({ label, value, color }) => (
                <Box
                  key={label}
                  sx={{
                    px: 1, py: 0.25,
                    borderRadius: 1,
                    background: alpha(color, 0.1),
                    border: `1px solid ${alpha(color, 0.25)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontFamily: '"Barlow Condensed"' }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color, fontWeight: 700, fontFamily: '"Barlow Condensed"' }}>
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
