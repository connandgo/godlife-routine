# 갓생 루틴 ✨

나만의 루틴 & 일기 노트 웹앱

## 소개

손글씨 루틴 노트를 디지털로 옮긴 웹앱입니다.  
매일 습관을 체크하고, 일기를 쓰고, 달성률을 그래프로 확인할 수 있어요.

## 주요 기능

- 📔 **일기** — 날짜별 감정 뱃지 + 일기 작성
- ✅ **습관 체크** — O / X / 미기록 3단계 토글
- 📈 **달성률 그래프** — Canvas 꺾은선 그래프로 월별 달성 현황 시각화
- 🎨 **테마** — 하늘 / 핑크 / 민트 / 라벤더 / 피치 / 레몬 6가지 컬러 테마
- 👤 **계정** — 이메일/비밀번호 + Google 소셜 로그인
- 📱 **PWA** — 모바일 홈 화면에 설치 가능
- 🔄 **실시간 저장** — Supabase 연동으로 어느 기기에서나 동기화

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | Tailwind CSS + Inline Styles |
| 폰트 | Nunito, Jua (Google Fonts) |
| 그래프 | Canvas API |
| 인증 / DB | Supabase |
| 배포 | Vercel |

## 로컬 실행

```bash
# 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에 Supabase URL과 anon key 입력

# 개발 서버 실행
npm run dev
```

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase DB 설정

```sql
create table user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  habits text[] default '{}',
  checks jsonb default '{}',
  diaries jsonb default '{}',
  theme_idx int default 0,
  nickname text default '',
  updated_at timestamptz default now()
);

alter table user_data enable row level security;

create policy "본인 데이터만 접근"
  on user_data for all
  using (auth.uid() = user_id);
```

## 라이브

[godlife-routine.vercel.app](https://godlife-routine.vercel.app)
