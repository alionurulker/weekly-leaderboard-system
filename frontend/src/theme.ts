import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gold: Palette['primary'];
    teal: Palette['primary'];
    rankColors: {
      first: string;
      second: string;
      third: string;
      top10: string;
      top100: string;
      other: string;
    };
  }
  interface PaletteOptions {
    gold?: PaletteOptions['primary'];
    teal?: PaletteOptions['primary'];
    rankColors?: {
      first: string;
      second: string;
      third: string;
      top10: string;
      top100: string;
      other: string;
    };
  }
}

export const RANK_COLORS = {
  first:  '#FFD700',
  second: '#C0C0C0',
  third:  '#CD7F32',
  top10:  '#00D4FF',
  top100: '#8B9FFF',
  other:  '#6B7280',
};

export const getRankColor = (rank: number): string => {
  if (rank === 1)   return RANK_COLORS.first;
  if (rank === 2)   return RANK_COLORS.second;
  if (rank === 3)   return RANK_COLORS.third;
  if (rank <= 10)   return RANK_COLORS.top10;
  if (rank <= 100)  return RANK_COLORS.top100;
  return RANK_COLORS.other;
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD700',
      light: '#FFE55C',
      dark: '#B8960C',
    },
    secondary: {
      main: '#00D4FF',
      light: '#66E5FF',
      dark: '#0099BB',
    },
    background: {
      default: '#080A10',
      paper: '#0F1117',
    },
    text: {
      primary: '#F0F2F8',
      secondary: '#8B93A8',
    },
    gold: {
      main: '#FFD700',
      light: '#FFE55C',
      dark: '#B8960C',
      contrastText: '#000',
    },
    teal: {
      main: '#00D4FF',
      light: '#66E5FF',
      dark: '#0099BB',
      contrastText: '#000',
    },
    rankColors: RANK_COLORS,
    divider: 'rgba(255,255,255,0.06)',
    error: { main: '#FF4D6A' },
    success: { main: '#00E396' },
    warning: { main: '#FFB300' },
  },
  typography: {
    fontFamily: '"Barlow", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Bebas Neue", "Barlow Condensed", sans-serif',
      fontWeight: 400,
      letterSpacing: '0.04em',
    },
    h2: {
      fontFamily: '"Bebas Neue", "Barlow Condensed", sans-serif',
      fontWeight: 400,
      letterSpacing: '0.03em',
    },
    h3: {
      fontFamily: '"Bebas Neue", "Barlow Condensed", sans-serif',
      fontWeight: 400,
      letterSpacing: '0.02em',
    },
    h4: {
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h5: {
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Barlow Condensed", sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: '"Barlow", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      fontSize: '0.75rem',
    },
    body1: {
      fontFamily: '"Barlow", sans-serif',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Barlow", sans-serif',
      fontWeight: 400,
      fontSize: '0.8125rem',
    },
    caption: {
      fontFamily: '"Barlow", sans-serif',
      fontSize: '0.7rem',
      letterSpacing: '0.06em',
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        html, body, #root {
          height: 100%;
          background: #080A10;
        }

        body {
          background: #080A10;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,215,0,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 90% 110%, rgba(0,212,255,0.06) 0%, transparent 50%);
          background-attachment: fixed;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,215,0,0.2);
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,215,0,0.4);
        }

        @keyframes rankPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes scoreFlash {
          0%   { color: #00E396; }
          100% { color: inherit; }
        }

        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        @keyframes crownFloat {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%       { transform: translateY(-4px) rotate(5deg); }
        }
      `,
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0F1117',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 600,
          letterSpacing: '0.05em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 600,
          letterSpacing: '0.04em',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A1E2A',
          border: '1px solid rgba(255,255,255,0.1)',
          fontFamily: '"Barlow", sans-serif',
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export const glassCard = (opacity = 0.04) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
});

export const goldGlow = (intensity = 0.3) =>
  `0 0 20px ${alpha('#FFD700', intensity)}, 0 0 40px ${alpha('#FFD700', intensity * 0.5)}`;

export const tealGlow = (intensity = 0.3) =>
  `0 0 20px ${alpha('#00D4FF', intensity)}, 0 0 40px ${alpha('#00D4FF', intensity * 0.5)}`;
