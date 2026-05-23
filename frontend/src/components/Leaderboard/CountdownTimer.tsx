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
          ? 'rgba(255,77,106,0.12)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${urgent ? 'rgba(255,77,106,0.35)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 1.5,
        px: { xs: 1, sm: 1.5 },
        py: 0.75,
        mb: 0.5,
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        /* subtle inner top line */
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: urgent
            ? 'rgba(255,77,106,0.5)'
            : 'rgba(255,215,0,0.15)',
        },
      }}
    >
      {/* Number — Orbitron: geometric, unmistakably a game timer */}
      <Typography
        sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 700,
          fontSize: { xs: '1.3rem', sm: '1.65rem' },
          lineHeight: 1,
          color: urgent ? '#FF4D6A' : '#F0F2F8',
          minWidth: 32,
          display: 'inline-block',
          textShadow: urgent ? '0 0 12px rgba(255,77,106,0.6)' : '0 0 8px rgba(255,215,0,0.15)',
          animation: 'numberTick 0.1s ease',
        }}
      >
        {String(value).padStart(2, '0')}
      </Typography>
    </Box>

    {/* Unit label — Oxanium, wide tracking */}
    <Typography
      sx={{
        fontFamily: '"Oxanium", sans-serif',
        fontWeight: 600,
        fontSize: '0.52rem',
        letterSpacing: '0.16em',
        color: urgent ? 'rgba(255,77,106,0.6)' : 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
      }}
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
        {/* Section label — Oxanium */}
        <Typography
          sx={{
            fontFamily: '"Oxanium", sans-serif',
            fontWeight: 600,
            fontSize: '0.6rem',
            letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
          }}
        >
          ⏳ Resets In
        </Typography>

        {urgent && (
          <Typography
            sx={{
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 700,
              fontSize: '0.55rem',
              letterSpacing: '0.12em',
              color: '#FF4D6A',
              textTransform: 'uppercase',
              animation: 'rankPulse 1s infinite',
              textShadow: '0 0 8px rgba(255,77,106,0.7)',
            }}
          >
            Final Hours
          </Typography>
        )}
      </Box>

      {/* Timer units */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 0.5, sm: 1 }, mb: 1.5 }}>
        <TimeUnit value={timeLeft.days}    label="Days" urgent={urgent} />
        <Typography sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 700,
          color: urgent ? 'rgba(255,77,106,0.5)' : 'rgba(255,255,255,0.2)',
          fontSize: '1.4rem',
          mt: 0.2,
          lineHeight: 1,
        }}>:</Typography>
        <TimeUnit value={timeLeft.hours}   label="Hrs"  urgent={urgent} />
        <Typography sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 700,
          color: urgent ? 'rgba(255,77,106,0.5)' : 'rgba(255,255,255,0.2)',
          fontSize: '1.4rem',
          mt: 0.2,
          lineHeight: 1,
        }}>:</Typography>
        <TimeUnit value={timeLeft.minutes} label="Min"  urgent={urgent} />
        <Typography sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 700,
          color: urgent ? 'rgba(255,77,106,0.5)' : 'rgba(255,255,255,0.2)',
          fontSize: '1.4rem',
          mt: 0.2,
          lineHeight: 1,
        }}>:</Typography>
        <TimeUnit value={timeLeft.seconds} label="Sec"  urgent={urgent} />
      </Box>

      {/* Progress bar */}
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