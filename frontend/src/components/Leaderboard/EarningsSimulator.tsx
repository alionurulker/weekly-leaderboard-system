import React, { useState } from 'react';
import {
  Box, Typography, Slider, Button, Chip, CircularProgress,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useAppDispatch, useAppSelector } from '../../store';
import { addEarnings } from '../../store/playerSlice';
import { fetchLeaderboard } from '../../store/leaderboardSlice';
import { formatCurrency } from '../../utils/format';

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
      // Error handling
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
      <Typography
        variant="subtitle1"
        sx={{ color: 'rgba(255,255,255,0.4)', mb: 1.5, fontSize: '0.65rem' }}
      >
        🎮 SIMULATE EARNINGS — {username}
      </Typography>

      {/* Quick amounts */}
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
              fontFamily: '"Barlow Condensed"',
              fontWeight: 600,
              fontSize: '0.7rem',
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.2)',
              color: '#FFD700',
              '&:hover': { background: 'rgba(255,215,0,0.15)' },
              '&.Mui-disabled': { opacity: 0.4 },
            }}
          />
        ))}
      </Box>

      {/* Custom slider */}
      <Box sx={{ px: 0.5, mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
            Custom: {formatCurrency(amount)}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,215,0,0.6)' }}>
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

      <Button
        fullWidth
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddCircleIcon />}
        disabled={loading}
        onClick={() => handleAdd(amount)}
        sx={{
          background: 'linear-gradient(135deg, #FFD700, #FFB300)',
          color: '#000',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '0.9rem',
          letterSpacing: '0.06em',
          py: 1,
          '&:hover': {
            background: 'linear-gradient(135deg, #FFE55C, #FFD700)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
          },
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'SUBMITTING...' : `ADD ${formatCurrency(amount, true)} EARNINGS`}
      </Button>

      {lastAdded !== null && (
        <Box
          sx={{
            mt: 1, p: 1, borderRadius: 1,
            background: 'rgba(0,227,150,0.1)',
            border: '1px solid rgba(0,227,150,0.2)',
            textAlign: 'center',
            animation: 'slideInUp 0.3s ease',
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: '#00E396', fontFamily: '"Barlow Condensed"', fontWeight: 700 }}>
            ✓ +{formatCurrency(lastAdded)} added! Pool grew by {formatCurrency(lastAdded * 0.02, true)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EarningsSimulator;
