# sample-dashboard

Vue 3 + Vite + SCSS 로 만든 **반응형 운영 대시보드 데모**.
`bb8-plex-adminfront` 의 프로젝트 구조·SCSS 관례를 따르고, 거기에 브레이크포인트 체계를 세워
모바일부터 데스크탑까지 한 코드로 대응한다.

외부 API 없이 동작한다 (결정적 목 데이터).

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # 빌드 결과 확인
```

`vite.config.js` 에 `server.host: true` 가 켜져 있어, 같은 네트워크의 폰에서
`http://<맥 IP>:5173` 으로 접속해 실제 기기 폭에서 확인할 수 있다.

## 배포 — Vercel

레포를 Vercel 프로젝트에 연결하면 끝이다. push 를 감지해 자동으로 빌드·배포한다.

1. [vercel.com/new](https://vercel.com/new) → 이 레포 Import
2. Framework Preset 이 **Vite** 로 잡히는지 확인 (빌드 `npm run build`, 출력 `dist`)
3. Deploy

`vercel.json` 이 SPA 폴백(`/(.*)` → `/index.html`)을 잡아둔다.
vue-router 가 history 모드라 이게 없으면 하위 경로에서 새로고침 시 404 가 난다.

- `main` 브랜치 push → 프로덕션 배포
- 그 외 브랜치·PR → 프리뷰 URL 자동 생성

> 서브 경로(예: GitHub Pages 의 `/<repo>/`)에 올릴 일이 생기면
> 빌드 시 `BASE_PATH=/<repo>/ npm run build` 만 주면 된다.

## 화면 구성

| 영역 | 내용 |
|---|---|
| 지표 카드 4개 | 총 요청 수 · 일평균 활성 세션 · 요청 성공률 · 평균 응답시간 (직전 동일 기간 대비 증감 + 스파크라인) |
| 라인 차트 | 채널별(웹/모바일) 일간 요청 수 — 크로스헤어 툴팁, 키보드 탐색, 표 대체 보기 |
| 가로 막대 | 서비스별 일평균 요청 |
| 이벤트 표 | 최근 운영 이벤트 — 좁은 화면에서 카드로 전환 |
| 공통 | 기간 필터(7/30/90일), 라이트·다크 테마 토글 |

차트는 라이브러리 없이 SVG/CSS 로 직접 그렸다. 번들에 chart.js 를 얹지 않는다.

## 구조

```
src/
├─ main.js                  진입점 (BaseIcon 전역 등록, 라우터, global.scss)
├─ App.vue
├─ router/                  vue-router (history 모드, BASE_URL 기준)
├─ layouts/
│   └─ DefaultLayout.vue    헤더 · 본문 · 푸터, 스킵 링크
├─ pages/
│   └─ DashboardPage.vue    화면 조립 + 그리드 배치
├─ components/              BaseIcon · StatCard · SparkLine · LineChart · BarChart · EventTable · RangeFilter · ThemeToggle
├─ composables/             useBreakpoint · useElementSize · useTheme
├─ domains/
│   └─ dashboard/application/dashboardService.js   데이터 소스 (실서비스라면 여기서 API 호출)
├─ shared/utils/format.js   숫자·날짜·축 눈금 포맷
└─ styles/                  _breakpoints · _variables · _mixins · _reset · global
```

`@` 는 `src` 별칭이다 (`vite.config.js`, `jsconfig.json`).

## 문서

- **[반응형 구조 가이드](docs/responsive-guide.md)** — 브레이크포인트 체계, 레이아웃 패턴,
  표→카드 전환, 테마 토큰, 새 화면 추가 체크리스트

## adminfront 와 다르게 한 것

| | adminfront | 여기 |
|---|---|---|
| 브레이크포인트 | 560/700/720/1080/1180px 이 파일마다 흩어짐 | `_breakpoints.scss` 5단계로 고정, JS 와 값 공유 |
| 색 토큰 | `--font-color-1..21`, `--background-color-1..43` | 의미 기반 이름 (`--font-color-strong`, `--surface-1` …) |
| 스타일 위치 | 대부분 `global.scss` (5,700줄) | 공통만 global, 나머지는 SFC `<style scoped lang="scss">` |
| 간격 유틸 | `m0`~`m50` 전부 생성 | 실제 쓰는 눈금만 생성 |

`font()` · `getRem()` · `card_box` · `ellipsis` · `scrollbar` 같은 믹스인 이름과
`.row` · `.col` · `.gap16` 유틸 클래스 규칙은 그대로 유지했다.
