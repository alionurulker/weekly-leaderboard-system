import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Container, Typography, Paper, Grid, IconButton,
  Chip, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';

import { useAppDispatch, useAppSelector } from '../../store';
import { fetchLeaderboard } from '../../store/leaderboardSlice';
import { loginDemoPlayer, logout } from '../../store/playerSlice';
import { useWebSocket } from '../../hooks/useWebSocket';

import PrizePoolBanner from './PrizePoolBanner';
import CountdownTimer from './CountdownTimer';
import PodiumDisplay from './PodiumDisplay';
import LeaderboardTable from './LeaderboardTable';
import EarningsSimulator from './EarningsSimulator';
import { getRankSuffix } from '../../utils/format';
import { getRankColor as getThemeRankColor } from '../../theme';

const LeaderboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    top100,
    currentPlayer,
    prizePool,
    totalPlayers,
    weekStart,
    weekEnd: _weekEnd,
    nextResetAt,
    loading,
    error,
    lastUpdated,
    wsConnected,
  } = useAppSelector((s) => s.leaderboard);

  const {
    isAuthenticated,
    username,
    id: playerId,
  } = useAppSelector((s) => s.player);

  const [refreshing, setRefreshing] = useState(false);

  // Connect WebSocket
  useWebSocket();

  // Initial fetch
  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch, isAuthenticated]);

  // Auto-refresh every 30s as fallback if WS disconnects
  useEffect(() => {
    if (wsConnected) return;
    const interval = setInterval(() => {
      dispatch(fetchLeaderboard());
    }, 30_000);
    return () => clearInterval(interval);
  }, [dispatch, wsConnected]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchLeaderboard());
    setTimeout(() => setRefreshing(false), 600);
  }, [dispatch]);

  const handleDemoLogin = () => {
    dispatch(loginDemoPlayer());
  };

  const currentRank = currentPlayer?.entry.rank;
  const rankColor = currentRank ? getThemeRankColor(currentRank) : undefined;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: { xs: 2, sm: 3 },
        pb: { xs: 3, sm: 4 },
      }}
    >
      <Container maxWidth="lg">
        {/* ── Header ─────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: { xs: 2, sm: 3 },
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' },
                color: '#FFD700',
                filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))',
              }}
            />
            <Box>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.8rem' },
                  lineHeight: 0.95,
                  color: '#F0F2F8',
                  letterSpacing: '0.04em',
                }}
              >
                WEEKLY
                <Box component="span" sx={{ color: '#FFD700', ml: 1 }}>
                  LEADERBOARD
                </Box>
              </Typography>
              {weekStart && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}
                >
                  {new Date(weekStart).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })} — {nextResetAt ? new Date(nextResetAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  }) : ''}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Live indicator */}
            <Chip
              icon={
                wsConnected
                  ? <WifiIcon sx={{ fontSize: '0.75rem !important' }} />
                  : <WifiOffIcon sx={{ fontSize: '0.75rem !important' }} />
              }
              label={wsConnected ? 'LIVE' : 'POLLING'}
              size="small"
              sx={{
                height: 24,
                fontFamily: '"Barlow Condensed"',
                fontWeight: 700,
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                background: wsConnected ? 'rgba(0,227,150,0.1)' : 'rgba(255,179,0,0.1)',
                color: wsConnected ? '#00E396' : '#FFB300',
                border: `1px solid ${wsConnected ? 'rgba(0,227,150,0.25)' : 'rgba(255,179,0,0.25)'}`,
                '& .MuiChip-icon': { color: 'inherit' },
                '& .MuiChip-label': { px: 0.75 },
              }}
            />

            {/* Auth button */}
            {isAuthenticated ? (
              <Chip
                icon={<PersonIcon sx={{ fontSize: '0.75rem !important' }} />}
                label={username || 'Player'}
                size="small"
                onDelete={() => dispatch(logout())}
                sx={{
                  height: 24,
                  fontFamily: '"Barlow Condensed"',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  background: 'rgba(0,212,255,0.1)',
                  color: '#00D4FF',
                  border: '1px solid rgba(0,212,255,0.2)',
                  '& .MuiChip-icon': { color: 'inherit' },
                  '& .MuiChip-deleteIcon': { color: 'rgba(0,212,255,0.5)' },
                }}
              />
            ) : (
              <Chip
                label="DEMO MODE"
                size="small"
                onClick={handleDemoLogin}
                sx={{
                  height: 24,
                  cursor: 'pointer',
                  fontFamily: '"Barlow Condensed"',
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  background: 'rgba(255,215,0,0.08)',
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.2)',
                  '&:hover': { background: 'rgba(255,215,0,0.14)' },
                }}
              />
            )}

            {/* Refresh */}
            <Tooltip title="Refresh leaderboard">
              <IconButton
                size="small"
                onClick={handleRefresh}
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

        {/* ── My Rank Banner (when authenticated and ranked) ───── */}
        {isAuthenticated && currentPlayer && (
          <Box
            sx={{
              mb: 2,
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              background: alpha(rankColor || '#00D4FF', 0.06),
              border: `1px solid ${alpha(rankColor || '#00D4FF', 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              animation: 'slideInUp 0.4s ease',
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', mb: 0.25 }}
              >
                YOUR CURRENT RANK
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                  color: rankColor || '#00D4FF',
                  lineHeight: 1,
                  textShadow: `0 0 20px ${alpha(rankColor || '#00D4FF', 0.4)}`,
                }}
              >
                {currentRank ? getRankSuffix(currentRank) : '—'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontFamily: '"Barlow Condensed"' }}>
                Score: <Box component="span" sx={{ color: '#F0F2F8', fontWeight: 700 }}>
                  {currentPlayer.entry.score.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </Box>
              </Typography>
              {currentPlayer.entry.prizeEstimate > 0 && (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontFamily: '"Barlow Condensed"' }}>
                  Est. Prize: <Box component="span" sx={{ color: rankColor, fontWeight: 700 }}>
                    {currentPlayer.entry.prizeEstimate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </Box>
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', mb: 0.25 }}>
                {totalPlayers.toLocaleString()} total players
              </Typography>
              {currentPlayer.isInTop100 ? (
                <Chip
                  label="TOP 100 ✓"
                  size="small"
                  sx={{
                    fontFamily: '"Barlow Condensed"',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    background: alpha(rankColor || '#00D4FF', 0.15),
                    color: rankColor || '#00D4FF',
                    border: `1px solid ${alpha(rankColor || '#00D4FF', 0.3)}`,
                  }}
                />
              ) : (
                <Chip
                  label={`${(currentRank || 0) - 100} BELOW TOP 100`}
                  size="small"
                  sx={{
                    fontFamily: '"Barlow Condensed"',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    background: 'rgba(255,179,0,0.1)',
                    color: '#FFB300',
                    border: '1px solid rgba(255,179,0,0.2)',
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* ── Main Grid ──────────────────────────────────────────── */}
        <Grid container spacing={2}>
          {/* Left: Stats */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <PrizePoolBanner prizePool={prizePool} totalPlayers={totalPlayers} />
              {nextResetAt && weekStart && (
                <CountdownTimer nextResetAt={nextResetAt} weekStart={weekStart} />
              )}
              <EarningsSimulator />

              {/* Last updated */}
              {lastUpdated && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', letterSpacing: '0.06em' }}
                >
                  Updated {new Date(lastUpdated).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Right: Leaderboard */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                background: 'rgba(15,17,23,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Podium */}
              {top100.length >= 3 && (
                <Box
                  sx={{
                    pt: 3,
                    pb: 0,
                    background: 'linear-gradient(180deg, rgba(255,215,0,0.04) 0%, transparent 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <PodiumDisplay
                    top3={top100.slice(0, 3)}
                    currentPlayerId={playerId}
                  />
                </Box>
              )}

              {/* Table */}
              <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
                {error ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: '#FF4D6A', fontFamily: '"Barlow Condensed"' }}>
                      {error}
                    </Typography>
                  </Box>
                ) : (
                  <LeaderboardTable
                    top100={top100}
                    currentPlayer={currentPlayer}
                    loading={loading}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LeaderboardScreen;
