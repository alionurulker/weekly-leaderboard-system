import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, Grid, IconButton,
  Chip, Tooltip, Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchLeaderboard } from '../../store/leaderboardSlice';
import { logout } from '../../store/playerSlice';
import { useWebSocket } from '../../hooks/useWebSocket';

import PrizePoolBanner from './PrizePoolBanner';
import CountdownTimer from './CountdownTimer';
import PodiumDisplay from './PodiumDisplay';
import LeaderboardTable from './LeaderboardTable';
import EarningsSimulator from './EarningsSimulator';
import AuthModal from './AuthModal';
import { getRankSuffix } from '../../utils/format';
import { getRankColor as getThemeRankColor } from '../../theme';

// ── Font constants ────────────────────────────────────────────────────────────
const F_DISPLAY = '"Orbitron", sans-serif';
const F_LABEL = '"Oxanium", sans-serif';
const F_BODY = '"Rajdhani", sans-serif';
const F_MONO = '"Share Tech Mono", monospace';

type AuthModalMode = 'login' | 'register';

const LeaderboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    top100, currentPlayer, prizePool, totalPlayers,
    weekStart, weekEnd: _weekEnd, nextResetAt,
    loading, error, lastUpdated, wsConnected,
  } = useAppSelector((s) => s.leaderboard);

  const { isAuthenticated, username, id: playerId } = useAppSelector((s) => s.player);

  const [refreshing, setRefreshing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  useWebSocket();

  useEffect(() => { dispatch(fetchLeaderboard()); }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (wsConnected) return;
    const interval = setInterval(() => dispatch(fetchLeaderboard()), 30_000);
    return () => clearInterval(interval);
  }, [dispatch, wsConnected]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchLeaderboard());
    setTimeout(() => setRefreshing(false), 600);
  }, [dispatch]);

  const openAuth = (mode: AuthModalMode) => { setAuthModalMode(mode); setAuthModalOpen(true); };

  const currentRank = currentPlayer?.entry.rank;
  const rankColor = currentRank ? getThemeRankColor(currentRank) : undefined;

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 2, sm: 3 }, pb: { xs: 3, sm: 4 } }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 1,
          }}
        >
          {/* Left: logo + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: '#FFD700' }} />
            <Box>
              {/* Title — Orbitron */}
              <Typography
                variant="h2"
                sx={{
                  fontFamily: F_DISPLAY,
                  fontWeight: 800,
                  fontSize: { xs: '1.15rem', sm: '1.6rem', md: '2rem' },
                  lineHeight: 1,
                  color: '#F0F2F8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textShadow: '0 0 30px rgba(255,215,0,0.1)',
                }}
              >
                Weekly{' '}
                <Box component="span" sx={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>
                  Leaderboard
                </Box>
              </Typography>

              {/* Date range — Oxanium */}
              {weekStart && (
                <Typography
                  sx={{
                    fontFamily: F_LABEL,
                    fontWeight: 500,
                    fontSize: '0.58rem',
                    letterSpacing: '0.14em',
                    color: 'rgba(255, 255, 255, 0.84)',
                    textTransform: 'uppercase',
                    mt: 0.25,
                  }}
                >
                  {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' — '}
                  {nextResetAt
                    ? new Date(nextResetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : ''}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right: controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Live chip — Oxanium */}
            <Chip
              icon={wsConnected
                ? <WifiIcon sx={{ fontSize: '0.75rem !important' }} />
                : <WifiOffIcon sx={{ fontSize: '0.75rem !important' }} />}
              label={wsConnected ? 'Live' : 'Polling'}
              size="small"
              sx={{
                height: 24,
                fontFamily: F_LABEL,
                fontWeight: 700,
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                background: wsConnected ? 'rgba(0,227,150,0.1)' : 'rgba(255,179,0,0.1)',
                color: wsConnected ? '#00E396' : '#FFB300',
                border: `1px solid ${wsConnected ? 'rgba(0,227,150,0.25)' : 'rgba(255,179,0,0.25)'}`,
                '& .MuiChip-icon': { color: 'inherit' },
                '& .MuiChip-label': { px: 0.75 },
              }}
            />

            {/* Unauthenticated controls */}
            {!isAuthenticated && (
              <>
                {/* Sign In — cyan outline button, Orbitron */}
                <Button
                  size="small"
                  startIcon={<LoginIcon sx={{ fontSize: '0.8rem !important' }} />}
                  onClick={() => openAuth('login')}
                  sx={{
                    height: 28, px: 1.5,
                    fontFamily: F_LABEL,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#00D4FF',
                    background: 'rgba(0,212,255,0.08)',
                    border: '1px solid rgba(0,212,255,0.25)',
                    borderRadius: 1,
                    '&:hover': { background: 'rgba(0,212,255,0.16)', border: '1px solid rgba(0,212,255,0.5)' },
                  }}
                >
                  Sign In
                </Button>

                {/* Register — gold gradient button, Orbitron */}
                <Button
                  size="small"
                  startIcon={<PersonAddIcon sx={{ fontSize: '0.8rem !important' }} />}
                  onClick={() => openAuth('register')}
                  sx={{
                    height: 28, px: 1.5,
                    fontFamily: F_LABEL,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#000',
                    background: 'linear-gradient(135deg, #FFD700, #FFA000)',
                    borderRadius: 1,
                    boxShadow: '0 2px 10px rgba(255,215,0,0.2)',
                    '&:hover': { background: 'linear-gradient(135deg, #FFE033, #FFB300)', boxShadow: '0 2px 16px rgba(255,215,0,0.35)' },
                  }}
                >
                  Register
                </Button>
              </>
            )}

            {/* Authenticated — username chip */}
            {isAuthenticated && (
              <Chip
                icon={<PersonIcon sx={{ fontSize: '0.75rem !important' }} />}
                label={username || 'Player'}
                size="small"
                onDelete={() => dispatch(logout())}
                sx={{
                  height: 24,
                  fontFamily: F_LABEL,
                  fontWeight: 600,
                  fontSize: '0.62rem',
                  letterSpacing: '0.06em',
                  background: 'rgba(0,212,255,0.1)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0,212,255,0.2)',
                  '& .MuiChip-icon': { color: 'inherit' },
                  '& .MuiChip-deleteIcon': { color: 'rgba(0,212,255,0.5)' },
                }}
              />
            )}

            {/* Refresh */}
            <Tooltip title="Refresh leaderboard">
              <IconButton
                size="small" onClick={handleRefresh}
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  '&:hover': { color: '#FFD700', transform: 'rotate(180deg)' },
                  transition: 'all 0.5s',
                  ...(refreshing && { animation: 'rankPulse 0.6s ease' }),
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── My Rank Banner ── */}
        {isAuthenticated && currentPlayer && (
          <Box
            sx={{
              mb: 2, p: { xs: 1.5, sm: 2 }, borderRadius: 2,
              background: alpha(rankColor || '#00D4FF', 0.06),
              border: `1px solid ${alpha(rankColor || '#00D4FF', 0.2)}`,
              display: 'flex', alignItems: 'center', gap: 2,
              flexWrap: 'wrap', animation: 'slideInUp 0.4s ease',
            }}
          >
            <Box>
              {/* Label — Oxanium */}
              <Typography
                sx={{
                  fontFamily: F_LABEL, fontWeight: 600,
                  fontSize: '0.55rem', letterSpacing: '0.16em',
                  color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', mb: 0.25,
                }}
              >
                Your Current Rank
              </Typography>
              {/* Rank number — Orbitron hero */}
              <Typography
                sx={{
                  fontFamily: F_DISPLAY, fontWeight: 800,
                  fontSize: { xs: '1.8rem', sm: '2.2rem' },
                  color: rankColor || '#00D4FF', lineHeight: 1,
                  textShadow: `0 0 20px ${alpha(rankColor || '#00D4FF', 0.45)}`,
                  letterSpacing: '0.02em',
                }}
              >
                {currentRank ? getRankSuffix(currentRank) : '—'}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              {/* Score line — Rajdhani + Share Tech Mono for value */}
              <Typography sx={{ fontFamily: F_BODY, fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                Score:{' '}
                <Box component="span" sx={{ fontFamily: F_MONO, color: '#F0F2F8', fontSize: '0.85rem' }}>
                  {currentPlayer.entry.score.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </Box>
              </Typography>
              {currentPlayer.entry.prizeEstimate > 0 && (
                <Typography sx={{ fontFamily: F_BODY, fontWeight: 600, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                  Est. Prize:{' '}
                  <Box component="span" sx={{ fontFamily: F_MONO, color: rankColor, fontSize: '0.85rem', fontWeight: 700 }}>
                    {currentPlayer.entry.prizeEstimate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </Box>
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              {/* Total players — Oxanium */}
              <Typography sx={{ fontFamily: F_LABEL, fontWeight: 500, fontSize: '0.58rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.48)', mb: 0.25, textTransform: 'uppercase' }}>
                {totalPlayers.toLocaleString()} total players
              </Typography>

              {currentPlayer.isInTop100 ? (
                <Chip
                  label="Top 100 ✓"
                  size="small"
                  sx={{
                    fontFamily: F_LABEL, fontWeight: 700,
                    fontSize: '0.58rem', letterSpacing: '0.08em',
                    background: alpha(rankColor || '#00D4FF', 0.15),
                    color: rankColor || '#00D4FF',
                    border: `1px solid ${alpha(rankColor || '#00D4FF', 0.3)}`,
                  }}
                />
              ) : (
                <Chip
                  label={`${(currentRank || 0) - 100} below Top 100`}
                  size="small"
                  sx={{
                    fontFamily: F_LABEL, fontWeight: 700,
                    fontSize: '0.58rem', letterSpacing: '0.06em',
                    background: 'rgba(255,179,0,0.1)',
                    color: '#FFB300',
                    border: '1px solid rgba(255,179,0,0.2)',
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* ── Main Grid ── */}
        <Grid container spacing={2}>
          {/* Left column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <PrizePoolBanner prizePool={prizePool} totalPlayers={totalPlayers} />
              {nextResetAt && weekStart && (
                <CountdownTimer nextResetAt={nextResetAt} weekStart={weekStart} />
              )}
              <EarningsSimulator />

              {/* Last updated — Oxanium micro */}
              {lastUpdated && (
                <Typography
                  sx={{
                    fontFamily: F_LABEL, fontWeight: 500,
                    fontSize: '0.54rem', letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.65)', textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2, overflow: 'hidden',
                background: 'rgba(15,17,23,0.98)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {top100.length >= 3 && (
                <Box
                  sx={{
                    pt: 3, pb: 0,
                    background: 'linear-gradient(180deg, rgba(255,215,0,0.04) 0%, transparent 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <PodiumDisplay top3={top100.slice(0, 3)} currentPlayerId={playerId} />
                </Box>
              )}

              <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
                {error ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    {/* Error text — Rajdhani */}
                    <Typography sx={{ fontFamily: F_BODY, fontWeight: 600, fontSize: '1rem', color: '#FF4D6A', letterSpacing: '0.03em' }}>
                      {error}
                    </Typography>
                  </Box>
                ) : (
                  <LeaderboardTable top100={top100} currentPlayer={currentPlayer} loading={loading} />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <AuthModal open={authModalOpen} initialMode={authModalMode} onClose={() => setAuthModalOpen(false)} />
    </Box>
  );
};

export default LeaderboardScreen;