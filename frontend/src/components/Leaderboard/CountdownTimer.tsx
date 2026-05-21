import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { formatCountdown } from '../../utils/format';

interface CountdownTimerProps {
  nextResetAt: string;
  weekStart: string;
}

const TimeUnit: React.FC<{ value: number; label: string; urgent: boolean }> = ({ value, label, urgent }) => (
  <Box sx={{ textAlign: 'center', minWidth: 44 }}>
    <Box
      sx={{
        background: urgent
          ? 'rgba(255,77,106,0.15)'
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${urgent ? 'rgba(255,77,106,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 1.5,
        px: { xs: 1, sm: 1.5 },
        py: 0.75,
        mb: 0.5,
        transition: 'all 0.3s',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: { xs: '1.4rem', sm: '1.75rem' },
          lineHeight: 1,
          color: urgent ? '#FF4D6A' : '#F0F2F8',
          minWidth: 32,
          display: 'inline-block',
        }}
      >
        {String(value).padStart(2, '0')}
      </Typography>
    </Box>
    <Typography
      variant="caption"
      sx={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', fontSize: '0.6rem' }}
    >
      {label}
    </Typography>
  </Box>
);

const CountdownTimer: React.FC<CountdownTimerProps> = ({ nextResetAt, weekStart }) => {
  const [timeLeft, setTimeLeft] = useState(formatCountdown(nextResetAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(formatCountdown(nextResetAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextResetAt]);

  const weekDuration = new Date(nextResetAt).getTime() - new Date(weekStart).getTime();
  const elapsed = weekDuration - timeLeft.total;
  const progress = Math.min(100, (elapsed / weekDuration) * 100);
  const urgent = timeLeft.days === 0 && timeLeft.hours < 6;

  return (
    <Box
      sx={{
        borderRadius: 2,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${urgent ? 'rgba(255,77,106,0.2)' : 'rgba(255,255,255,0.06)'}`,
        p: { xs: 1.5, sm: 2 },
        transition: 'border-color 0.5s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}
        >
          ⏳ RESETS IN
        </Typography>
        {urgent && (
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: '#FF4D6A',
              fontFamily: '"Barlow Condensed"',
              fontWeight: 700,
              animation: 'rankPulse 1s infinite',
              letterSpacing: '0.06em',
            }}
          >
            FINAL HOURS
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 0.5, sm: 1 }, mb: 1.5 }}>
        <TimeUnit value={timeLeft.days} label="DAYS" urgent={urgent} />
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.5rem', fontFamily: '"Bebas Neue"', mt: 0.25 }}>:</Typography>
        <TimeUnit value={timeLeft.hours} label="HRS" urgent={urgent} />
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.5rem', fontFamily: '"Bebas Neue"', mt: 0.25 }}>:</Typography>
        <TimeUnit value={timeLeft.minutes} label="MIN" urgent={urgent} />
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.5rem', fontFamily: '"Bebas Neue"', mt: 0.25 }}>:</Typography>
        <TimeUnit value={timeLeft.seconds} label="SEC" urgent={urgent} />
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.06)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            background: urgent
              ? 'linear-gradient(90deg, #FF4D6A, #FF8C94)'
              : 'linear-gradient(90deg, #FFD700, #FFB300)',
            transition: 'transform 1s linear',
          },
        }}
      />
    </Box>
  );
};

export default CountdownTimer;
