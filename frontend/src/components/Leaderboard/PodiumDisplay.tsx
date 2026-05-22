import React from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { LeaderboardEntry } from '../../../../shared/types/index';
import { formatCurrency, getFlag } from '../../utils/format';

interface PodiumDisplayProps {
  top3: LeaderboardEntry[];
  currentPlayerId?: string | null;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = [140, 100, 80]; // CSS heights for podium blocks
const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const GLOWS = [
  '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2)',
  '0 0 20px rgba(192,192,192,0.3), 0 0 40px rgba(192,192,192,0.15)',
  '0 0 20px rgba(205,127,50,0.3), 0 0 40px rgba(205,127,50,0.15)',
];
const ORDER = [1, 0, 2]; // 2nd, 1st, 3rd visual order

const PodiumCard: React.FC<{
  entry: LeaderboardEntry;
  visualPos: number; // 0=left(2nd), 1=center(1st), 2=right(3rd)
  isCurrentPlayer: boolean;
}> = ({ entry, visualPos, isCurrentPlayer }) => {
  const rankIdx = entry.rank - 1;
  const color = COLORS[rankIdx];
  const isFirst = entry.rank === 1;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Responsive: fluid on mobile, fixed on larger screens
        flex: {
          xs: isFirst ? '0 0 36%' : '0 0 30%',
          sm: isFirst ? '0 0 160px' : '0 0 140px',
        },
        minWidth: 0, // allow shrinking below content size
        animation: `slideInUp 0.5s ease ${visualPos * 0.1}s both`,
      }}
    >
      {/* Crown for 1st */}
      {isFirst && (
        <Typography
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.5rem' },
            mb: -0.5,
            animation: 'crownFloat 2s ease-in-out infinite',
          }}
        >
          👑
        </Typography>
      )}

      {/* Avatar */}
      <Box sx={{ position: 'relative', mb: 1 }}>
        <Avatar
          src={entry.avatarUrl}
          sx={{
            width: { xs: isFirst ? 52 : 44, sm: isFirst ? 72 : 60 },
            height: { xs: isFirst ? 52 : 44, sm: isFirst ? 72 : 60 },
            border: `3px solid ${color}`,
            boxShadow: GLOWS[rankIdx],
            fontSize: { xs: isFirst ? '1.1rem' : '0.9rem', sm: isFirst ? '1.5rem' : '1.2rem' },
            background: `linear-gradient(135deg, ${alpha(color, 0.3)}, ${alpha(color, 0.1)})`,
            fontFamily: '"Bebas Neue"',
          }}
        >
          {entry.username[0].toUpperCase()}
        </Avatar>

        {/* Rank badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -4, right: -4,
            width: 22, height: 22,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #080A10',
          }}
        >
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: '#000', lineHeight: 1 }}>
            {entry.rank}
          </Typography>
        </Box>
      </Box>

      {/* Name */}
      <Tooltip title={`${getFlag(entry.country)} ${entry.username}`} placement="top">
        <Typography
          sx={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: { xs: isFirst ? '0.72rem' : '0.65rem', sm: isFirst ? '0.95rem' : '0.85rem' },
            color: isCurrentPlayer ? '#00D4FF' : '#F0F2F8',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            letterSpacing: '0.02em',
            px: 0.5,
          }}
        >
          {getFlag(entry.country)} {entry.username}
        </Typography>
      </Tooltip>

      {/* Score */}
      <Typography
        sx={{
          fontSize: { xs: isFirst ? '0.6rem' : '0.55rem', sm: isFirst ? '0.8rem' : '0.72rem' },
          color: alpha(color, 0.8),
          fontFamily: '"Barlow Condensed"',
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        {formatCurrency(entry.score, true)}
      </Typography>

      {/* Prize estimate */}
      <Box
        sx={{
          px: { xs: 0.75, sm: 1.5 },
          py: 0.5,
          borderRadius: 1,
          background: alpha(color, 0.12),
          border: `1px solid ${alpha(color, 0.3)}`,
          mb: 1,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '0.5rem', sm: '0.65rem' },
            color: 'rgba(255,255,255,0.4)',
            fontFamily: '"Barlow Condensed"',
            textAlign: 'center',
            letterSpacing: '0.06em',
          }}
        >
          PRIZE
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: { xs: isFirst ? '0.85rem' : '0.75rem', sm: isFirst ? '1.1rem' : '0.9rem' },
            color,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {formatCurrency(entry.prizeEstimate, true)}
        </Typography>
      </Box>

      {/* Podium block */}
      <Box
        sx={{
          width: '100%',
          height: PODIUM_HEIGHTS[rankIdx],
          borderRadius: '6px 6px 0 0',
          background: `linear-gradient(180deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.06)} 100%)`,
          border: `1px solid ${alpha(color, 0.25)}`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          pt: 1.5,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          },
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: { xs: isFirst ? '1.4rem' : '1.1rem', sm: isFirst ? '2rem' : '1.5rem' },
            color: alpha(color, 0.3),
          }}
        >
          {MEDALS[rankIdx]}
        </Typography>
      </Box>
    </Box>
  );
};

const PodiumDisplay: React.FC<PodiumDisplayProps> = ({ top3, currentPlayerId }) => {
  if (top3.length < 3) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 3 },
        pb: 0,
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {ORDER.map((rankIdx) => {
        const entry = top3[rankIdx];
        if (!entry) return null;
        const visualPos = ORDER.indexOf(rankIdx);
        return (
          <PodiumCard
            key={entry.playerId}
            entry={entry}
            visualPos={visualPos}
            isCurrentPlayer={entry.playerId === currentPlayerId}
          />
        );
      })}
    </Box>
  );
};

export default PodiumDisplay;