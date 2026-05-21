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
        background: isTop3 ? alpha(color, 0.2) : 'transparent',
        border: isTop3 ? `2px solid ${alpha(color, 0.5)}` : `1px solid ${alpha(color, 0.2)}`,
        boxShadow: isTop3 ? `0 0 12px ${alpha(color, 0.3)}` : 'none',
        transition: 'all 0.3s',
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: isTop3 ? '1.1rem' : '0.95rem',
          color,
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}
      >
        {rank}
      </Typography>
    </Box>
  );
};

const ChangeIndicator: React.FC<{ change?: number }> = ({ change }) => {
  if (change === undefined || change === 0) {
    return <RemoveIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />;
  }
  if (change > 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#00E396' }}>
        <ArrowUpwardIcon sx={{ fontSize: 12 }} />
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>{change}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#FF4D6A' }}>
      <ArrowDownwardIcon sx={{ fontSize: 12 }} />
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>{Math.abs(change)}</Typography>
    </Box>
  );
};

const PlayerRow: React.FC<PlayerRowProps> = ({ entry, index, isSeparator }) => {
  const rankColor = getThemeRankColor(entry.rank);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef(entry.score);

  useEffect(() => {
    if (prevScore.current !== entry.score && prevScore.current !== 0) {
      setScoreFlash(true);
      setTimeout(() => setScoreFlash(false), 800);
    }
    prevScore.current = entry.score;
  }, [entry.score]);

  if (isSeparator) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          MORE PLAYERS
        </Typography>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
            }}
          />
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
        py: { xs: 1, sm: 1.25 },
        borderRadius: 1.5,
        border: '1px solid transparent',
        animation: `slideInUp 0.35s ease ${Math.min(index, 15) * 0.02}s both`,
        transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',

        ...(isCurrentPlayer && {
          background: 'rgba(0,212,255,0.06)',
          borderColor: 'rgba(0,212,255,0.25)',
          boxShadow: '0 0 20px rgba(0,212,255,0.08)',
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
            background: 'rgba(255,255,255,0.03)',
            borderColor: `${alpha(rankColor, 0.15)}`,
          },
        }),
        ...(isTop3 && !isCurrentPlayer && {
          background: alpha(rankColor, 0.04),
          borderColor: alpha(rankColor, 0.1),
        }),
      }}
    >
      {/* Rank */}
      <RankBadge rank={entry.rank} />

      {/* Change indicator */}
      <Box sx={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <ChangeIndicator change={entry.change} />
      </Box>

      {/* Avatar */}
      <Avatar
        src={entry.avatarUrl}
        sx={{
          width: 36,
          height: 36,
          fontSize: '0.9rem',
          background: `linear-gradient(135deg, ${alpha(rankColor, 0.4)}, ${alpha(rankColor, 0.15)})`,
          border: isCurrentPlayer
            ? '2px solid rgba(0,212,255,0.5)'
            : isTop3
              ? `1px solid ${alpha(rankColor, 0.4)}`
              : '1px solid rgba(255,255,255,0.1)',
          fontFamily: '"Bebas Neue"',
          flexShrink: 0,
        }}
      >
        {entry.username[0].toUpperCase()}
      </Avatar>

      {/* Username + country */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography
            sx={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              color: isCurrentPlayer ? '#00D4FF' : '#F0F2F8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
            }}
          >
            {entry.username}
          </Typography>
          {entry.country && (
            <Typography sx={{ fontSize: '0.85rem', flexShrink: 0 }}>
              {getFlag(entry.country)}
            </Typography>
          )}
          {isCurrentPlayer && (
            <Chip
              label="YOU"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.55rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
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

      {/* Score */}
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            color: scoreFlash ? '#00E396' : 'rgba(255,255,255,0.7)',
            transition: 'color 0.3s',
            letterSpacing: '0.01em',
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
          display: { xs: entry.rank <= 10 || isCurrentPlayer ? 'block' : 'none', sm: 'block' },
        }}
      >
        {entry.prizeEstimate > 0 ? (
          <Tooltip title="Estimated prize if week ended now" placement="left" arrow>
            <Box
              sx={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.06em',
                  fontFamily: '"Barlow Condensed"',
                }}
              >
                EST. PRIZE
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  color: alpha(rankColor, 0.9),
                  lineHeight: 1,
                }}
              >
                {formatCurrency(entry.prizeEstimate, true)}
              </Typography>
            </Box>
          </Tooltip>
        ) : null}
      </Box>
    </Box>
  );
};

export default PlayerRow;
