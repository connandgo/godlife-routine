'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import AuthPage from './AuthPage';
import GodlifeApp from './GodlifeApp';

const supabase = createClient();

export default function AppRoot() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#e8f4fb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Jua', sans-serif", fontSize: 20, color: '#7ac4e8',
      }}>
        갓생 루틴 ✨
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <GodlifeApp
      userId={user.id}
      userEmail={user.email}
      userSwitcher={
        <SignOutButton />
      }
    />
  );
}

function SignOutButton() {
  return (
    <button
      onClick={() => createClient().auth.signOut()}
      title="로그아웃"
      style={{
        background: 'none', border: '1.5px solid #daeef8',
        borderRadius: 8, padding: '4px 10px',
        fontSize: 11, fontWeight: 700, color: '#aaa',
        cursor: 'pointer',
      }}
    >
      로그아웃
    </button>
  );
}
