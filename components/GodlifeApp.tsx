'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────
type CheckState = 'O' | 'X' | '';

interface DiaryEntry {
  emotion: string;
  text: string;
}

interface AppData {
  habits: string[];
  checks: Record<string, CheckState>;
  diaries: Record<string, DiaryEntry>;
}

// ─── Themes ──────────────────────────────────────────────────────────────────
interface Theme {
  name: string;
  swatch: string;
  appBg: string;
  noteBorder: string;
  divider: string;
  accent1: string;
  accent2: string;
  rowDivider: string;
}

const THEMES: Theme[] = [
  { name: '하늘', swatch: '#7ac4e8', appBg: '#e8f4fb', noteBorder: '#daeef8', divider: '#daeef8', accent1: '#7ac4e8', accent2: '#5aafd4', rowDivider: '#e8f2f8' },
  { name: '핑크', swatch: '#e89ec4', appBg: '#fbe8f4', noteBorder: '#f8daee', divider: '#f8daee', accent1: '#e89ec4', accent2: '#d47aaa', rowDivider: '#faeef6' },
  { name: '민트', swatch: '#7ac4a0', appBg: '#ebf4eb', noteBorder: '#daeedf', divider: '#daeedf', accent1: '#7ac4a0', accent2: '#5aad84', rowDivider: '#eaf6ec' },
  { name: '라벤더', swatch: '#a87ae8', appBg: '#f0ebf4', noteBorder: '#e4daee', divider: '#e4daee', accent1: '#a87ae8', accent2: '#8a5ad4', rowDivider: '#eeebf6' },
  { name: '피치', swatch: '#e8a87a', appBg: '#f4eeeb', noteBorder: '#eedada', divider: '#eedada', accent1: '#e8a87a', accent2: '#d4845a', rowDivider: '#f6eeea' },
  { name: '레몬', swatch: '#e8d84a', appBg: '#fafaeb', noteBorder: '#f0eaaa', divider: '#f0eaaa', accent1: '#d4c030', accent2: '#b8a820', rowDivider: '#f4f0cc' },
];

// ─── Constants ───────────────────────────────────────────────────────────────
const EMOTIONS = [
  { emoji: '🔥', label: '감동', bg: '#fff0d8' },
  { emoji: '😊', label: '좋음', bg: '#e8f8e8' },
  { emoji: '😐', label: '보통', bg: '#f0f0f8' },
  { emoji: '😔', label: '힘듦', bg: '#e0ecf8' },
  { emoji: '😴', label: '피곤', bg: '#f0eafc' },
];

const EMOTION_BG: Record<string, string> = {
  '🔥': '#fff0d8',
  '😊': '#e8f8e8',
  '😐': '#f0f0f8',
  '😔': '#e0ecf8',
  '😴': '#f0eafc',
};

