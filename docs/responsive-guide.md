# 반응형 구조 가이드

이 프로젝트가 화면 크기에 어떻게 대응하는지, 새 화면을 추가할 때 무엇을 지켜야 하는지 적는다.
`bb8-plex-adminfront` 의 SCSS 관례(토큰·믹스인·유틸 클래스)를 그대로 따르되,
거기에 없던 **브레이크포인트 체계**를 세우고 그 위에서 레이아웃을 구성했다.

---

## 1. 원칙

### 원칙 1 — 브레이크포인트는 마지막 수단이다

레이아웃이 꺾이는 지점을 손으로 정하기 시작하면 화면마다 값이 달라진다.
`bb8-plex-adminfront` 에는 `560px` `700px` `720px` `1080px` `1180px` `1400px` 이
서로 다른 파일에 흩어져 있고, 그래서 같은 앱인데 화면마다 다른 폭에서 접힌다.

먼저 **내용이 스스로 접히는 방법**을 쓴다.

| 하고 싶은 것 | 브레이크포인트 없이 |
|---|---|
| 카드 N열 → 좁아지면 줄이기 | `@include auto-grid(220px)` — 최소 폭만 정하고 열 수는 맡긴다 |
| 여백을 화면 크기에 맞추기 | `padding-inline: clamp(16px, 4vw, 32px)` |
| 제목 크기 조절 | `@include font-fluid(20, 26)` |
| 툴바가 넘치면 다음 줄로 | `display: flex; flex-wrap: wrap;` |
| 넓으면 2열, 좁으면 1열 | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))` |

`minmax(min(100%, 280px), 1fr)` 의 `min(100%, …)` 를 빼면
컨테이너가 280px 보다 좁을 때 그리드가 넘쳐 가로 스크롤이 생긴다. 반드시 같이 쓴다.

### 원칙 2 — 그래도 필요하면, 정해진 5단계만 쓴다

배치 자체가 달라져야 하는 경우(표 → 카드 전환처럼)에만 브레이크포인트를 쓴다.
값은 `src/styles/_breakpoints.scss` 한 곳에만 있다.

| 이름 | 폭 | 기준 기기 |
|---|---|---|
| `xs` | 480px | 모바일 세로 |
| `sm` | 640px | 모바일 가로 |
| `md` | 768px | 태블릿 세로 |
| `lg` | 1024px | 태블릿 가로 · 소형 랩탑 |
| `xl` | 1280px | 데스크탑 |

```scss
@use "@/styles/breakpoints" as *;

