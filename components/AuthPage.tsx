'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

type Mode = 'login' | 'signup' | 'reset';

const supabase = createClient();

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: '가입 확인 이메일을 보냈어요! 메일을 확인해주세요.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '오류가 발생했어요';
      setMessage({ type: 'error', text: translateError(msg) });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: '비밀번호 재설정 이메일을 보냈어요!' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '오류가 발생했어요';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const providerBtns = [
    {
      key: 'google' as const,
      label: 'Google로 계속하기',
      bg: '#fff',
      color: '#3a3a3a',
      border: '#e0e0e0',
      icon: (
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#e8f4fb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif", padding: 24,
    }}>
      <div style={{
        background: '#fff',
        backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
        backgroundSize: '20px 20px',
        borderRadius: 24, border: '1.5px solid #daeef8',
        padding: '36px 32px', width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(120,190,230,0.15)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, fontFamily: "'Jua', sans-serif", color: '#3a3a3a', marginBottom: 4 }}>
            갓생 루틴 ✨
          </div>
          <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>
            {mode === 'login' && '로그인하고 루틴을 시작해요'}
            {mode === 'signup' && '계정을 만들어 루틴을 시작해요'}
            {mode === 'reset' && '비밀번호를 재설정해요'}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: message.type === 'error' ? '#fff0f0' : '#f0fff4',
            border: `1px solid ${message.type === 'error' ? '#f0a8a8' : '#80c8a8'}`,
            fontSize: 12, fontWeight: 600,
            color: message.type === 'error' ? '#c05050' : '#3a8a5a',
          }}>
            {message.text}
          </div>
        )}

        {/* Email + Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && mode !== 'reset') handleEmailAuth(); }}
            style={inputStyle}
          />
          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailAuth(); }}
              style={inputStyle}
            />
          )}
        </div>

        {/* Main button */}
        <button
          onClick={mode === 'reset' ? handleReset : handleEmailAuth}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
            background: loading ? '#b8e0f4' : 'linear-gradient(135deg, #7ac4e8, #5aafd4)',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            marginBottom: 12, transition: 'opacity 0.15s',
          }}
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : mode === 'signup' ? '회원가입' : '재설정 이메일 보내기'}
        </button>

        {/* Mode switch */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20, fontSize: 12, fontWeight: 600 }}>
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); setMessage(null); }} style={textBtnStyle}>로그인</button>
          )}
          {mode !== 'signup' && (
            <button onClick={() => { setMode('signup'); setMessage(null); }} style={textBtnStyle}>회원가입</button>
          )}
          {mode !== 'reset' && (
            <button onClick={() => { setMode('reset'); setMessage(null); }} style={textBtnStyle}>비밀번호 찾기</button>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e8f0f4' }} />
          <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#e8f0f4' }} />
        </div>

        {/* OAuth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {providerBtns.map(btn => (
            <button
              key={btn.key}
              onClick={() => handleOAuth(btn.key)}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', borderRadius: 12,
                border: `1.5px solid ${btn.border}`,
                background: btn.bg, color: btn.color,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요';
  if (msg.includes('Email not confirmed')) return '이메일 인증을 먼저 완료해주세요';
  if (msg.includes('User already registered')) return '이미 가입된 이메일이에요';
  if (msg.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 해요';
  return msg;
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px', borderRadius: 12,
  border: '1.5px solid #daeef8', fontSize: 13, fontWeight: 600,
  fontFamily: "'Nunito', sans-serif", color: '#3a3a3a', outline: 'none',
  background: 'rgba(255,255,255,0.9)', width: '100%',
};

const textBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#7ac4e8', fontSize: 12, fontWeight: 700,
  textDecoration: 'underline',
};
