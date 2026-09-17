/* ============================================================
   LoginPage — SchoolConnect Multi-Method Web Authentication
   Features:
   - "Password" tab: Phone number (E.164) + Password login
   - "OTP" tab: Phone number (E.164) + Email/SMS delivery + 6-digit OTP
   - Multi-child student profile selection for parent accounts
   ============================================================ */

import { useState, useRef, useEffect, type FormEvent, type ClipboardEvent } from 'react';
import {
  GraduationCap,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  User,
  Check,
} from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { usePasswordLogin } from '../hooks/usePasswordLogin';
import { useRequestOtp } from '../hooks/useRequestOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';
import { useSelectChild } from '../hooks/useSelectChild';
import {
  passwordLoginSchema,
  otpRequestSchema,
  otpVerifySchema,
  type PasswordLoginFormData,
  type OtpRequestFormData,
} from '../schemas';
import type { ChildInfo, OtpChannel } from '../../../api/types';
import styles from './LoginPage.module.css';

type AuthMode = 'password' | 'otp';
type OtpStep = 'phone' | 'otp' | 'child_selection';

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  let os = 'Windows';
  if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

export function LoginPage() {
  const { schoolName, tagline, logoUrl } = useThemeStore();

  // Mode: Password or OTP
  const [authMode, setAuthMode] = useState<AuthMode>('password');

  // Shared phone number
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password Login State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login State
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [channel, setChannel] = useState<OtpChannel>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [childrenList, setChildrenList] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | undefined>();
  const [resendCountdown, setResendCountdown] = useState(60);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP input refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (authMode === 'otp' && otpStep === 'otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authMode, otpStep, resendCountdown]);

  // ── Mutations ───────────────────────────────────────────────
  const passwordLoginMutation = usePasswordLogin({
    onFieldErrors: (fieldErrors) => {
      setErrors(fieldErrors);
    },
  });

  const requestOtpMutation = useRequestOtp({
    onSuccess: () => {
      setOtpStep('otp');
      setResendCountdown(60);
      setErrors({});
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    },
    onFieldErrors: (fieldErrors) => {
      setErrors(fieldErrors);
    },
  });

  const verifyOtpMutation = useVerifyOtp({
    onChildSelectionRequired: (children) => {
      setChildrenList(children);
      setOtpStep('child_selection');
    },
    onFieldErrors: (fieldErrors) => {
      setErrors(fieldErrors);
    },
  });

  const selectChildMutation = useSelectChild(selectedChild);

  // ── Handlers ────────────────────────────────────────────────
  const handlePasswordLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload: PasswordLoginFormData = {
      phoneNumber: phoneNumber.trim(),
      password,
      deviceInfo: getDeviceInfo(),
    };

    const validation = passwordLoginSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    passwordLoginMutation.mutate(payload);
  };

  const handleRequestOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: OtpRequestFormData = {
      phoneNumber: phoneNumber.trim(),
      channel,
      email: channel === 'EMAIL' ? email.trim() : undefined,
    };

    const validation = otpRequestSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    requestOtpMutation.mutate(formData);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      const nextEmptyIndex = newDigits.findIndex((d) => !d);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const fullOtp = otpDigits.join('');
    const validation = otpVerifySchema.safeParse({
      phoneNumber: phoneNumber.trim(),
      otp: fullOtp,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    verifyOtpMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      otp: fullOtp,
    });
  };

  const handleResendOtp = () => {
    if (resendCountdown > 0 || requestOtpMutation.isPending) return;
    setOtpDigits(['', '', '', '', '', '']);
    setErrors({});
    requestOtpMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      channel,
      email: channel === 'EMAIL' ? email.trim() : undefined,
    });
  };

  const handleSelectChild = (child: ChildInfo) => {
    setSelectedChild(child);
    selectChildMutation.mutate({ childId: child.id });
  };

  return (
    <div className={styles.page}>
      {/* Animated Background */}
      <div className={styles.bgShapes}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
      </div>

      <div className={styles.card}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoContainer}>
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className={styles.logo} />
            ) : (
              <div className={styles.logoFallback}>
                <GraduationCap size={28} />
              </div>
            )}
          </div>
          <h1 className={styles.schoolName}>{schoolName}</h1>
          <p className={styles.tagline}>{tagline}</p>
        </div>

        {/* ── Tabs for Password and OTP ───────────────────────────── */}
        <div className={styles.authTabs}>
          <button
            type="button"
            className={`${styles.authTabBtn} ${
              authMode === 'password' ? styles.authTabBtnActive : ''
            }`}
            onClick={() => {
              setAuthMode('password');
              setErrors({});
            }}
          >
            <Lock size={15} />
            <span>Password</span>
          </button>
          <button
            type="button"
            className={`${styles.authTabBtn} ${
              authMode === 'otp' ? styles.authTabBtnActive : ''
            }`}
            onClick={() => {
              setAuthMode('otp');
              setErrors({});
            }}
          >
            <KeyRound size={15} />
            <span>OTP Code</span>
          </button>
        </div>

        {/* ── METHOD 1: Password Login ────────────────────────────── */}
        {authMode === 'password' && (
          <div>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Password Sign In</h2>
              <p className={styles.stepSubtitle}>
                Enter your mobile number and password to access your dashboard.
              </p>
            </div>

            <form onSubmit={handlePasswordLoginSubmit} className={styles.form}>
              {/* Phone Input */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="pwdPhoneNumber">
                  Mobile Number (E.164)
                </label>
                <div className={styles.inputWrapper}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input
                    id="pwdPhoneNumber"
                    type="tel"
                    className={`${styles.input} ${
                      errors.phoneNumber ? styles.inputError : ''
                    }`}
                    placeholder="+919876543210"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) {
                        setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                      }
                    }}
                    autoComplete="tel"
                    required
                  />
                </div>
                {errors.phoneNumber && (
                  <span className={styles.errorText}>{errors.phoneNumber}</span>
                )}
              </div>

              {/* Password Input */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="pwdPassword">
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="pwdPassword"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${
                      errors.password ? styles.inputError : ''
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errorText}>{errors.password}</span>
                )}
              </div>

              {/* Switch to OTP helper */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('otp');
                    setErrors({});
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-300)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password? Sign in with OTP →
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={passwordLoginMutation.isPending}
              >
                {passwordLoginMutation.isPending ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── METHOD 2: OTP Login ─────────────────────────────────── */}
        {authMode === 'otp' && otpStep === 'phone' && (
          <div>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Sign In with OTP</h2>
              <p className={styles.stepSubtitle}>
                Enter your mobile number to receive a one-time verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtpSubmit} className={styles.form}>
              {/* Phone Number Input */}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="otpPhoneNumber">
                  Mobile Number (E.164)
                </label>
                <div className={styles.inputWrapper}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input
                    id="otpPhoneNumber"
                    type="tel"
                    className={`${styles.input} ${
                      errors.phoneNumber ? styles.inputError : ''
                    }`}
                    placeholder="+919876543210"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) {
                        setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                      }
                    }}
                    autoComplete="tel"
                    required
                  />
                </div>
                {errors.phoneNumber ? (
                  <span className={styles.errorText}>{errors.phoneNumber}</span>
                ) : (
                  <span className={styles.hintText}>
                    Include country code (e.g. +91 for India).
                  </span>
                )}
              </div>

              {/* Delivery Channel Picker */}
              <div className={`${styles.fieldGroup} ${styles.channelGroup}`}>
                <label className={styles.label}>OTP Delivery Channel</label>
                <div className={styles.channelOptions}>
                  <button
                    type="button"
                    className={`${styles.channelBtn} ${
                      channel === 'EMAIL' ? styles.channelBtnActive : ''
                    }`}
                    onClick={() => {
                      setChannel('EMAIL');
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  >
                    <Mail size={16} />
                    <span>Email OTP</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.channelBtn} ${
                      channel === 'SMS' ? styles.channelBtnActive : ''
                    }`}
                    onClick={() => setChannel('SMS')}
                  >
                    <MessageSquare size={16} />
                    <span>SMS OTP</span>
                  </button>
                </div>

                {channel === 'SMS' && (
                  <div className={styles.warningAlert}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      SMS delivery is currently being configured on the server. Please
                      choose <strong>Email OTP</strong> for instant delivery.
                    </span>
                  </div>
                )}
              </div>

              {/* Registered Email (Required if Email channel chosen) */}
              {channel === 'EMAIL' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">
                    Registered Email Address
                  </label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input
                      id="email"
                      type="email"
                      className={`${styles.input} ${
                        errors.email ? styles.inputError : ''
                      }`}
                      placeholder="admin@school.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {errors.email ? (
                    <span className={styles.errorText}>{errors.email}</span>
                  ) : (
                    <span className={styles.hintText}>
                      We will deliver your 6-digit verification code to this address.
                    </span>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={requestOtpMutation.isPending}
              >
                {requestOtpMutation.isPending ? (
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── METHOD 2 STEP 2: 6-Digit OTP Verification ────────────── */}
        {authMode === 'otp' && otpStep === 'otp' && (
          <div>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Enter Verification Code</h2>
              <p className={styles.stepSubtitle}>
                We sent a 6-digit code to:
              </p>
              <div className={styles.recipientBadge}>
                <ShieldCheck size={14} />
                <span>
                  {phoneNumber} {channel === 'EMAIL' && email ? `(${email})` : ''}
                </span>
              </div>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className={styles.form}>
              {/* 6 Digit Inputs */}
              <div className={styles.otpContainer}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className={`${styles.otpBox} ${
                      digit ? styles.otpBoxFilled : ''
                    } ${errors.otp ? styles.inputError : ''}`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {errors.otp && (
                <div style={{ textAlign: 'center' }}>
                  <span className={styles.errorText}>{errors.otp}</span>
                </div>
              )}

              {/* Resend & Edit Number Row */}
              <div className={styles.otpActions}>
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => {
                    setOtpStep('phone');
                    setErrors({});
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Edit Phone</span>
                </button>

                <div>
                  {resendCountdown > 0 ? (
                    <span style={{ color: 'var(--color-neutral-400)' }}>
                      Resend code in <strong>{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.resendBtn}
                      onClick={handleResendOtp}
                      disabled={requestOtpMutation.isPending}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={
                  otpDigits.join('').length !== 6 || verifyOtpMutation.isPending
                }
              >
                {verifyOtpMutation.isPending ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify & Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── METHOD 2 STEP 3: Child Selection ─────────────────────── */}
        {authMode === 'otp' && otpStep === 'child_selection' && (
          <div>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Select Student Profile</h2>
              <p className={styles.stepSubtitle}>
                Multiple student profiles were found for your account. Please choose which one to open.
              </p>
            </div>

            <div className={styles.childList}>
              {childrenList.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={styles.childCard}
                  onClick={() => handleSelectChild(child)}
                  disabled={selectChildMutation.isPending}
                >
                  <div className={styles.childInfo}>
                    <div className={styles.childAvatar}>
                      <User size={22} />
                    </div>
                    <div>
                      <h3 className={styles.childName}>{child.name}</h3>
                      <p className={styles.childMeta}>
                        {child.standard ? `Grade: ${child.standard}` : ''}
                        {child.section ? ` • Section: ${child.section}` : ''}
                      </p>
                    </div>
                  </div>
                  <Check size={18} style={{ color: 'var(--color-primary-400)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className={styles.footer}>
          <span>Protected by <strong>SchoolConnect Security</strong>. Multi-tenant zero-trust platform.</span>
        </div>
      </div>
    </div>
  );
}
