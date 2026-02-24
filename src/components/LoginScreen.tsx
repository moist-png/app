import React, { useState } from 'react';
import { User } from '../types';
import {
  authenticateUser,
  registerUser,
  loginAsGuest,
  validateOrgInviteCode,
  getOrganizationById,
} from '../utils/auth';
import { TreePine, Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Key, Building2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User, isGuest: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Guest flow
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestInviteCode, setGuestInviteCode] = useState('');
  const [guestCodeError, setGuestCodeError] = useState<string | null>(null);

  // Live org preview when typing invite code during registration
  const resolvedOrgId = validateOrgInviteCode(inviteCode);
  const resolvedOrg = resolvedOrgId ? getOrganizationById(resolvedOrgId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        const user = authenticateUser(email, password);
        if (user) {
          onLogin(user, false);
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (!name.trim()) { setError('Name is required'); return; }
        if (!inviteCode.trim()) { setError('Invite code is required'); return; }
        const user = registerUser(email, password, name.trim(), inviteCode.trim());
        onLogin(user, false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestInviteCode('');
    setGuestCodeError(null);
    setShowGuestPrompt(true);
  };

  const handleGuestSubmit = () => {
    const orgId = validateOrgInviteCode(guestInviteCode.trim());
    if (!orgId) {
      setGuestCodeError('Invalid invite code. Ask your organization admin for one.');
      return;
    }
    const guestUser = loginAsGuest(orgId);
    onLogin(guestUser, true);
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isFormValid = () => {
    if (!email || !password) return false;
    if (!validateEmail(email)) return false;
    if (!isLogin && (!name.trim() || !inviteCode.trim())) return false;
    return true;
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--forest)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 60% at 70% 50%, rgba(61,107,61,0.12) 0%, transparent 70%)' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--canopy), var(--forest-light))',
            border: '1px solid var(--border-bright)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <TreePine size={32} color="var(--leaf)" />
          </div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            ArborPro
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Professional arborist management platform</p>
        </div>

        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

          {/* Guest invite-code prompt overlay */}
          {showGuestPrompt ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Building2 size={32} color="var(--leaf)" style={{ margin: '0 auto 8px' }} />
                <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>Guest Access</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Enter your organization's invite code to access in read-only mode.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={guestInviteCode}
                    onChange={e => { setGuestInviteCode(e.target.value); setGuestCodeError(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleGuestSubmit()}
                    placeholder="Enter invite code"
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                    autoFocus
                  />
                </div>
                {guestCodeError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(180,60,60,0.1)', border: '1px solid rgba(180,60,60,0.25)', color: '#e88', fontSize: '13px' }}>
                    <AlertCircle size={14} />{guestCodeError}
                  </div>
                )}
                <button
                  onClick={handleGuestSubmit}
                  disabled={!guestInviteCode.trim()}
                  style={{
                    padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
                    cursor: guestInviteCode.trim() ? 'pointer' : 'not-allowed',
                    background: guestInviteCode.trim() ? 'var(--canopy)' : 'var(--surface-overlay)',
                    border: guestInviteCode.trim() ? '1px solid var(--moss)' : '1px solid var(--border)',
                    color: guestInviteCode.trim() ? 'var(--cream)' : 'var(--text-muted)',
                  }}
                >
                  Continue as Guest
                </button>
                <button
                  onClick={() => setShowGuestPrompt(false)}
                  style={{ padding: '10px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', marginBottom: '28px', background: 'var(--forest)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border)' }}>
                {(['Sign In', 'Register'] as const).map((label, i) => (
                  <button key={label} onClick={() => { setIsLogin(i === 0); setError(null); }} style={{
                    flex: 1, padding: '8px', borderRadius: '7px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                    background: (i === 0) === isLogin ? 'var(--surface-overlay)' : 'transparent',
                    border: (i === 0) === isLogin ? '1px solid var(--border-bright)' : '1px solid transparent',
                    color: (i === 0) === isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>{label}</button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!isLogin && (
                  <div>
                    <label>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="input-field" style={{ paddingLeft: '38px' }} />
                    </div>
                  </div>
                )}
                <div>
                  <label>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" style={{ paddingLeft: '38px' }} />
                  </div>
                </div>
                <div>
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" style={{ paddingLeft: '38px', paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {!isLogin && (
                  <div>
                    <label>Invite Code</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={e => setInviteCode(e.target.value)}
                        placeholder="Enter invite code"
                        className="input-field"
                        style={{ paddingLeft: '38px' }}
                      />
                    </div>
                    {/* Live org preview */}
                    {inviteCode.trim() && (
                      <div style={{
                        marginTop: '6px', padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: resolvedOrg ? 'rgba(74,157,74,0.12)' : 'rgba(180,60,60,0.1)',
                        border: `1px solid ${resolvedOrg ? 'rgba(74,157,74,0.3)' : 'rgba(180,60,60,0.25)'}`,
                        color: resolvedOrg ? '#86efac' : '#e88',
                      }}>
                        <Building2 size={13} />
                        {resolvedOrg
                          ? <>You're joining: <strong>{resolvedOrg.name}</strong></>
                          : 'Invalid invite code'
                        }
                      </div>
                    )}
                  </div>
                )}
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(180,60,60,0.1)', border: '1px solid rgba(180,60,60,0.25)', color: '#e88', fontSize: '13px' }}>
                    <AlertCircle size={14} />{error}
                  </div>
                )}
                <button type="submit" disabled={!isFormValid() || isLoading} style={{
                  padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', marginTop: '4px',
                  cursor: isFormValid() && !isLoading ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                  background: isFormValid() && !isLoading ? 'var(--canopy)' : 'var(--surface-overlay)',
                  border: isFormValid() && !isLoading ? '1px solid var(--moss)' : '1px solid var(--border)',
                  color: isFormValid() && !isLoading ? 'var(--cream)' : 'var(--text-muted)',
                }}>
                  {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              <button onClick={handleGuestLogin} style={{
                width: '100%', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', transition: 'all 0.2s', background: 'transparent',
                border: '1px solid var(--border)', color: 'var(--text-secondary)'
              }}>
                Continue as Guest (Read Only)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
