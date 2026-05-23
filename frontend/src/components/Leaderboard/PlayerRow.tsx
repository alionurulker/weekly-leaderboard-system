import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Avatar, Chip, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import type { LeaderboardEntry } from '../../../../shared/types/index';
import { formatCurrency, getFlag } from '../../utils/format';
import { getRankColor as getThemeRankColor } from '../../theme';

interface PlayerRowProps {
  entry: LeaderboardEntry;
  index: number;
  isSeparator?: boolean;
}

// ─── Rank Badge ──────────────────────────────────────────────────────────────
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const color = getThemeRankColor(rank);
  const isTop3 = rank <= 3;

  return (
    <Box
      sx={{
        minWidth: isTop3 ? 40 : 36,
        height: isTop3 ? 40 : 36,
        borderRadius: isTop3 ? '50%' : 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isTop3 ? alpha(color, 0.18) : 'transparent',
        border: isTop3 ? `2px solid ${alpha(color, 0.5)}` : `1px solid ${alpha(color, 0.2)}`,
        boxShadow: isTop3 ? `0 0 14px ${alpha(color, 0.35)}` : 'none',
        transition: 'all 0.3s',
        flexShrink: 0,
      }}
    >
      {/* Orbitron for rank number — geometric, crisp at small sizes */}
      <Typography
        sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: isTop3 ? 800 : 600,
          fontSize: isTop3 ? '1rem' : '0.8rem',
          color,
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        {rank}
      </Typography>
    </Box>
  );
};

// ─── Change Indicator ─────────────────────────────────────────────────────────
const ChangeIndicator: React.FC<{ change?: number }> = ({ change }) => {
  if (change === undefined || change === 0) {
    return <RemoveIcon sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.84)' }} />;
  }
  if (change > 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#00E396' }}>
        <ArrowUpwardIcon sx={{ fontSize: 11 }} />
        {/* Share Tech Mono for change numbers — monospace keeps columns aligned */}
        <Typography sx={{ fontSize: '0.6rem', fontFamily: '"Share Tech Mono", monospace', fontWeight: 400 }}>
          {change}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#FF4D6A' }}>
      <ArrowDownwardIcon sx={{ fontSize: 11 }} />
      <Typography sx={{ fontSize: '0.6rem', fontFamily: '"Share Tech Mono", monospace', fontWeight: 400 }}>
        {Math.abs(change)}
      </Typography>
    </Box>
  );
};

