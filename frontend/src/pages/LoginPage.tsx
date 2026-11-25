
import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import '@fontsource-variable/estedad';
import '@fontsource-variable/public-sans';

import { useAuth } from '@/features/auth/AuthContext';

// ------------------------------------------------------------
// Design tokens
// ------------------------------------------------------------

const C = {
  navy: '#233454',
  blue: '#527A9A',
  muted: '#76859A',
  placeholder: '#9AA8BA',
  border: '#DFE6EF',
} as const;

const FONT = '"Estedad Variable", sans-serif';

const backgroundUrl =
  `${import.meta.env.BASE_URL}assets/background/nit-login-blueprint.webp`;

// ------------------------------------------------------------
// Form styles
// ------------------------------------------------------------

const labelSx = {
  display: 'block',
  mb: 0.9,
  color: C.navy,
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 700,
  textAlign: 'right',
} as const;

// Explicit left/right padding prevents RTL icon overlap.
const inputSx = (field: 'username' | 'password') => ({
  width: '100%',
  direction: 'rtl',

  '& .MuiOutlinedInput-root': {
    height: 56,
    position: 'relative',
    direction: 'rtl',
    borderRadius: '12px',
    bgcolor: 'rgba(250,252,255,0.78)',

    transition:
      'background-color 180ms ease, box-shadow 180ms ease',

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: C.border,
    },

    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#A8B9CD',
    },

    '&.Mui-focused': {
      bgcolor: '#FFFFFF',
      boxShadow: '0 0 0 3px rgba(82,122,154,0.09)',
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: C.blue,
      borderWidth: 1,
    },
  },

  '& .MuiOutlinedInput-input': {
    boxSizing: 'border-box',
    height: '100%',
    width: '100%',
    minWidth: 0,

    padding: 0,

    // Reserve space for icons using physical sides.
    paddingLeft: field === 'password' ? '58px' : '18px',
    paddingRight: '52px',

    direction: 'ltr',
    textAlign: 'left',

    fontFamily: FONT,
    fontSize: 14,
    color: C.navy,
  },

  // Placeholder appears on the right.
  '& .MuiOutlinedInput-input:placeholder-shown': {
    textAlign: 'right',
  },

  '& .MuiOutlinedInput-input::placeholder': {
    color: C.placeholder,
    opacity: 1,
    direction: 'rtl',
    textAlign: 'right',
  },

  // Typed English text begins from the left.
  '& .MuiOutlinedInput-input:focus': {
    textAlign: 'left',
  },
});

// ------------------------------------------------------------
// Login page
// ------------------------------------------------------------

