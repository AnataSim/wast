import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, AlertCircle, CheckSquare, Square, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const REMEMBER_EMAIL_KEY = 'watchlist_remembered_email_v1';
const REMEMBER_PASSWORD_KEY = 'watchlist_remembered_password_v1';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, registerWithEmail, checkUsernameAvailable } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);

  // Auto-fill email & password only when modal opens or switching to Login tab
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (!isRegister) {
        const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
        const savedPass = localStorage.getItem(REMEMBER_PASSWORD_KEY);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
        if (savedPass) {
          setPassword(savedPass);
        }
      } else {
        // Reset inputs when switching to registration mode
        setEmail('');
        setPassword('');
        setDisplayName('');
      }
    }
  }, [isOpen, isRegister]);

  // Real-time requirement checks for registration
  const trimmedNameLength = displayName.trim().length;
  const isUsernameValid = trimmedNameLength >= 3 && trimmedNameLength <= 20;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasUnderscore = /_/.test(password);

  // Check username uniqueness in real-time
  useEffect(() => {
    if (!isRegister || !isUsernameValid) {
      setIsUsernameTaken(false);
      setIsCheckingUsername(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const available = await checkUsernameAvailable(displayName.trim());
      setIsCheckingUsername(false);
      setIsUsernameTaken(!available);
    }, 450);

    return () => clearTimeout(timer);
  }, [displayName, isRegister, isUsernameValid, checkUsernameAvailable]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Enforce requirements only for new registration; existing logins are left untouched.
    if (isRegister) {
      if (!isUsernameValid) {
        setError('Username / Nama Lengkap wajib 3–20 karakter.');
        return;
      }

      if (isUsernameTaken) {
        setError(`Username "${displayName.trim()}" sudah digunakan. Silakan pilih username lain.`);
        return;
      }

      if (!hasUpper || !hasNumber || !hasUnderscore) {
        setError('Kata sandi pendaftaran baru wajib memiliki setidaknya 1 huruf besar (uppercase), 1 angka, dan 1 karakter underscore (_).');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        await registerWithEmail(email, password, displayName);
        // Simpan email dan password yang baru di-register agar auto-fill saat login
        if (email.trim()) localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        if (password) localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
      } else {
        await loginWithEmail(email, password, rememberMe);
        // Simpan atau hapus kredensial berdasarkan centang Remember Me
        if (rememberMe) {
          if (email.trim()) localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
          if (password) localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
          localStorage.removeItem(REMEMBER_PASSWORD_KEY);
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Gagal autentikasi.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Email atau kata sandi tidak valid.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email sudah terdaftar.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Kata sandi minimal 6 karakter.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '28px 24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: !isRegister ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: !isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Masuk (Login)
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: isRegister ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Daftar (Register)
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '0.8rem',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Username / Nama Lengkap</label>
                <span style={{ fontSize: '0.72rem', color: isUsernameValid ? '#4ade80' : 'var(--text-muted)' }}>
                  3–20 karakter
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="Otaku Pro"
                className="input-clean"
                style={{ width: '100%' }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {isUsernameValid && (
                <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                  {isCheckingUsername ? (
                    <span style={{ color: 'var(--text-muted)' }}>Memeriksa ketersediaan...</span>
                  ) : isUsernameTaken ? (
                    <span style={{ color: '#f87171' }}>❌ Username sudah digunakan pengguna lain</span>
                  ) : (
                    <span style={{ color: '#4ade80' }}>✓ Username tersedia</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Alamat Email</label>
            <input
              type="email"
              required
              autoComplete="username email"
              placeholder="user@example.com"
              className="input-clean"
              style={{ width: '100%' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Kata Sandi</label>
            <input
              type="password"
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="input-clean"
              style={{ width: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Registration password requirements checklist indicator */}
            {isRegister && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: hasUpper ? '#4ade80' : 'var(--text-muted)' }}>
                  {hasUpper ? <Check size={12} /> : '•'} Huruf besar (A-Z)
                </span>
                <span style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: hasNumber ? '#4ade80' : 'var(--text-muted)' }}>
                  {hasNumber ? <Check size={12} /> : '•'} Angka (0-9)
                </span>
                <span style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: hasUnderscore ? '#4ade80' : 'var(--text-muted)' }}>
                  {hasUnderscore ? <Check size={12} /> : '•'} Simbol _
                </span>
              </div>
            )}
          </div>

          {/* Remember Me Checkbox (Only on Login tab) */}
          {!isRegister && (
            <div 
              onClick={() => setRememberMe(!rememberMe)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                fontSize: '0.8rem', 
                color: 'var(--text-secondary)',
                userSelect: 'none',
                marginTop: '2px'
              }}
            >
              {rememberMe ? (
                <CheckSquare size={16} color="var(--accent-blue)" />
              ) : (
                <Square size={16} color="var(--text-muted)" />
              )}
              <span>Ingat Saya (Remember Me)</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="pill-btn active"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: '6px' }}
          >
            {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
            {submitting ? 'Memproses...' : isRegister ? 'Buat Akun' : 'Masuk Akun'}
          </button>
        </form>

        {/* Security Hint for Google password */}
        <div style={{
          marginTop: '18px',
          padding: '10px 12px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          lineHeight: '1.4'
        }}>
          <ShieldAlert size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Saran Keamanan:</strong> Lebih baik gunakan kata sandi yang berbeda dari kata sandi akun Google asli Anda demi keamanan.
          </span>
        </div>
      </div>
    </div>
  );
};