// ─── PlayerRow ───────────────────────────────────────────────────────────────
const PlayerRow: React.FC<PlayerRowProps> = ({ entry, index, isSeparator }) => {
  const rankColor = getThemeRankColor(entry.rank);
  const hasAnimated = useRef(false);
  const animationStyle = !hasAnimated.current
    ? { animation: `slideInUp 0.35s ease ${Math.min(index, 15) * 0.02}s both` }
    : {};
  if (!hasAnimated.current) hasAnimated.current = true;

  const flashKey = useRef(0);
  const prevScore = useRef(entry.score);
  if (prevScore.current !== entry.score && prevScore.current !== 0) {
    flashKey.current += 1;
  }
  prevScore.current = entry.score;

  // Separator row
  if (isSeparator) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 2 }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        ))}
        <Typography
          sx={{
            fontFamily: '"Oxanium", sans-serif',
            fontWeight: 500,
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
          }}
        >
          More Players
        </Typography>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        ))}
      </Box>
    );
  }

  const isTop3 = entry.rank <= 3;
  const isCurrentPlayer = entry.isCurrentPlayer;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        px: { xs: 1.5, sm: 2.5 },
        py: { xs: 0.9, sm: 1.1 },
        borderRadius: 1.5,
        border: '1px solid transparent',
        ...animationStyle,
        transition: 'background 0.2s, border-color 0.2s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',

        ...(isCurrentPlayer && {
          background: 'rgba(0,212,255,0.06)',
          borderColor: 'rgba(0,212,255,0.25)',
          boxShadow: '0 0 20px rgba(0,212,255,0.07)',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: 'linear-gradient(180deg, #00D4FF, #0099BB)',
            borderRadius: '2px 0 0 2px',
          },
        }),
        ...(!isCurrentPlayer && {
          '&:hover': {
            background: 'rgba(255,255,255,0.025)',
            borderColor: alpha(rankColor, 0.14),
          },
        }),
        ...(isTop3 && !isCurrentPlayer && {
          background: alpha(rankColor, 0.04),
          borderColor: alpha(rankColor, 0.1),
        }),
      }}
    >
      {/* Rank badge */}
      <RankBadge rank={entry.rank} />

      {/* Change indicator */}
      <Box sx={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <ChangeIndicator change={entry.change} />
      </Box>

      {/* Avatar */}
      <Avatar
        src={entry.avatarUrl}
        sx={{
          width: 34,
          height: 34,
          /* First letter of username — Orbitron gives it a badge feel */
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 700,
          fontSize: '0.8rem',
          background: `linear-gradient(135deg, ${alpha(rankColor, 0.4)}, ${alpha(rankColor, 0.15)})`,
          border: isCurrentPlayer
            ? '2px solid rgba(0,212,255,0.5)'
            : isTop3
              ? `1px solid ${alpha(rankColor, 0.4)}`
              : '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        {entry.username[0].toUpperCase()}
      </Avatar>

      {/* Username + country */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {/* Username — Rajdhani semi-bold: readable at small sizes in dense rows */}
          <Typography
            sx={{
              fontFamily: '"Rajdhani", sans-serif',
              fontWeight: 600,
              fontSize: { xs: '0.92rem', sm: '1rem' },
              color: isCurrentPlayer ? '#00D4FF' : '#F0F2F8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              lineHeight: 1.2,
            }}
          >
            {entry.username}
          </Typography>

          {entry.country && (
            <Typography sx={{ fontSize: '0.82rem', flexShrink: 0, lineHeight: 1 }}>
              {getFlag(entry.country)}
            </Typography>
          )}

          {isCurrentPlayer && (
            <Chip
              label="YOU"
              size="small"
              sx={{
                height: 17,
                /* Oxanium for chip labels — wide tracking, compact */
                fontFamily: '"Oxanium", sans-serif',
                fontWeight: 700,
                fontSize: '0.5rem',
                letterSpacing: '0.1em',
                background: 'rgba(0,212,255,0.15)',
                color: '#00D4FF',
                border: '1px solid rgba(0,212,255,0.3)',
                '& .MuiChip-label': { px: 0.75 },
                flexShrink: 0,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Score — Share Tech Mono: monospace keeps digits from jumping width */}
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: { xs: '0.82rem', sm: '0.9rem' },
            color: 'rgba(255,255,255,0.65)',
            animation: flashKey.current > 0 ? 'scoreFlash 0.8s ease' : 'none',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
          }}
        >
          {formatCurrency(entry.score, true)}
        </Typography>
      </Box>

      {/* Prize estimate */}
      <Box
        sx={{
          textAlign: 'right',
          flexShrink: 0,
          minWidth: { xs: 64, sm: 80 },
          display: {
            xs: entry.rank <= 10 || isCurrentPlayer ? 'block' : 'none',
            sm: 'block',
          },
        }}
      >
        {entry.prizeEstimate > 0 && (
          <Tooltip title="Estimated prize if week ended now" placement="left" arrow>
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {/* "EST. PRIZE" micro label — Oxanium */}
              <Typography
                sx={{
                  fontFamily: '"Oxanium", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.48rem',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.48)',
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                }}
              >
                Est. Prize
              </Typography>
              {/* Prize value — Orbitron, rank-coloured */}
              <Typography
                sx={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: '0.78rem', sm: '0.88rem' },
                  color: alpha(rankColor, 0.9),
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {formatCurrency(entry.prizeEstimate, true)}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(PlayerRow, (prev, next) =>
  prev.entry.score === next.entry.score &&
  prev.entry.rank === next.entry.rank &&
  prev.entry.change === next.entry.change &&
  prev.entry.isCurrentPlayer === next.entry.isCurrentPlayer
);