import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Lock, Edit3, Mail, CheckCircle2, AlertCircle, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ImageCropEditor } from './ImageCropEditor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, userBanner, updateUserProfile, updateUserEmail, updateUserPassword } = useAuth();

  // State for Username
  const [newUsername, setNewUsername] = useState(user?.displayName || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // State for Email
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // State for Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // State for Avatar Upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [avatarEditorFile, setAvatarEditorFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // State for Banner Upload
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [bannerEditorFile, setBannerEditorFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  // Handler: Avatar Choose → open editor
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAvatarFeedback({ type: 'error', msg: 'Harap pilih file gambar (PNG/JPG/GIF).' });
        return;
      }
      setAvatarEditorFile(file);
      setAvatarFeedback(null);
      // Reset input so the same file can be re-selected later
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleAvatarEditorApply = (blob: Blob) => {
    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const ext = extMap[blob.type] ?? 'webp';
    const processed = new File([blob], `avatar.${ext}`, { type: blob.type });
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(processed);
    setAvatarPreview(URL.createObjectURL(blob));
    setAvatarEditorFile(null);
  };

  const handleAvatarEditorCancel = () => {
    setAvatarEditorFile(null);
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFileSmart = async (storagePath: string, file: File): Promise<string> => {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadPromise = (async () => {
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 3500)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch (err) {
      console.warn('Firebase Storage upload warning (falling back to DataURL):', err);
      return await fileToDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      setAvatarFeedback({ type: 'error', msg: 'Pilih file foto profil terlebih dahulu.' });
      return;
    }
    setAvatarLoading(true);
    setAvatarFeedback(null);
    try {
      const storagePath = `avatars/${user.uid}/${Date.now()}_${avatarFile.name}`;
      const url = await uploadFileSmart(storagePath, avatarFile);
      await updateUserProfile({ photoURL: url });
      setAvatarPreview(url);
      setAvatarFile(null);
      setAvatarFeedback({ type: 'success', msg: '✅ Foto profil berhasil diperbarui!' });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setAvatarFeedback({ type: 'error', msg: err.message || 'Gagal mengunggah foto profil.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handler: Banner Choose → open editor
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setBannerFeedback({ type: 'error', msg: 'Harap pilih file gambar (PNG/JPG/GIF).' });
        return;
      }
      setBannerEditorFile(file);
      setBannerFeedback(null);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleBannerEditorApply = (blob: Blob) => {
    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const ext = extMap[blob.type] ?? 'webp';
    const processed = new File([blob], `banner.${ext}`, { type: blob.type });
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(processed);
    setBannerPreview(URL.createObjectURL(blob));
    setBannerEditorFile(null);
  };

  const handleBannerEditorCancel = () => {
    setBannerEditorFile(null);
  };

  const handleUploadBanner = async () => {
    if (!bannerFile) {
      setBannerFeedback({ type: 'error', msg: 'Pilih file banner terlebih dahulu.' });
      return;
    }
    setBannerLoading(true);
    setBannerFeedback(null);
    try {
      const storagePath = `banners/${user.uid}/${Date.now()}_${bannerFile.name}`;
      const url = await uploadFileSmart(storagePath, bannerFile);
      await updateUserProfile({ bannerURL: url });
      setBannerPreview(url);
      setBannerFile(null);
      setBannerFeedback({ type: 'success', msg: '✅ Banner profil berhasil diperbarui!' });
    } catch (err: any) {
      console.error('Banner upload error:', err);
      setBannerFeedback({ type: 'error', msg: err.message || 'Gagal mengunggah banner.' });
    } finally {
      setBannerLoading(false);
    }
  };

  // Handler: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', msg: 'Masukkan kata sandi saat ini.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', msg: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordFeedback({ type: 'success', msg: 'Kata sandi berhasil diperbarui!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordFeedback({ type: 'error', msg: 'Kata sandi saat ini salah.' });
      } else {
        setPasswordFeedback({ type: 'error', msg: err.message || 'Gagal memperbarui kata sandi.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handler: Change Username
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameFeedback(null);

    const trimmed = newUsername.trim();
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!regex.test(trimmed)) {
      setUsernameFeedback({
        type: 'error',
        msg: 'Username harus 3-20 karakter dan hanya berisi huruf, angka, atau underscore (_).',
      });
      return;
    }

    setUsernameLoading(true);
    try {
      await updateUserProfile({ displayName: trimmed });
      setUsernameFeedback({ type: 'success', msg: 'Username berhasil diperbarui!' });
    } catch (err: any) {
      setUsernameFeedback({ type: 'error', msg: err.message || 'Gagal memperbarui username.' });
    } finally {
      setUsernameLoading(false);
    }
  };

  // Handler: Change Email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);

    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailFeedback({ type: 'error', msg: 'Masukkan alamat email yang valid.' });
      return;
    }
    if (trimmed === user.email) {
      setEmailFeedback({ type: 'error', msg: 'Email baru sama dengan email saat ini.' });
      return;
    }

    setEmailLoading(true);
    try {
      await updateUserEmail(trimmed, emailPassword || undefined);
      setEmailFeedback({ type: 'success', msg: 'Alamat email berhasil diperbarui!' });
      setEmailPassword('');
    } catch (err: any) {
      console.error('Email update error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setEmailFeedback({
          type: 'error',
          msg: 'Sesi login sudah lama. Harap isi kata sandi di bawah atau relogin terlebih dahulu.',
        });
      } else {
        setEmailFeedback({ type: 'error', msg: err.message || 'Gagal memperbarui email.' });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d1322',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card 1: Avatar */}
          <div
            style={{
              background: '#121929',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0,
                }}
              >
                <ImageIcon size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Avatar</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Upload a PNG or JPG image. Recommended: square, at least 256x256.
                </p>
              </div>
            </div>

            {(avatarPreview || user.photoURL) && (
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={avatarPreview || user.photoURL || ''}
                  alt="Avatar Preview"
                  style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-blue)' }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {avatarFile ? avatarFile.name : 'Foto profil aktif'}
                </span>
              </div>
            )}

            {avatarFeedback && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: avatarFeedback.type === 'success' ? '#4ade80' : '#f87171',
                  marginBottom: '10px',
                }}
              >
                {avatarFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {avatarFeedback.msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="pill-btn"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                <UploadIcon size={14} /> Choose file...
              </button>
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={avatarLoading}
                className="pill-btn active"
                style={{ fontSize: '0.82rem', padding: '6px 16px' }}
              >
                {avatarLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Card 2: Profile Banner */}
          <div
            style={{
              background: '#121929',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0,
                }}
              >
                <ImageIcon size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Profile Banner</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Upload a wide banner image. Recommended: 1200x300 or similar.
                </p>
              </div>
            </div>

            {(bannerPreview || userBanner) && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    height: '50px',
                    width: '100%',
                    borderRadius: '6px',
                    background: `url(${bannerPreview || userBanner}) center/cover no-repeat`,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>
            )}

            {bannerFeedback && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: bannerFeedback.type === 'success' ? '#4ade80' : '#f87171',
                  marginBottom: '10px',
                }}
              >
                {bannerFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {bannerFeedback.msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                ref={bannerInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleBannerFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="pill-btn"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                <UploadIcon size={14} /> Choose file...
              </button>
              <button
                type="button"
                onClick={handleUploadBanner}
                disabled={bannerLoading}
                className="pill-btn active"
                style={{ fontSize: '0.82rem', padding: '6px 16px' }}
              >
                {bannerLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Card 3: Change Password */}
          <form
            onSubmit={handleChangePassword}
            style={{
              background: '#121929',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0,
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Change Password</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Choose a strong password of at least 6 characters.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <input
                type="password"
                placeholder="Current password"
                className="input-clean"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ width: '100%' }}
              />
              <input
                type="password"
                placeholder="New password"
                className="input-clean"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%' }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                className="input-clean"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {passwordFeedback && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: passwordFeedback.type === 'success' ? '#4ade80' : '#f87171',
                  marginBottom: '10px',
                }}
              >
                {passwordFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {passwordFeedback.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="pill-btn active"
              style={{ fontSize: '0.82rem', padding: '7px 18px' }}
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          {/* Card 4: Change Username */}
          <form
            onSubmit={handleChangeUsername}
            style={{
              background: '#121929',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0,
                }}
              >
                <Edit3 size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Change Username</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  3-20 characters, letters, numbers, and underscores only.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="New username"
                className="input-clean"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={usernameLoading}
                className="pill-btn active"
                style={{ fontSize: '0.82rem', padding: '7px 20px' }}
              >
                {usernameLoading ? 'Saving...' : 'Save'}
              </button>
            </div>

            {usernameFeedback && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: usernameFeedback.type === 'success' ? '#4ade80' : '#f87171',
                }}
              >
                {usernameFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {usernameFeedback.msg}
              </div>
            )}
          </form>

          {/* Card 5: Change Email */}
          <form
            onSubmit={handleChangeEmail}
            style={{
              background: '#121929',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0,
                }}
              >
                <Mail size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Change Email</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Update the email address linked to your account.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="email"
                  placeholder="new@email.com"
                  className="input-clean"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="pill-btn active"
                  style={{ fontSize: '0.82rem', padding: '7px 20px' }}
                >
                  {emailLoading ? 'Saving...' : 'Save'}
                </button>
              </div>

              <input
                type="password"
                placeholder="Password (jika diminta re-otentikasi)"
                className="input-clean"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem' }}
              />
            </div>

            {emailFeedback && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: emailFeedback.type === 'success' ? '#4ade80' : '#f87171',
                }}
              >
                {emailFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {emailFeedback.msg}
              </div>
            )}
          </form>

        </div>
      </div>
    </div>

    {/* ── ImageCropEditor overlays (rendered outside the modal scroll container) ── */}
    {avatarEditorFile && (
      <ImageCropEditor
        file={avatarEditorFile}
        shape="circle"
        onApply={handleAvatarEditorApply}
        onCancel={handleAvatarEditorCancel}
      />
    )}
    {bannerEditorFile && (
      <ImageCropEditor
        file={bannerEditorFile}
        shape="rect"
        onApply={handleBannerEditorApply}
        onCancel={handleBannerEditorCancel}
      />
    )}
  </>
  );
};