.foo {
    // 기본은 좁은 화면 기준 (모바일 퍼스트)
    grid-template-columns: 1fr;

    @include respond-up(lg) {
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    }
}
```

- `respond-up($name)` — **기본형.** 좁은 화면을 기본으로 쓰고 넓어질 때 얹는다
- `respond-down($name)` — 좁은 화면에서만 덮어써야 할 때 (표 → 카드)
- `respond-between($from, $to)` — 특정 구간만
- `hover` — 마우스가 있는 환경에서만 호버 효과 (터치에서 호버가 남는 문제 방지)

### 원칙 3 — JS 는 CSS 로 못 하는 것만 한다

차트의 **높이**, 축 **눈금 개수**처럼 CSS 로 표현할 수 없는 값만 JS 로 판단한다.

```js
const { isMobile, isTablet } = useBreakpoint();
const chartHeight = computed(() => (isMobile.value ? 200 : isTablet.value ? 240 : 300));
```

`useBreakpoint` 는 폭 값을 다시 적지 않고 `:root` 의 `--bp-*` 커스텀 프로퍼티를 읽는다.
이 값은 `_breakpoints.scss` 의 `export-breakpoints` 믹스인이 내보낸 것이라,
**SCSS 와 JS 가 항상 같은 지점에서 꺾인다.** 브레이크포인트를 바꿀 일이 생기면
SCSS 맵 한 곳만 고치면 된다.

### 원칙 4 — 컴포넌트는 뷰포트가 아니라 부모 폭에 반응한다

차트를 전체 폭에 두든 2단 중 한 칸에 두든 같은 컴포넌트가 맞아야 한다.
그래서 `LineChart` 는 미디어 쿼리를 보지 않고 `ResizeObserver` 로 **자기 부모 폭**을 잰다.

```js
const { el, width } = useElementSize();
const narrow = width.value < 480;   // 뷰포트가 아니라 이 차트가 좁은가
```

여백·눈금 개수·끝점 라벨 표시 여부를 전부 이 값으로 정한다.

> SVG 를 `viewBox` 로 늘리는 방식은 쓰지 않는다. 선 두께와 글자까지 같이 늘어나 흐려진다.
> 폭을 재서 좌표를 다시 계산한다.

### 원칙 5 — 가로 스크롤은 버그다

페이지 몸통이 가로로 밀리면 안 된다. 넘치는 요소는 **자기 안에서** 스크롤한다.

```scss
.table-scroll {
    overflow-x: auto;
    @include scrollbar;
}
```

`body { overflow-x: hidden }` 은 안전망이지 해결책이 아니다. 넘치는 원인을 따로 처리한다.

---

## 2. 레이아웃 패턴

### 2.1 페이지 컨테이너

```html
<div class="page-container">…</div>
```

`max-width: 1360px` + `padding-inline: clamp(16px, 4vw, 32px)`.
좌우 여백이 브레이크포인트로 꺾이지 않고 연속적으로 변한다.

### 2.2 지표 카드 그리드

```scss
.dashboard__stats {
    @include auto-grid(220px, 16px);
}
```

미디어 쿼리 0개로 데스크탑 4열 → 태블릿 2열 → 모바일 1열이 나온다.
카드가 읽히는 최소 폭(220px)만 정했기 때문이다.

### 2.3 본문 2단 (8:4)

```scss
.dashboard__main {
    display: grid;
    grid-template-columns: 1fr;          // 기본: 1열
    align-items: start;                  // 짧은 카드 아래를 늘리지 않는다
    @include respond-up(lg) {
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    }
}
```

`minmax(0, 2fr)` 의 `0` 이 중요하다. 기본값 `auto` 로 두면 안쪽 콘텐츠(표·긴 텍스트)가
칸을 밀어 그리드가 넘친다.

### 2.4 표 → 카드 전환 (`EventTable`)

좁은 화면에서 표를 가로 스크롤시키면 열 제목이 시야에서 사라져 값의 의미를 잃는다.
`md` 미만에서는 행 단위 카드로 바꾸고, 각 셀이 `data-label` 로 자기 열 제목을 들고 다닌다.

```html
<td data-label="서비스">결제 게이트웨이</td>
```

```scss
@include respond-down(md) {
    thead { /* 시각적으로만 숨긴다 — 스크린리더는 계속 읽는다 */ }
    td::before { content: attr(data-label); }
}
```

`display: none` 이 아니라 `clip-path` 로 숨기는 이유는, 표의 헤더-셀 관계가
보조기기에서 유지돼야 하기 때문이다.

### 2.5 막대 차트의 라벨 자리 (`BarChart`)

`sm` 미만에서는 이름을 막대 왼쪽이 아니라 **위로** 올린다.
이름 칸을 계속 줄이면 전부 말줄임돼 읽을 수 없다.
`grid-template-areas` 로 배치만 바꾸고 마크업은 그대로 둔다.

---

## 3. 테마

라이트가 기본이고 다크는 두 경로로 들어온다.

1. OS 설정 — `@media (prefers-color-scheme: dark)`
2. 화면의 토글 — `html[data-theme="dark"]` (localStorage 에 저장, OS 설정을 이긴다)

```scss
:root { @include emit-tokens($theme-light); }

@media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme="light"])) { @include emit-tokens($theme-dark); }
}

:root[data-theme="dark"] { @include emit-tokens($theme-dark); }
```

`:not([data-theme="light"])` 가드가 있어야 OS 가 다크여도 사용자가 고른 라이트가 이긴다.
`:where()` 로 감싸 특정도를 0 으로 만들어, 토글 선택자가 항상 위에 온다.

첫 페인트 전에 `index.html` 의 인라인 스크립트가 저장값을 읽어 속성을 붙인다(FOUC 방지).

### 색을 바꿀 때

차트 시리즈 색은 임의로 고르지 않았다. 두 계열이 **색각 이상 상태에서도 구분되고**
배경 대비 3:1 이상인지 검증한 값이다.

| | 라이트 | 다크 |
|---|---|---|
| series-1 | `#2a78d6` | `#3987e5` |
| series-2 | `#eb6834` | `#d95926` |
| 인접 CVD ΔE | 24.7 | 26.8 |
| 일반 시야 ΔE | 33.6 | 31.8 |

