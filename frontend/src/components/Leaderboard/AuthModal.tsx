import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, IconButton,
  InputAdornment, CircularProgress, Divider, Alert,
  Modal, Fade, Backdrop,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import { useAppDispatch } from '../../store';
import { loginWithCredentials, registerPlayer } from '../../store/playerSlice';

const COUNTRIES = [
  { code: 'US', label: 'United States' }, { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' }, { code: 'FR', label: 'France' },
  { code: 'TR', label: 'Turkey' }, { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'South Korea' }, { code: 'BR', label: 'Brazil' },
  { code: 'CA', label: 'Canada' }, { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' }, { code: 'RU', label: 'Russia' },
  { code: 'CN', label: 'China' }, { code: 'MX', label: 'Mexico' },
  { code: 'ES', label: 'Spain' }, { code: 'IT', label: 'Italy' },
  { code: 'NL', label: 'Netherlands' }, { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' }, { code: 'PL', label: 'Poland' },
];

// ── Font constants ────────────────────────────────────────────────────────────
const F_DISPLAY = '"Orbitron", sans-serif';   // hero titles
const F_LABEL   = '"Oxanium", sans-serif';    // labels, tabs, chips
const F_BODY    = '"Rajdhani", sans-serif';   // body text, helper text
const F_MONO    = '"Share Tech Mono", monospace'; // input values (unused here but kept consistent)

// ── Shared field styles ───────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiInputBase-root': {
    fontFamily: F_BODY,
    fontWeight: 500,
    fontSize: '0.95rem',
    color: '#F0F2F8',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 1.5,
    letterSpacing: '0.02em',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,215,0,0.35)',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  '& .MuiInputLabel-root': {
    fontFamily: F_LABEL,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 100px #0f1117 inset',
    WebkitTextFillColor: '#F0F2F8',
  },
  '& select': {
    color: '#F0F2F8',
    background: 'transparent',
    fontFamily: F_BODY,
  },
};