export const LoginPage = () => {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const oldBodyOverflow = document.body.style.overflow;
    const oldHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = oldBodyOverflow;
      document.documentElement.style.overflow = oldHtmlOverflow;
    };
  }, []);

  // Keep existing backend authentication.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(usernameOrEmail.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setErrorMessage(
        apiError?.response?.data?.message ||
          'نام کاربری یا رمز عبور اشتباه است، یا حساب کاربری غیرفعال می‌باشد.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <Box
      component="main"
      dir="rtl"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        overflowY: 'auto',
        direction: 'rtl',
        fontFamily: FONT,

        bgcolor: '#F8FAFD',

        backgroundImage: {
          xs: `
            linear-gradient(
              rgba(248,250,253,0.48),
              rgba(248,250,253,0.48)
            ),
            url("${backgroundUrl}")
          `,

          md: `
            linear-gradient(
              270deg,
              rgba(250,252,255,0.78) 0%,
              rgba(250,252,255,0.48) 30%,
              rgba(250,252,255,0.07) 65%,
              rgba(250,252,255,0.02) 100%
            ),
            url("${backgroundUrl}")
          `,
        },

        backgroundSize: 'cover',

        backgroundPosition: {
          xs: '38% center',
          md: 'center center',
        },

        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Page positioning: right on desktop */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',

          justifyContent: {
            xs: 'center',
            md: 'flex-start',
          },

          minHeight: '100%',
          boxSizing: 'border-box',

          px: {
            xs: 2,
            sm: 4,
            md: 7,
            lg: 12,
            xl: 18,
          },

          py: {
            xs: 3,
            md: 4,
          },
        }}
      >
        {/* Keep the existing entrance animation */}
        <motion.div
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 18,
                  scale: 0.99,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            width: '100%',
            maxWidth: 500,
          }}
        >
          {/* Login card */}
          <Box
            sx={{
              width: '100%',
              boxSizing: 'border-box',

              px: {
                xs: 3,
                sm: 4.5,
                md: 5,
              },

              py: {
                xs: 3.5,
                sm: 4.5,
              },

              borderRadius: '24px',
              border: '1px solid rgba(139,159,185,0.23)',

              bgcolor: 'rgba(255,255,255,0.92)',

              backdropFilter: 'blur(18px) saturate(115%)',
              WebkitBackdropFilter: 'blur(18px) saturate(115%)',

              boxShadow:
                '0 24px 70px rgba(35,52,84,0.11), 0 2px 8px rgba(35,52,84,0.03)',
            }}
          >
            {/* Brand */}
            <Box
              dir="rtl"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                mb: 3,
              }}
            >
              <Typography
                dir="ltr"
                sx={{
                  fontFamily:
                    '"Public Sans Variable", sans-serif',
                  color: C.navy,
                  fontSize: 21,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                }}
              >
                NIT-Help
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: C.muted,
                  fontFamily: FONT,
                  fontSize: 12,
                  textAlign: 'right',
                }}
              >
                سامانه یکپارچه خدمات دانشگاه
              </Typography>
            </Box>

            {/* Heading */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 3.5,
                pt: 2.5,
                borderTop:
                  '1px solid rgba(118,133,154,0.12)',
              }}
            >
              <Typography
                component="h1"
                sx={{
                  color: C.navy,
                  fontFamily: FONT,

                  fontSize: {
                    xs: 23,
                    sm: 25,
                  },

                  fontWeight: 800,
                  lineHeight: 1.6,
                  mb: 0.5,
                  textAlign: 'center',
                }}
              >
                ورود به حساب کاربری
              </Typography>

              <Typography
                sx={{
                  color: C.muted,
                  fontFamily: FONT,
                  fontSize: 13,
                  lineHeight: 1.9,
                  textAlign: 'center',
                }}
              >
                با حساب دانشگاهی خود وارد سامانه شوید.
              </Typography>
            </Box>

            {/* Error */}
            {!!errorMessage && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: '12px',
                  direction: 'rtl',
                  textAlign: 'right',
                  fontFamily: FONT,

                  '& .MuiAlert-message': {
                    fontFamily: FONT,
                  },
                }}
              >
                {errorMessage}
              </Alert>
            )}

            {/* Form */}
            <Box
              component="form"
              dir="rtl"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                direction: 'rtl',
              }}
            >
              {/* Username field */}
              <Box>
                <Box
                  component="label"
                  htmlFor="nit-username"
                  sx={labelSx}
                >
                  نام کاربری یا ایمیل دانشگاهی
                </Box>

                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                  }}
                >
                  <TextField
                    id="nit-username"
                    name="usernameOrEmail"
                    type="text"
                    variant="outlined"
                    placeholder="نام کاربری یا ایمیل خود را وارد کنید"
                    autoComplete="username"
                    fullWidth
                    required
                    value={usernameOrEmail}
                    onChange={(e) =>
                      setUsernameOrEmail(e.target.value)
                    }
                    sx={inputSx('username')}
                    slotProps={{
                      htmlInput: {
                        dir: 'ltr',
                      },
                    }}
                  />

                  {/* User icon — right */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: 'absolute',
                      right: 17,
                      top: '50%',
                      transform: 'translateY(-50%)',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      width: 22,
                      height: 22,
                      color: C.muted,
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  >
                    <Icon
                      icon="solar:user-rounded-linear"
                      width={20}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Password field */}
              <Box>
                <Box
                  component="label"
                  htmlFor="nit-password"
                  sx={labelSx}
                >
                  رمز عبور
                </Box>

                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                  }}
                >
                  <TextField
                    id="nit-password"
                    name="password"
                    variant="outlined"
                    type={
                      showPassword ? 'text' : 'password'
                    }
                    placeholder="رمز عبور خود را وارد کنید"
                    autoComplete="current-password"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    sx={inputSx('password')}
                    slotProps={{
                      htmlInput: {
                        dir: 'ltr',
                      },
                    }}
                  />


                  {/* Lock icon — right */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: 'absolute',
                      right: 17,
                      top: '50%',
                      transform: 'translateY(-50%)',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      width: 22,
                      height: 22,
                      color: C.muted,
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  >
                    <Icon icon="solar:lock-password-linear" width={20} />
                  </Box>


                  {/* Show / hide password — far left */}
                  <IconButton
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? 'مخفی کردن رمز عبور'
                        : 'نمایش رمز عبور'
                    }
                    aria-pressed={showPassword}
                    sx={{
                      position: 'absolute',
                      left: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,

                      width: 36,
                      height: 36,
                      color: C.muted,

                      '&:hover': {
                        color: C.navy,
                        bgcolor: 'rgba(82,122,154,0.08)',
                      },
                    }}
                  >
                    <Icon
                      icon={
                        showPassword
                          ? 'solar:eye-bold'
                          : 'solar:eye-closed-bold'
                      }
                      width={19}
                    />
                  </IconButton>
                </Box>
              </Box>

              {/* Login button */}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 0.75,
                  minHeight: 55,
                  borderRadius: '12px',

                  bgcolor: C.navy,
                  color: '#FFFFFF',

                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: 'none',

                  boxShadow:
                    '0 8px 22px rgba(35,52,84,0.15)',

                  transition:
                    'background-color 200ms, box-shadow 200ms, transform 200ms',

                  '&:hover': {
                    bgcolor: '#354B70',

                    boxShadow:
                      '0 11px 26px rgba(35,52,84,0.20)',

                    transform: 'translateY(-1px)',
                  },

                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',

                    '&:hover': {
                      transform: 'none',
                    },
                  },
                }}
              >
                {isLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      fontFamily: FONT,
                    }}
                  >
                    <CircularProgress
                      size={17}
                      thickness={5}
                      sx={{ color: '#FFFFFF' }}
                    />

                    در حال ورود...
                  </Box>
                ) : (
                  'ورود به سامانه'
                )}
              </Button>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                mt: 3.5,
                pt: 2.5,

                borderTop:
                  '1px solid rgba(118,133,154,0.13)',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,

                color: C.muted,
              }}
            >
              <Icon
                icon="solar:shield-check-bold"
                width={17}
              />

              <Typography
                variant="caption"
                sx={{
                  fontFamily: FONT,
                  fontSize: 11.5,
                  color: C.muted,
                }}
              >
                دسترسی امن به خدمات دانشگاه
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Box>,
    document.body
  );
};
