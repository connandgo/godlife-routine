'use client';

import { useState, useEffect } from 'react';
import GodlifeApp from './GodlifeApp';

export interface UserProfile {
  id: string;
  name: string;
}

const USERS_KEY = 'godlife-users';
const CURRENT_KEY = 'godlife-current';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#7ac4e8', '#e89ec4', '#7ac4a0', '#a87ae8', '#e8a87a',
  '#e8d47a', '#7ab4e8', '#c4a87a',
];

function avatarColor(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function Avatar({ name, id, size = 36 }: { name: string; id: string; size?: number }) {
  const bg = avatarColor(id);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 800, color: '#fff',
      fontFamily: "'Jua', sans-serif",
      flexShrink: 0, userSelect: 'none',
    }}>
      {name.charAt(0)}
    </div>
  );
}

// ─── User Select Screen ───────────────────────────────────────────────────────
function UserSelectScreen({ users, onSelect, onAdd }: {
  users: UserProfile[];
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
    setAdding(false);
  };

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
        padding: 36, width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(120,190,230,0.15)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, fontFamily: "'Jua', sans-serif", fontWeight: 400, color: '#3a3a3a', marginBottom: 6 }}>
          갓생 루틴 ✨
        </div>
        <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600, marginBottom: 28 }}>
          누구의 루틴인가요?
        </div>

        {/* User list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => onSelect(u.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 14,
                border: '1.5px solid #daeef8', background: '#f8fcff',
                cursor: 'pointer', transition: 'background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#edf6fc')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f8fcff')}
            >
              <Avatar name={u.name} id={u.id} size={40} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#3a3a3a', fontFamily: "'Jua', sans-serif" }}>
                {u.name}
              </span>
            </button>
          ))}
        </div>

        {/* Add user */}
        {adding ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value.slice(0, 12))}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
              placeholder="이름 입력 (최대 12자)"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: '1.5px solid #daeef8', fontSize: 13, fontWeight: 600,
                fontFamily: "'Nunito', sans-serif", outline: 'none', color: '#3a3a3a',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: '10px 16px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #7ac4e8, #5aafd4)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 12,
              border: '1.5px dashed #b8e0f4', background: 'transparent',
              fontSize: 13, fontWeight: 700, color: '#7ac4e8', cursor: 'pointer',
              marginTop: 4,
            }}
          >
            + 새 사용자 추가
          </button>
        )}
      </div>
    </div>
  );
}

// ─── User Switcher (in-app) ───────────────────────────────────────────────────
export function UserSwitcher({ currentUser, users, onSwitch, onAdd, onDelete }: {
  currentUser: UserProfile;
  users: UserProfile[];
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
    setAdding(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        title="사용자 전환"
      >
        <Avatar name={currentUser.name} id={currentUser.id} size={34} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => { setOpen(false); setAdding(false); setName(''); }}
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
          />
          <div style={{
            position: 'absolute', right: 0, top: 42,
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
            backgroundSize: '20px 20px',
            borderRadius: 16, border: '1.5px solid #daeef8',
            padding: 12, minWidth: 200, zIndex: 50,
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', marginBottom: 8, paddingLeft: 4 }}>
              사용자 전환
            </div>

            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button
                  onClick={() => { onSwitch(u.id); setOpen(false); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    border: u.id === currentUser.id ? '1.5px solid #7ac4e8' : '1.5px solid transparent',
                    background: u.id === currentUser.id ? '#f0f9ff' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar name={u.name} id={u.id} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#3a3a3a' }}>{u.name}</span>
                  {u.id === currentUser.id && (
                    <span style={{ fontSize: 10, color: '#7ac4e8', fontWeight: 700, marginLeft: 'auto' }}>현재</span>
                  )}
                </button>
                {users.length > 1 && (
                  <button
                    onClick={() => onDelete(u.id)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#fce8e8', border: 'none', cursor: 'pointer',
                      fontSize: 11, color: '#e08080', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >×</button>
                )}
              </div>
            ))}

            <div style={{ borderTop: '1px dashed #daeef8', marginTop: 8, paddingTop: 8 }}>
              {adding ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value.slice(0, 12))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                    placeholder="이름"
                    style={{
                      flex: 1, padding: '6px 10px', borderRadius: 8,
                      border: '1.5px solid #daeef8', fontSize: 12, fontWeight: 600,
                      fontFamily: "'Nunito', sans-serif", outline: 'none',
                    }}
                  />
                  <button onClick={handleAdd} style={{
                    padding: '6px 10px', borderRadius: 8, border: 'none',
                    background: '#7ac4e8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>+</button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  style={{
                    width: '100%', padding: '7px 0', borderRadius: 10,
                    border: '1.5px dashed #b8e0f4', background: 'transparent',
                    fontSize: 12, fontWeight: 700, color: '#7ac4e8', cursor: 'pointer',
                  }}
                >
                  + 새 사용자
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── UserGate ─────────────────────────────────────────────────────────────────
export default function UserGate() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const savedCurrent = localStorage.getItem(CURRENT_KEY);
      setUsers(savedUsers);
      if (savedCurrent && savedUsers.find(u => u.id === savedCurrent)) {
        setCurrentId(savedCurrent);
      }
    } catch {}
    setLoaded(true);
  }, []);

  const saveUsers = (updated: UserProfile[]) => {
    setUsers(updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  const addUser = (name: string) => {
    const id = generateId();
    const updated = [...users, { id, name }];
    saveUsers(updated);
    selectUser(id);
  };

  const selectUser = (id: string) => {
    setCurrentId(id);
    localStorage.setItem(CURRENT_KEY, id);
  };

  const deleteUser = (id: string) => {
    // Delete user data
    localStorage.removeItem(`godlife-routine-${id}`);
    localStorage.removeItem(`godlife-routine-${id}-theme`);
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    if (currentId === id) {
      const next = updated[0];
      if (next) selectUser(next.id);
      else setCurrentId(null);
    }
  };

  const switchUser = (id: string) => selectUser(id);

  if (!loaded) return null;

  const currentUser = users.find(u => u.id === currentId) ?? null;

  if (!currentUser) {
    return (
      <UserSelectScreen
        users={users}
        onSelect={selectUser}
        onAdd={addUser}
      />
    );
  }

  return (
    <GodlifeApp
      userId={currentUser.id}
      userSwitcher={
        <UserSwitcher
          currentUser={currentUser}
          users={users}
          onSwitch={switchUser}
          onAdd={addUser}
          onDelete={deleteUser}
        />
      }
    />
  );
}
