import React, { useState } from 'react';
import {
  Box, Typography, Slider, Button, Chip, CircularProgress,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useAppDispatch, useAppSelector } from '../../store';
import { addEarnings } from '../../store/playerSlice';
import { fetchLeaderboard } from '../../store/leaderboardSlice';
import { formatCurrency } from '../../utils/format';

// ── Font constants ────────────────────────────────────────────────────────────
const F_DISPLAY = '"Orbitron", sans-serif';
const F_LABEL   = '"Oxanium", sans-serif';
const F_BODY    = '"Rajdhani", sans-serif';
const F_MONO    = '"Share Tech Mono", monospace';

const QUICK_AMOUNTS = [100, 500, 1_000, 5_000, 10_000, 50_000];

const EarningsSimulator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, username } = useAppSelector((s) => s.player);
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  if (!isAuthenticated) return null;

  const handleAdd = async (earnings: number) => {
    setLoading(true);
    try {
      await dispatch(addEarnings(earnings)).unwrap();
      setLastAdded(earnings);
      setTimeout(() => {
        dispatch(fetchLeaderboard());
        setLastAdded(null);
      }, 600);
    } catch {
      // handled by Redux error state
    } finally {
      setLoading(false);
    }
  };

  const contribution = amount * 0.02;

  return (
    <Box
      sx={{
        borderRadius: 2,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        p: { xs: 1.5, sm: 2 },
      }}
    >
      {/* Section label — Oxanium */}
      <Typography
        sx={{
          fontFamily: F_LABEL,
          fontWeight: 600,
          fontSize: '0.58rem',
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          mb: 1.5,
        }}
      >
        🎮 Simulate Earnings — {username}
      </Typography>

      {/* Quick-amount chips — Oxanium bold */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
        {QUICK_AMOUNTS.map((v) => (
          <Chip
            key={v}
            label={formatCurrency(v, true)}
            size="small"
            onClick={() => handleAdd(v)}
            disabled={loading}
            sx={{
              cursor: 'pointer',
              fontFamily: F_MONO,   // monospace so chip widths stay stable
              fontSize: '0.68rem',
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.2)',
              color: '#FFD700',
              '&:hover': { background: 'rgba(255,215,0,0.15)' },
              '&.Mui-disabled': { opacity: 0.4 },
            }}
          />
        ))}
      </Box>

      {/* Slider section */}
      <Box sx={{ px: 0.5, mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'baseline' }}>
          {/* Custom amount label — Rajdhani */}
          <Typography
            sx={{
              fontFamily: F_BODY,
              fontWeight: 600,
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.02em',
            }}
          >
            Custom:{' '}
            {/* Value inline — Share Tech Mono */}
            <Box component="span" sx={{ fontFamily: F_MONO, color: '#F0F2F8', fontSize: '0.8rem' }}>
              {formatCurrency(amount)}
            </Box>
          </Typography>

          {/* Pool contribution — Oxanium */}
          <Typography
            sx={{
              fontFamily: F_LABEL,
              fontWeight: 600,
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              color: 'rgba(255,215,0,0.55)',
            }}
          >
            +{formatCurrency(contribution, true)} to pool
          </Typography>
        </Box>

        <Slider
          value={amount}
          min={100}
          max={100_000}
          step={100}
          onChange={(_, v) => setAmount(v as number)}
          sx={{
            color: '#FFD700',
            '& .MuiSlider-thumb': {
              width: 14, height: 14,
              '&:hover': { boxShadow: '0 0 0 6px rgba(255,215,0,0.15)' },
            },
            '& .MuiSlider-track': { border: 'none' },
            '& .MuiSlider-rail': { opacity: 0.2 },
          }}
        />
      </Box>

      {/* Submit button — Orbitron */}
      <Button
        fullWidth
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddCircleIcon />}
        disabled={loading}
        onClick={() => handleAdd(amount)}
        sx={{
          background: 'linear-gradient(135deg, #FFD700, #FFB300)',
          color: '#000',
          fontFamily: F_DISPLAY,
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          py: 1.1,
          boxShadow: '0 4px 16px rgba(255,215,0,0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFE55C, #FFD700)',
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px rgba(255,215,0,0.35)',
          },
          '&:disabled': { background: 'rgba(255,215,0,0.3)', color: 'rgba(0,0,0,0.5)' },
          transition: 'all 0.2s',
        }}
      >
        {loading
          ? 'Submitting…'
          : `Add ${formatCurrency(amount, true)} Earnings`}
      </Button>

      {/* Success flash — Rajdhani */}
      {lastAdded !== null && (
        <Box
          sx={{
            mt: 1, p: 1, borderRadius: 1,
            background: 'rgba(0,227,150,0.08)',
            border: '1px solid rgba(0,227,150,0.2)',
            textAlign: 'center',
            animation: 'slideInUp 0.3s ease',
          }}
        >
          <Typography
            sx={{
              fontFamily: F_BODY,
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.03em',
              color: '#00E396',
            }}
          >
            ✓ +{formatCurrency(lastAdded)} added!{' '}
            <Box component="span" sx={{ fontFamily: F_MONO, fontSize: '0.78rem' }}>
              Pool +{formatCurrency(lastAdded * 0.02, true)}
            </Box>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EarningsSimulator;