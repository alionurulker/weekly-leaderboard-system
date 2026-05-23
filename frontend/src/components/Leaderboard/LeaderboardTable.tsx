import React, { useRef, useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import type { LeaderboardEntry } from '../../../../shared/types/index';
import type { LeaderboardResponse } from '../../../../shared/types/index';
import PlayerRow from './PlayerRow';

interface LeaderboardTableProps {
  top100: LeaderboardEntry[];
  currentPlayer: LeaderboardResponse['currentPlayer'];
  loading: boolean;
}

// ─── Section divider ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string; color?: string }> = ({
  label,
  color = 'rgba(255,255,255,0.25)',
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2.5,
      py: 0.75,
    }}
  >
    <Box sx={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${alpha(color, 0.3)})` }} />
    {/* Oxanium — wide tracking, feels like a game HUD section tag */}
    <Typography
      sx={{
        fontFamily: '"Oxanium", sans-serif',
        fontWeight: 700,
        fontSize: '0.55rem',
        letterSpacing: '0.2em',
        color,
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${alpha(color, 0.3)}, transparent)` }} />
  </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────
const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  top100,
  currentPlayer,
  loading,
}) => {
  const playerRowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollToMe, setShowScrollToMe] = useState(false);

  const isOutsideTop100 = currentPlayer && !currentPlayer.isInTop100;

  const scrollToPlayer = () => {
    playerRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    if (!currentPlayer || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setShowScrollToMe(!entry.isIntersecting); },
      { root: containerRef.current, threshold: 0.5 }
    );
    if (playerRowRef.current) observer.observe(playerRowRef.current);
    return () => observer.disconnect();
  }, [currentPlayer, top100]);

  if (loading && top100.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#FFD700' }} size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* ── Column header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          mb: 0.5,
        }}
      >
        {/* All column labels use Oxanium — compact, technical, wide-tracked */}
        {[
          { label: 'Rank', sx: { minWidth: 36 } },
          { label: '±',    sx: { width: 28 } },
          { label: '',     sx: { width: 34, flexShrink: 0 } }, // avatar spacer
          { label: 'Player', sx: { flex: 1 } },
          { label: 'Score', sx: {} },
        ].map(({ label, sx }) => (
          <Typography
            key={label}
            sx={{
              fontFamily: '"Oxanium", sans-serif',
              fontWeight: 600,
              fontSize: '0.55rem',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.28)',
              textTransform: 'uppercase',
              ...sx,
            }}
          >
            {label}
          </Typography>
        ))}

        {/* Prize column — hidden on xs */}
        <Typography
          sx={{
            fontFamily: '"Oxanium", sans-serif',
            fontWeight: 600,
            fontSize: '0.55rem',
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
            minWidth: { xs: 0, sm: 80 },
            textAlign: 'right',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          Est. Prize
        </Typography>
      </Box>

      {/* ── Scrollable rows ── */}
      <Box
        ref={containerRef}
        sx={{
          maxHeight: { xs: 'calc(100vh - 420px)', sm: 'calc(100vh - 480px)' },
          minHeight: 300,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 0.5,
        }}
      >
        {top100.length > 0 && <SectionHeader label="Podium" color="#FFD700" />}

        {top100.slice(0, 3).map((entry, i) => (
          <Box key={entry.playerId} ref={entry.isCurrentPlayer ? playerRowRef : undefined}>
            <PlayerRow entry={entry} index={i} />
          </Box>
        ))}

        {top100.length > 3 && <SectionHeader label="Top 10" color="#00D4FF" />}
        {top100.slice(3, 10).map((entry, i) => (
          <Box key={entry.playerId} ref={entry.isCurrentPlayer ? playerRowRef : undefined}>
            <PlayerRow entry={entry} index={i + 3} />
          </Box>
        ))}

        {top100.length > 10 && <SectionHeader label="Top 100" color="#8B9FFF" />}
        {top100.slice(10).map((entry, i) => (
          <Box key={entry.playerId} ref={entry.isCurrentPlayer ? playerRowRef : undefined}>
            <PlayerRow entry={entry} index={i + 10} />
          </Box>
        ))}

        {isOutsideTop100 && currentPlayer.surrounding.length > 0 && (
          <>
            <Box ref={playerRowRef}>
              <SectionHeader label="Your Position" color="#00D4FF" />
            </Box>
            {currentPlayer.surrounding.map((entry, i) => (
              <PlayerRow key={`ctx-${entry.playerId}`} entry={entry} index={i} />
            ))}
          </>
        )}

        {top100.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '2rem', mb: 1 }}>🏆</Typography>
            <Typography
              sx={{
                fontFamily: '"Rajdhani", sans-serif',
                fontWeight: 500,
                fontSize: '1rem',
                letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              No players yet. Be the first!
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Scroll-to-me FAB ── */}
      {showScrollToMe && currentPlayer && (
        <Tooltip title={`Jump to your rank #${currentPlayer.entry.rank}`} placement="left">
          <Box sx={{ position: 'absolute', bottom: 16, right: 8, zIndex: 10 }}>
            <IconButton
              onClick={scrollToPlayer}
              sx={{
                background: 'rgba(0,212,255,0.12)',
                border: '1px solid rgba(0,212,255,0.3)',
                color: '#00D4FF',
                backdropFilter: 'blur(8px)',
                '&:hover': { background: 'rgba(0,212,255,0.22)', transform: 'scale(1.06)' },
                transition: 'all 0.2s',
              }}
              size="small"
            >
              <MyLocationIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default LeaderboardTable;