type Mode = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, initialMode = 'login', onClose }) => {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regCountry, setRegCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchMode = (m: Mode) => { setMode(m); setError(null); setSuccess(null); };
  const handleClose = () => { setError(null); setSuccess(null); onClose(); };

  const handleLogin = async () => {
    setError(null);
    if (!loginEmail || !loginPassword) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await dispatch(loginWithCredentials({ email: loginEmail, password: loginPassword })).unwrap();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError(null);
    if (!regUsername || !regEmail || !regPassword || !regConfirm) {
      setError('Please fill in all required fields.'); return;
    }
    if (regUsername.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await dispatch(registerPlayer({
        username: regUsername, email: regEmail,
        password: regPassword, country: regCountry || undefined,
      })).unwrap();
      setSuccess('Account created! Logging you in…');
      setTimeout(handleClose, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) mode === 'login' ? handleLogin() : handleRegister();
  };

  // ── Shared submit button style ──────────────────────────────────────────────
  const submitBtnSx = {
    mt: 0.5, py: 1.25,
    fontFamily: F_DISPLAY,
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    background: 'linear-gradient(135deg, #FFD700, #FFA000)',
    color: '#000',
    borderRadius: 1.5,
    boxShadow: '0 4px 20px rgba(255,215,0,0.25)',
    textTransform: 'uppercase' as const,
    '&:hover': {
      background: 'linear-gradient(135deg, #FFE033, #FFB300)',
      boxShadow: '0 4px 30px rgba(255,215,0,0.4)',
    },
    '&:disabled': { background: 'rgba(255,215,0,0.3)', color: 'rgba(0,0,0,0.5)' },
    transition: 'all 0.2s',
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 300, sx: { backdropFilter: 'blur(6px)', background: 'rgba(4,5,8,0.75)' } } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: 'calc(100vw - 32px)', sm: 440 },
            maxHeight: '90vh', overflowY: 'auto',
            background: 'linear-gradient(160deg, #0d0f16 0%, #080a10 100%)',
            border: '1px solid rgba(255,215,0,0.12)',
            borderRadius: 3,
            boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 120px rgba(255,215,0,0.04)',
            p: { xs: 3, sm: 4 },
            outline: 'none',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,215,0,0.15)', borderRadius: 2 },
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Close */}
          <IconButton
            onClick={handleClose} size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#FFD700' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* ── Header ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: '1.6rem', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.5))' }} />
            <Box>
              {/* Title — Orbitron */}
              <Typography
                sx={{
                  fontFamily: F_DISPLAY,
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  lineHeight: 1,
                  color: '#F0F2F8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textShadow: '0 0 20px rgba(255,215,0,0.15)',
                }}
              >
                {mode === 'login' ? 'Welcome Back' : 'Join the Arena'}
              </Typography>
              {/* Subtitle — Oxanium */}
              <Typography
                sx={{
                  fontFamily: F_LABEL,
                  fontWeight: 500,
                  fontSize: '0.58rem',
                  color: 'rgba(255,255,255,0.28)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  mt: 0.25,
                }}
              >
                {mode === 'login' ? 'Sign in to your account' : 'Create your player account'}
              </Typography>
            </Box>
          </Box>

          {/* ── Tab switcher ── */}
          <Box
            sx={{
              display: 'flex', mb: 3,
              borderRadius: 1.5,
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {(['login', 'register'] as Mode[]).map((m) => (
              <Box
                key={m}
                onClick={() => switchMode(m)}
                sx={{
                  flex: 1, py: 1, textAlign: 'center', cursor: 'pointer',
                  /* Tab label — Oxanium */
                  fontFamily: F_LABEL,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  color: mode === m ? '#FFD700' : 'rgba(255,255,255,0.28)',
                  background: mode === m ? alpha('#FFD700', 0.08) : 'transparent',
                  borderBottom: mode === m ? '2px solid #FFD700' : '2px solid transparent',
                  '&:hover': { color: mode === m ? '#FFD700' : 'rgba(255,255,255,0.55)' },
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </Box>
            ))}
          </Box>

          {/* ── Alerts ── */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2, py: 0.5,
                background: 'rgba(255,77,106,0.08)',
                color: '#FF4D6A',
                border: '1px solid rgba(255,77,106,0.2)',
                borderRadius: 1.5,
                fontFamily: F_BODY,
                fontWeight: 500,
                fontSize: '0.88rem',
                '& .MuiAlert-icon': { color: '#FF4D6A' },
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2, py: 0.5,
                background: 'rgba(0,227,150,0.08)',
                color: '#00E396',
                border: '1px solid rgba(0,227,150,0.2)',
                borderRadius: 1.5,
                fontFamily: F_BODY,
                fontWeight: 500,
                fontSize: '0.88rem',
                '& .MuiAlert-icon': { color: '#00E396' },
              }}
            >
              {success}
            </Alert>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Email" type="email" value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                fullWidth size="small" autoComplete="email" sx={fieldSx} />

              <TextField
                label="Password" type={showPassword ? 'text' : 'password'}
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                fullWidth size="small" autoComplete="current-password" sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((p) => !p)}
                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#FFD700' } }}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button fullWidth onClick={handleLogin} disabled={loading}
                startIcon={loading ? <CircularProgress size={14} sx={{ color: '#000' }} /> : <LoginIcon />}
                sx={submitBtnSx}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.5 }}>
                {/* Divider text — Oxanium */}
                <Typography sx={{ fontFamily: F_LABEL, fontWeight: 600, fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', px: 1, letterSpacing: '0.14em' }}>
                  OR
                </Typography>
              </Divider>

              {/* Footer link — Rajdhani */}
              <Typography sx={{ textAlign: 'center', fontFamily: F_BODY, fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
                No account?{' '}
                <Box component="span" onClick={() => switchMode('register')}
                  sx={{ color: '#FFD700', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Create one free
                </Box>
              </Typography>
            </Box>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Username *" value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                fullWidth size="small" autoComplete="username"
                inputProps={{ minLength: 3, maxLength: 50 }}
                helperText={regUsername.length > 0 && regUsername.length < 3 ? 'Min 3 characters' : ''}
                FormHelperTextProps={{ sx: { fontFamily: F_BODY, color: '#FF4D6A', fontSize: '0.78rem' } }}
                sx={fieldSx} />

              <TextField label="Email *" type="email" value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                fullWidth size="small" autoComplete="email" sx={fieldSx} />

              <TextField
                label="Country (optional)" select SelectProps={{ native: true }}
                value={regCountry} onChange={(e) => setRegCountry(e.target.value)}
                fullWidth size="small"
                sx={{ ...fieldSx, '& select': { color: regCountry ? '#F0F2F8' : 'rgba(255,255,255,0.35)' } }}
              >
                <option value="" style={{ background: '#0d0f16', color: 'rgba(255,255,255,0.35)' }}></option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} style={{ background: '#0d0f16', color: '#F0F2F8' }}>{c.label}</option>
                ))}
              </TextField>

              <TextField
                label="Password * (min 8 chars)" type={showPassword ? 'text' : 'password'}
                value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                fullWidth size="small" autoComplete="new-password" sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((p) => !p)}
                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#FFD700' } }}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm Password *" type={showConfirm ? 'text' : 'password'}
                value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                fullWidth size="small" autoComplete="new-password"
                error={regConfirm.length > 0 && regConfirm !== regPassword}
                helperText={regConfirm.length > 0 && regConfirm !== regPassword ? 'Passwords do not match' : ''}
                FormHelperTextProps={{ sx: { fontFamily: F_BODY, color: '#FF4D6A', fontSize: '0.78rem' } }}
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm((p) => !p)}
                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: '#FFD700' } }}>
                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button fullWidth onClick={handleRegister} disabled={loading}
                startIcon={loading ? <CircularProgress size={14} sx={{ color: '#000' }} /> : <PersonAddIcon />}
                sx={submitBtnSx}
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>

              <Typography sx={{ textAlign: 'center', fontFamily: F_BODY, fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
                Already have an account?{' '}
                <Box component="span" onClick={() => switchMode('login')}
                  sx={{ color: '#FFD700', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  Sign in
                </Box>
              </Typography>
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default AuthModal;