바꿀 때는 같은 기준을 다시 확인한다. 그리고 **상태를 색만으로 표시하지 않는다** —
`EventTable` 의 상태 배지는 항상 아이콘 + 글자를 함께 쓴다.

---

## 4. 접근성 (반응형과 같이 딸려오는 것들)

| 항목 | 어디서 |
|---|---|
| 터치 타겟 최소 높이 36~44px | `@include touch-target`, `RangeFilter` |
| 포커스 링 | `@include focus-ring` — 모든 인터랙티브 요소 |
| 본문 바로가기 링크 | `DefaultLayout` 의 `.skip-link` |
| 차트 키보드 탐색 | `LineChart` — ←/→ 로 값 이동, Esc 로 해제 |
| 차트 대체 표현 | `LineChart` 의 `표로 보기` |
| 모션 최소화 | `_reset.scss` 의 `prefers-reduced-motion` |
| 모바일 주소창 높이 | `min-height: 100dvh` (`100vh` 는 잘린다) |

`body` 에 `height: 100%` 를 주지 않는다. `overflow-x: hidden` 과 만나면
body 가 뷰포트 높이의 스크롤 박스가 되어 **문서 스크롤이 죽는다.**
전체 높이는 `DefaultLayout` 이 `min-height: 100dvh` 로 잡는다.

---

## 5. 새 화면을 추가할 때 체크리스트

- [ ] 열 수를 고정하지 않았는가 — `auto-grid` 또는 `auto-fit` 을 먼저 검토했는가
- [ ] 미디어 쿼리를 썼다면 `_breakpoints.scss` 의 5단계 중 하나인가 (임의 px 금지)
- [ ] `respond-up` 기준으로 썼는가 (모바일 퍼스트)
- [ ] 320px 폭에서 가로 스크롤이 생기지 않는가
- [ ] 그리드 칸에 `minmax(0, …)` 을 줬는가 (내용이 칸을 밀지 않도록)
- [ ] 표가 있다면 좁은 화면에서 어떻게 되는가 (가로 스크롤 / 카드 전환 중 택1)
- [ ] 라이트·다크 양쪽에서 확인했는가
- [ ] 색 하나만으로 의미를 전달하는 곳이 없는가
- [ ] 키보드만으로 조작 가능한가, 포커스가 보이는가

### 실제 기기 폭에서 확인하는 법

```bash
npm run dev   # host: true 라서 같은 네트워크의 폰에서 http://<맥 IP>:5173 으로 접속된다
```

Vercel 에 연결돼 있으면 브랜치를 push 할 때마다 프리뷰 URL 이 생기므로,
그 링크를 폰에서 열어 확인하는 방법도 있다.

브라우저 창을 줄이는 것만으로는 터치 동작·주소창 높이 변화를 못 본다.

---

## 6. 파일 지도

```
src/styles/
├─ _breakpoints.scss   브레이크포인트 SSOT + respond-up/down/between, hover 믹스인
├─ _variables.scss     치수 상수, 테마 토큰 맵(라이트/다크/상태), font()/getRem/font-fluid
├─ _mixins.scss        card_box, ellipsis, scrollbar, auto-grid, focus-ring, touch-target
├─ _reset.scss         리셋 + prefers-reduced-motion
└─ global.scss         테마 토큰 출력, 문서 기본, 레이아웃 컨테이너, 유틸 클래스
```

> `_variables.scss` 는 값만 들고 있고 CSS 를 내보내지 않는다.
> 각 SFC 가 이 파티션을 `@use` 하므로, 파티션이 CSS 를 내보내면 컴포넌트 수만큼 복제된다.
> 실제 `:root { … }` 출력은 `global.scss` 가 `@include emit-theme` 로 **한 번만** 한다.