const DEFAULT_HABITS = ['운동', '독서', '물 2L'];
const STORAGE_KEY = 'godlife-routine';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getDayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}
function dateKey(y: number, m: number, d: number) {
  return `${y}-${m}-${d}`;
}
function checkKey(y: number, m: number, d: number, idx: number) {
  return `${y}-${m}-${d}-${idx}`;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const DiaryIcon = ({ color = '#7ac4e8' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="14" height="14" rx="4" fill={color + '33'}/>
    <rect x="5" y="5.5" width="8" height="1.6" rx=".8" fill={color}/>
    <rect x="5" y="8.2" width="5.5" height="1.6" rx=".8" fill={color}/>
    <rect x="5" y="10.9" width="6.5" height="1.6" rx=".8" fill={color}/>
  </svg>
);

const HabitIcon = ({ color = '#7ac4e8' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="7" fill={color + '33'}/>
    <path d="M6 9.2l2.2 2.2 4.2-4.4" stroke={color} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const GraphIcon = ({ color = '#7ac4e8' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="11" width="3.5" height="5" rx="1.75" fill={color + '55'}/>
    <rect x="7.25" y="7.5" width="3.5" height="8.5" rx="1.75" fill={color + '88'}/>
    <rect x="12.5" y="4" width="3.5" height="12" rx="1.75" fill={color}/>
  </svg>
);

const MonkeyIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 왼쪽 귀 */}
    <ellipse cx="8.5" cy="22" rx="5.2" ry="5.5" fill="#c8834a" stroke="#7a4a20" strokeWidth="1.4" strokeLinecap="round"/>
    <ellipse cx="8.5" cy="22" rx="2.8" ry="3" fill="#e8a87a"/>
    {/* 오른쪽 귀 */}
    <ellipse cx="35.5" cy="22" rx="5.2" ry="5.5" fill="#c8834a" stroke="#7a4a20" strokeWidth="1.4" strokeLinecap="round"/>
    <ellipse cx="35.5" cy="22" rx="2.8" ry="3" fill="#e8a87a"/>
    {/* 얼굴 */}
    <ellipse cx="22" cy="21" rx="13.5" ry="14" fill="#d8934e" stroke="#7a4a20" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    {/* 입 주변 밝은 부분 */}
    <ellipse cx="22" cy="27" rx="7" ry="5" fill="#f0c090"/>
    {/* 왼쪽 눈 흰자 */}
    <ellipse cx="16.5" cy="19.5" rx="3" ry="3.2" fill="white" stroke="#7a4a20" strokeWidth="1"/>
    {/* 오른쪽 눈 흰자 */}
    <ellipse cx="27.5" cy="19.5" rx="3" ry="3.2" fill="white" stroke="#7a4a20" strokeWidth="1"/>
    {/* 왼쪽 눈동자 */}
    <ellipse cx="17" cy="20" rx="1.7" ry="1.9" fill="#1a0e06"/>
    {/* 오른쪽 눈동자 */}
    <ellipse cx="28" cy="20" rx="1.7" ry="1.9" fill="#1a0e06"/>
    {/* 눈 하이라이트 */}
    <circle cx="17.7" cy="19.2" r="0.6" fill="white"/>
    <circle cx="28.7" cy="19.2" r="0.6" fill="white"/>
    {/* 코 */}
    <ellipse cx="22" cy="25" rx="2" ry="1.3" fill="#7a4a20" opacity="0.7"/>
    {/* 콧구멍 */}
    <circle cx="21" cy="25.1" r="0.55" fill="#4a2800"/>
    <circle cx="23" cy="25.1" r="0.55" fill="#4a2800"/>
    {/* 입 */}
    <path d="M18 28.5 Q19.5 30.5 22 30.8 Q24.5 30.5 26 28.5" stroke="#7a4a20" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* 볼터치 */}
    <ellipse cx="13.5" cy="24" rx="2.5" ry="1.5" fill="#e8907a" opacity="0.4"/>
    <ellipse cx="30.5" cy="24" rx="2.5" ry="1.5" fill="#e8907a" opacity="0.4"/>
    {/* 머리털 몇 가닥 */}
    <path d="M15 8.5 Q16 6 18 7.5" stroke="#7a4a20" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M19 7 Q21 4.5 22 7" stroke="#7a4a20" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M23 7 Q26 5 26.5 8" stroke="#7a4a20" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="10" height="10" viewBox="0 0 10 10">
    <path d="M6.5 2L3.5 5l3 3" stroke="#888" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="10" height="10" viewBox="0 0 10 10">
    <path d="M3.5 2L6.5 5l-3 3" stroke="#888" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// ─── Achievement Graph ────────────────────────────────────────────────────────
function AchievementGraph({ year, month, habits, checks, accent1, accent2 }: {
  year: number; month: number; habits: string[]; checks: Record<string, CheckState>; accent1: string; accent2: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const daysInMonth = getDaysInMonth(year, month);
    const totalHabits = habits.length;
    if (totalHabits === 0) return;

    const padL = 28, padR = 12, padT = 12, padB = 22;
    const graphW = w - padL - padR;
    const graphH = h - padT - padB;

    // Grid lines
    const ySteps = Math.min(totalHabits, 4);
    ctx.strokeStyle = accent1 + 'aa';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ySteps; i++) {
      const y = padT + graphH - (i / ySteps) * graphH;
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + graphW, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Y-axis labels
    ctx.fillStyle = '#b0c8d4';
    ctx.font = '700 9px Nunito, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round((i / ySteps) * totalHabits);
      const y = padT + graphH - (i / ySteps) * graphH;
      ctx.fillText(String(val), padL - 4, y + 3);
    }

    // X-axis date labels (~8 labels)
    ctx.textAlign = 'center';
    const labelStep = Math.max(1, Math.floor(daysInMonth / 7));
    for (let d = 1; d <= daysInMonth; d += labelStep) {
      const x = padL + ((d - 1) / (daysInMonth - 1)) * graphW;
      ctx.fillStyle = '#b0c8d4';
      ctx.fillText(String(d), x, h - padB + 12);
    }

    // Compute daily achievement counts
    const points: { x: number; y: number; count: number; isToday: boolean; future: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const count = habits.reduce((acc, _, idx) => {
        const key = checkKey(year, month, d, idx);
        return acc + (checks[key] === 'O' ? 1 : 0);
      }, 0);
      const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;
      const future = year > today.getFullYear() ||
        (year === today.getFullYear() && month > today.getMonth() + 1) ||
        (year === today.getFullYear() && month === today.getMonth() + 1 && d > today.getDate());

      const xPos = padL + ((d - 1) / Math.max(daysInMonth - 1, 1)) * graphW;
      const yPos = padT + graphH - (count / totalHabits) * graphH;
      points.push({ x: xPos, y: yPos, count, isToday, future });
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = accent1;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    let started = false;
    for (const p of points) {
      if (p.future) continue;
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Draw dots
    for (const p of points) {
      if (p.future) {
        // Future: small gray dot
        ctx.beginPath();
        ctx.fillStyle = '#d8e8f0';
        ctx.arc(p.x, padT + graphH, 1.8, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      if (p.isToday) {
        // Today: larger with glow
        ctx.beginPath();
        ctx.fillStyle = accent1 + '44';
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = accent2;
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = accent1;
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [year, month, habits, checks, accent1, accent2]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function GodlifeApp({ userId, userEmail, userSwitcher }: { userId: string; userEmail?: string; userSwitcher?: React.ReactNode }) {
  const todayObj = new Date();
  const todayY = todayObj.getFullYear();
  const todayM = todayObj.getMonth() + 1;
  const todayD = todayObj.getDate();

  const [data, setData] = useState<AppData>({
    habits: DEFAULT_HABITS,
    checks: {},
    diaries: {},
  });
  const [year, setYear] = useState(todayY);
  const [month, setMonth] = useState(todayM);
  const [selectedDay, setSelectedDay] = useState<number | null>(todayD);

  // Modals
  const [diaryModal, setDiaryModal] = useState<{ y: number; m: number; d: number } | null>(null);
  const [diaryEmotion, setDiaryEmotion] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newHabit, setNewHabit] = useState('');

  // Mobile tab
  const [activeTab, setActiveTab] = useState<'diary' | 'habit'>('diary');

  // Theme
  const [themeIdx, setThemeIdx] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const theme = THEMES[themeIdx];

  // Scroll ref for today
  const todayRowRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const [dbLoaded, setDbLoaded] = useState(false);
  const serverDataRef = useRef<AppData | null>(null); // 서버에서 받은 데이터 보관
  const [nickname, setNickname] = useState('');
  const [nicknameModal, setNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  // Load from Supabase (+ localStorage fallback)
  useEffect(() => {
    const cacheKey = `godlife-cache-${userId}`;
    const themeKey = `godlife-theme-${userId}`;

    // 1. 캐시 즉시 적용
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setData(JSON.parse(cached));
      const cachedTheme = localStorage.getItem(themeKey);
      if (cachedTheme !== null) setThemeIdx(parseInt(cachedTheme));
    } catch {}

    // 닉네임 캐시 즉시 적용 (모달 깜빡임 방지)
    const cachedNickname = localStorage.getItem(`godlife-nickname-${userId}`) ?? '';
    if (cachedNickname) setNickname(cachedNickname);

    // 2. Supabase에서 최신 데이터 로드
    supabase
      .from('user_data')
      .select('habits, checks, diaries, theme_idx, nickname')
      .eq('user_id', userId)
      .single()
      .then(({ data: row, error }) => {
        if (error && error.code !== 'PGRST116') {
          // PGRST116 = row not found (정상), 그 외 에러는 로드 실패 → 저장 막기
          setDbLoaded(true);
          return;
        }
        if (row) {
          const loaded: AppData = {
            habits: row.habits ?? DEFAULT_HABITS,
            checks: row.checks ?? {},
            diaries: row.diaries ?? {},
          };
          serverDataRef.current = loaded; // 서버 데이터 보관
          setData(loaded);
          setThemeIdx(row.theme_idx ?? 0);
          const savedNickname = row.nickname ?? '';
          setNickname(savedNickname);
          localStorage.setItem(cacheKey, JSON.stringify(loaded));
          localStorage.setItem(themeKey, String(row.theme_idx ?? 0));
          if (savedNickname) {
            localStorage.setItem(`godlife-nickname-${userId}`, savedNickname);
          } else if (!cachedNickname) {
            setNicknameModal(true);
          }
        } else {
          // 첫 로그인 (row 없음) — default 데이터로 serverDataRef 초기화
          serverDataRef.current = { habits: DEFAULT_HABITS, checks: {}, diaries: {} };
          if (!cachedNickname) setNicknameModal(true);
        }
        setDbLoaded(true);
      });
  }, [userId]);

  const saveNickname = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    setNicknameModal(false);
    localStorage.setItem(`godlife-nickname-${userId}`, trimmed);
    supabase.from('user_data').upsert({
      user_id: userId,
      nickname: trimmed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  // Save to Supabase — 서버 데이터와 다를 때만 저장
  useEffect(() => {
    if (!dbLoaded) return;
    // 서버 로드 전이거나 실패했으면 저장 안 함 (덮어쓰기 방지)
    if (!serverDataRef.current) return;
    // 서버에서 받은 것과 동일하면 저장 안 함
    if (JSON.stringify(data) === JSON.stringify(serverDataRef.current)) return;
    const cacheKey = `godlife-cache-${userId}`;
    localStorage.setItem(cacheKey, JSON.stringify(data));
    const timer = setTimeout(() => {
      serverDataRef.current = data; // 저장 후 기준 업데이트
      supabase.from('user_data').upsert({
        user_id: userId,
        habits: data.habits,
        checks: data.checks,
        diaries: data.diaries,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }, 800);
    return () => clearTimeout(timer);
  }, [data, dbLoaded, userId]);

  useEffect(() => {
    if (!dbLoaded) return;
    const themeKey = `godlife-theme-${userId}`;
    localStorage.setItem(themeKey, String(themeIdx));
    supabase.from('user_data').upsert({
      user_id: userId,
      theme_idx: themeIdx,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [themeIdx, dbLoaded, userId]);

  // Scroll to today whenever month changes
  useEffect(() => {
    setTimeout(() => {
      if (year === todayY && month === todayM) {
        todayRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        // 다른 달이면 맨 위로
        todayRowRef.current?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);

  // ── Month navigation
  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  // ── Toggle check
  const toggleCheck = (day: number, habitIdx: number) => {
    const key = checkKey(year, month, day, habitIdx);
    setData(prev => {
      const cur = prev.checks[key] || '';
      const next: CheckState = cur === '' ? 'O' : cur === 'O' ? 'X' : '';
      const newChecks = { ...prev.checks };
      if (next === '') delete newChecks[key];
      else newChecks[key] = next;
      return { ...prev, checks: newChecks };
    });
  };

  // ── Open diary modal
  const openDiary = (day: number) => {
    const key = dateKey(year, month, day);
    const entry = data.diaries[key];
    setDiaryEmotion(entry?.emotion || '');
    setDiaryText(entry?.text || '');
    setDiaryModal({ y: year, m: month, d: day });
    setSelectedDay(day);
  };

  // ── Save diary
  const saveDiary = () => {
    if (!diaryModal) return;
    const key = dateKey(diaryModal.y, diaryModal.m, diaryModal.d);
    setData(prev => ({
      ...prev,
      diaries: { ...prev.diaries, [key]: { emotion: diaryEmotion, text: diaryText } },
    }));
    setDiaryModal(null);
  };

  // ── Add habit
  const addHabit = () => {
    const trimmed = newHabit.trim();
    if (!trimmed || data.habits.length >= 8) return;
    setData(prev => ({ ...prev, habits: [...prev.habits, trimmed] }));
    setNewHabit('');
    setShowHabitModal(false);
  };

  // ── Delete habit
  const deleteHabit = (index: number) => {
    setData(prev => {
      const newHabits = prev.habits.filter((_, i) => i !== index);
      const newChecks: Record<string, CheckState> = {};
      for (const [key, val] of Object.entries(prev.checks)) {
        const parts = key.split('-');
        if (parts.length < 4) continue;
        const hIdx = parseInt(parts[3]);
        if (hIdx === index) continue;
        const newIdx = hIdx > index ? hIdx - 1 : hIdx;
        newChecks[`${parts[0]}-${parts[1]}-${parts[2]}-${newIdx}`] = val;
      }
      return { ...prev, habits: newHabits, checks: newChecks };
    });
  };

  // ─── Diary Page (Left) ─────────────────────────────────────────────────────
  const diaryPage = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: `1.5px dashed ${theme.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DiaryIcon color={theme.accent1} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#3a3a3a' }}>일기</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft /></button>
          <span style={{ fontSize: 13, fontWeight: 800, color: theme.accent2, minWidth: 60, textAlign: 'center' }}>
            {year}.{String(month).padStart(2, '0')}
          </span>
          <button onClick={nextMonth} style={navBtnStyle}><ChevronRight /></button>
        </div>
      </div>

      {/* Date list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dow = getDayOfWeek(year, month, day);
          const isSat = dow === 6;
          const isSun = dow === 0;
          const isToday = year === todayY && month === todayM && day === todayD;
          const isSelected = selectedDay === day;
          const key = dateKey(year, month, day);
          const diary = data.diaries[key];
          const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

          return (
            <div
              key={day}
              ref={isToday ? todayRowRef : undefined}
              onClick={() => openDiary(day)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0 14px',
                height: 54,
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(160, 210, 240, 0.28)' : 'transparent',
                borderBottom: `1px dashed ${theme.rowDivider}`,
                transition: 'background-color 0.15s',
              }}
            >
              {/* Date + day */}
              <div style={{ width: 54, flexShrink: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 800,
                  color: isSun ? '#f0a8b8' : isSat ? '#90c0e0' : '#3a3a3a',
                  lineHeight: 1,
                }}>
                  {day}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#aaa', marginTop: 2 }}>
                  {dayNames[dow]}
                </div>
              </div>

              {/* Emotion badge */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                backgroundColor: diary?.emotion ? (EMOTION_BG[diary.emotion] || '#f0f0f0') : '#f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
                marginRight: 8,
              }}>
                {diary?.emotion || ''}
              </div>

              {/* Diary preview */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#aaa',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                flex: 1,
              }}>
                {diary?.text || ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Habit Page (Right) ────────────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    padding: '8px 4px 6px',
    fontSize: 11, fontWeight: 700, color: '#aaa',
    textAlign: 'center',
    borderBottom: `1px dashed ${theme.rowDivider}`,
    position: 'sticky', top: 0,
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(4px)',
  };

  const habitPage = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Habit Check - upper half */}
      <div style={{ flex: '0 0 55%', minHeight: 0, display: 'flex', flexDirection: 'column', borderBottom: `1.5px dashed ${theme.divider}`, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: `1.5px dashed ${theme.divider}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HabitIcon color={theme.accent1} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#3a3a3a' }}>습관 체크</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {data.habits.length > 0 && (
              <button
                onClick={() => setShowManageModal(true)}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#aaa',
                  background: 'none', border: `1px solid ${theme.noteBorder}`,
                  borderRadius: 8, padding: '3px 10px', cursor: 'pointer',
                }}
              >
                관리
              </button>
            )}
            {data.habits.length < 8 && (
              <button
                onClick={() => setShowHabitModal(true)}
                style={{
                  fontSize: 12, fontWeight: 700, color: theme.accent1,
                  background: 'none', border: `1px solid ${theme.noteBorder}`,
                  borderRadius: 8, padding: '3px 10px', cursor: 'pointer',
                }}
              >
                + 추가
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {data.habits.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 12, fontWeight: 600 }}>
              습관을 추가해보세요
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 38 }}></th>
                  {data.habits.map((habit, idx) => (
                    <th key={idx} style={thStyle}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa' }}>{habit}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const isToday = year === todayY && month === todayM && day === todayD;
                  const isSelected = selectedDay === day;
                  return (
                    <tr
                      key={day}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(160, 210, 240, 0.1)'
                          : isToday
                          ? 'rgba(160, 210, 240, 0.07)'
                          : 'transparent',
                      }}
                    >
                      <td style={{ ...tdStyle, fontSize: 11, fontWeight: 700, color: '#aaa', textAlign: 'center' }}>
                        {day}
                      </td>
                      {data.habits.map((_, habitIdx) => {
                        const key = checkKey(year, month, day, habitIdx);
                        const state = data.checks[key] || '';
                        return (
                          <td key={habitIdx} style={{ ...tdStyle, textAlign: 'center' }}>
                            <button
                              onClick={() => toggleCheck(day, habitIdx)}
                              style={{
                                width: 26, height: 26, borderRadius: '50%', border: 'none',
                                cursor: 'pointer',
                                backgroundColor: state === 'O' ? '#80c8a8' : state === 'X' ? '#f0a8a8' : '#e0e0e0',
                                color: state === 'O' ? '#fff' : state === 'X' ? '#fff' : '#bbb',
                                fontSize: 12, fontWeight: 700,
                                transition: 'background-color 0.15s',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              {state === 'O' ? '✓' : state === 'X' ? '✗' : '·'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Graph - lower half */}
      <div style={{ flex: '0 0 45%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 16px 10px',
          borderBottom: `1px dashed ${theme.rowDivider}`,
          flexShrink: 0,
        }}>
          <GraphIcon color={theme.accent1} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#3a3a3a' }}>달성률 그래프</span>
        </div>
        <div style={{ flex: 1, padding: '8px 12px 4px' }}>
          <AchievementGraph year={year} month={month} habits={data.habits} checks={data.checks} accent1={theme.accent1} accent2={theme.accent2} />
        </div>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.appBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 16px',
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ width: '90%', maxWidth: '90vw' }}>
        {/* App header */}
        <div style={{ marginBottom: 10 }}>
          {/* 제목 */}
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <span className="app-title" style={{ fontWeight: 400, color: '#3a3a3a', fontFamily: "'Jua', sans-serif", letterSpacing: '-0.5px' }}>
              {nickname ? `${nickname}의 ` : ''}{month}월 갓생 루틴 ✨
            </span>
          </div>
          {/* 컨트롤 버튼들 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
            <button
              onClick={() => { setNicknameInput(nickname); setNicknameModal(true); }}
              title="닉네임 변경"
              style={{
                background: 'none', border: `1.5px solid ${theme.noteBorder}`,
                borderRadius: 8, padding: '4px 10px',
                fontSize: 11, fontWeight: 700, color: '#aaa', cursor: 'pointer',
              }}
            >✏️ 닉네임</button>
            {userSwitcher}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowThemePicker(v => !v)}
                title="테마 변경"
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: `2px solid ${theme.noteBorder}`,
                  background: theme.accent1, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              {showThemePicker && (
                <div style={{
                  position: 'absolute', right: 0, top: 34,
                  background: '#fff', borderRadius: 16, border: `1.5px solid ${theme.noteBorder}`,
                  padding: '10px 12px', display: 'flex', gap: 8, zIndex: 50,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}>
                  {THEMES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setThemeIdx(i); setShowThemePicker(false); }}
                      title={t.name}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: i === themeIdx ? '2.5px solid #3a3a3a' : '2px solid transparent',
                        background: t.accent1, cursor: 'pointer',
                        outline: 'none', transition: 'transform 0.1s',
                        transform: i === themeIdx ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="mobile-tabs" style={{ display: 'none', marginBottom: 8, gap: 8 }}>
          <button
            onClick={() => setActiveTab('diary')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: activeTab === 'diary' ? theme.accent1 : '#fff',
              color: activeTab === 'diary' ? '#fff' : '#aaa',
            }}
          >
            일기
          </button>
          <button
            onClick={() => setActiveTab('habit')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: activeTab === 'habit' ? theme.accent1 : '#fff',
              color: activeTab === 'habit' ? '#fff' : '#aaa',
            }}
          >
            습관 & 그래프
          </button>
        </div>

        {/* Notebook */}
        <div
          className="notebook"
          style={{
            background: '#ffffff',
            backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
            backgroundSize: '20px 20px',
            borderRadius: 22,
            border: `1.5px solid ${theme.noteBorder}`,
            overflow: 'hidden',
            height: 'calc(100vh - 80px)',
            minHeight: 500,
            display: 'flex',
          }}
        >
          {/* Left page */}
          <div
            className="left-page"
            style={{
              flex: '0 0 40%',
              borderRight: `2px dashed ${theme.divider}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {diaryPage}
          </div>

          {/* Right page */}
          <div
            className="right-page"
            style={{
              flex: '0 0 60%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {habitPage}
          </div>
        </div>
      </div>

      {/* ── Diary Modal ────────────────────────────────────────────────────── */}
      {diaryModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDiaryModal(null); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16,
          }}
        >
          <div style={{
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
            backgroundSize: '20px 20px',
            borderRadius: 18, border: `1.5px solid ${theme.noteBorder}`,
            padding: 24, width: '100%', maxWidth: 420,
            boxShadow: '0 8px 32px rgba(120,190,230,0.15)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3a3a3a', marginBottom: 16 }}>
              {diaryModal.m}월 {diaryModal.d}일 일기
            </div>

            {/* Emotion buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {EMOTIONS.map(em => (
                <button
                  key={em.emoji}
                  onClick={() => setDiaryEmotion(diaryEmotion === em.emoji ? '' : em.emoji)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 12,
                    border: diaryEmotion === em.emoji ? `2px solid ${theme.accent1}` : '2px solid transparent',
                    background: em.bg, cursor: 'pointer',
                    fontSize: 18, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 2,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span>{em.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#aaa' }}>{em.label}</span>
                </button>
              ))}
            </div>

            {/* Text area */}
            <textarea
              value={diaryText}
              onChange={e => setDiaryText(e.target.value)}
              placeholder="오늘 하루는 어떠셨나요?"
              style={{
                width: '100%', minHeight: 120, resize: 'vertical',
                border: `1.5px solid ${theme.noteBorder}`, borderRadius: 12,
                padding: 12, fontSize: 13, fontWeight: 600, fontFamily: "'Nunito', sans-serif",
                color: '#3a3a3a', background: 'rgba(255,255,255,0.85)',
                outline: 'none',
              }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => setDiaryModal(null)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: `1.5px solid ${theme.noteBorder}`, background: '#fff',
                  fontSize: 12, fontWeight: 700, color: '#aaa', cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={saveDiary}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})`,
                  fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(90,175,212,0.3)',
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Habit Modal ────────────────────────────────────────────────────── */}
      {showHabitModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowHabitModal(false); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16,
          }}
        >
          <div style={{
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
            backgroundSize: '20px 20px',
            borderRadius: 18, border: `1.5px solid ${theme.noteBorder}`,
            padding: 24, width: '100%', maxWidth: 340,
            boxShadow: '0 8px 32px rgba(120,190,230,0.15)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3a3a3a', marginBottom: 16 }}>
              습관 추가
            </div>
            <input
              autoFocus
              value={newHabit}
              onChange={e => setNewHabit(e.target.value.slice(0, 8))}
              onKeyDown={e => { if (e.key === 'Enter') addHabit(); }}
              placeholder="습관 이름 (최대 8자)"
              style={{
                width: '100%', padding: '10px 14px',
                border: `1.5px solid ${theme.noteBorder}`, borderRadius: 12,
                fontSize: 13, fontWeight: 600, fontFamily: "'Nunito', sans-serif",
                color: '#3a3a3a', outline: 'none', background: 'rgba(255,255,255,0.85)',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowHabitModal(false); setNewHabit(''); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: `1.5px solid ${theme.noteBorder}`, background: '#fff',
                  fontSize: 12, fontWeight: 700, color: '#aaa', cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={addHabit}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})`,
                  fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(90,175,212,0.3)',
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nickname Modal ─────────────────────────────────────────────────── */}
      {nicknameModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
          <div style={{
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
            backgroundSize: '20px 20px',
            borderRadius: 18, border: `1.5px solid ${theme.noteBorder}`,
            padding: 28, width: '100%', maxWidth: 340,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#3a3a3a', marginBottom: 6 }}>닉네임 설정</div>
            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 16 }}>
              제목에 <b>{nicknameInput || '닉네임'}의 {month}월 갓생 루틴 ✨</b> 으로 표시돼요
            </div>
            <input
              autoFocus
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value.slice(0, 10))}
              onKeyDown={e => { if (e.key === 'Enter') saveNickname(nicknameInput); }}
              placeholder="닉네임 입력 (최대 10자)"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                border: `1.5px solid ${theme.noteBorder}`, fontSize: 13, fontWeight: 600,
                fontFamily: "'Nunito', sans-serif", color: '#3a3a3a', outline: 'none',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {nickname && (
                <button onClick={() => setNicknameModal(false)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: `1.5px solid ${theme.noteBorder}`, background: '#fff',
                  fontSize: 12, fontWeight: 700, color: '#aaa', cursor: 'pointer',
                }}>취소</button>
              )}
              <button onClick={() => saveNickname(nicknameInput)} style={{
                flex: 2, padding: '10px 0', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})`,
                fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Habits Modal ────────────────────────────────────────────── */}
      {showManageModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowManageModal(false); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: 16,
          }}
        >
          <div style={{
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #d0d8dc 1.1px, transparent 1.1px)',
            backgroundSize: '20px 20px',
            borderRadius: 18, border: `1.5px solid ${theme.noteBorder}`,
            padding: 24, width: '100%', maxWidth: 340,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3a3a3a', marginBottom: 16 }}>
              습관 관리
            </div>
            {data.habits.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, padding: '16px 0' }}>
                등록된 습관이 없어요
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {data.habits.map((habit, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 12,
                    background: theme.appBg, border: `1px solid ${theme.noteBorder}`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#3a3a3a' }}>{habit}</span>
                    <button
                      onClick={() => deleteHabit(idx)}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: '#f0a8a8', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: '#fff', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowManageModal(false)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                border: `1.5px solid ${theme.noteBorder}`, background: '#fff',
                fontSize: 12, fontWeight: 700, color: '#aaa', cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        .app-title { font-size: 32px; }

        @media (max-width: 768px) {
          .app-title { font-size: 20px !important; }
          .mobile-tabs { display: flex !important; }
          .notebook { display: block !important; height: calc(100vh - 150px) !important; }
          .left-page {
            display: ${activeTab === 'diary' ? 'flex' : 'none'} !important;
            flex: 1 !important;
            width: 100% !important;
            border-right: none !important;
            height: 100%;
          }
          .right-page {
            display: ${activeTab === 'habit' ? 'flex' : 'none'} !important;
            flex: 1 !important;
            width: 100% !important;
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const navBtnStyle2: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '3px 4px',
  borderBottom: '1px dashed #f0f6fa',
};
