/**
 * 대시보드 데이터 소스.
 *
 * adminfront 의 `domains/<도메인>/application` 규칙을 따른다.
 * 실제 프로젝트라면 여기서 `infrastructure/*Api.js` 를 호출하지만,
 * 이 데모는 외부 의존 없이 돌아가야 하므로 결정적(seeded) 목 데이터를 만든다.
 *
 * 90일치를 한 번 만들고 기간 필터는 뒤에서 잘라 쓴다.
 * → 7일 창은 항상 30일 창의 부분집합이라 기간을 바꿔도 값이 흔들리지 않는다.
 */

const TOTAL_DAYS = 90;

export const RANGES = [
    { days: 7, label: '7일' },
    { days: 30, label: '30일' },
    { days: 90, label: '90일' },
];

const STATUS_LABEL = {
    good: '정상',
    warning: '주의',
    serious: '경고',
    critical: '심각',
};

// 결정적 난수 (mulberry32) — 새로고침해도 같은 값이 나온다.
function createRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let x = Math.imul(state ^ (state >>> 15), 1 | state);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

function dateBefore(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
}

function buildDays() {
    const random = createRandom(20260811);
    const days = [];

    for (let offset = TOTAL_DAYS - 1; offset >= 0; offset--) {
        const date = dateBefore(offset);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const elapsed = TOTAL_DAYS - 1 - offset;
        const trend = 1 + (elapsed / TOTAL_DAYS) * 0.45; // 완만한 우상향
        const weekendFactor = isWeekend ? 0.62 : 1;

        const web = Math.round(9200 * trend * weekendFactor * (0.88 + random() * 0.24));
        const mobile = Math.round(5400 * trend * weekendFactor * (0.9 + random() * 0.25));
        const errors = Math.round((web + mobile) * (0.004 + random() * 0.012));
        const latency = Math.round(210 + random() * 130 - elapsed * 0.25);
        const sessions = Math.round((web + mobile) * (0.31 + random() * 0.05));

        days.push({ date, web, mobile, errors, latency, sessions });
    }
    return days;
}

const ALL_DAYS = buildDays();

const sum = (rows, pick) => rows.reduce((acc, row) => acc + pick(row), 0);
const avg = (rows, pick) => (rows.length ? sum(rows, pick) / rows.length : 0);

/** 스탯 카드 스파크라인용 12포인트 균등 샘플링 */
function sampleSparkline(rows, pick, size = 12) {
    const count = Math.min(size, rows.length);
    const step = rows.length / count;
    return Array.from({ length: count }, (_, i) => pick(rows[Math.floor(i * step)]));
}

function pctDelta(current, previous) {
    if (previous == null || previous === 0) return null;
    return { kind: 'pct', value: ((current - previous) / previous) * 100 };
}

function pointDelta(current, previous) {
    if (previous == null) return null;
    return { kind: 'point', value: current - previous };
}

const SERVICES = [
    { name: '인증 API', weight: 1.0 },
    { name: '검색 API', weight: 0.78 },
    { name: '알림 발송', weight: 0.54 },
    { name: '결제 게이트웨이', weight: 0.41 },
    { name: '리포트 생성', weight: 0.23 },
    { name: '파일 업로드', weight: 0.15 },
];

const EVENTS = [
    { time: '11:42', service: '결제 게이트웨이', message: '외부 PG 응답 지연 (p95 2.4s)', status: 'serious', duration: '18분' },
    { time: '10:07', service: '검색 API', message: '인덱스 재구성 완료', status: 'good', duration: '6분' },
    { time: '08:55', service: '알림 발송', message: '재시도 큐 적체 3,200건', status: 'warning', duration: '41분' },
    { time: '03:20', service: '인증 API', message: '토큰 검증 5xx 급증 — 롤백 처리', status: 'critical', duration: '12분' },
    { time: '02:00', service: '리포트 생성', message: '일배치 정상 종료', status: 'good', duration: '34분' },
];

/**
 * @param {number} days RANGES 의 days 중 하나
 */
export function fetchDashboard(days) {
    const current = ALL_DAYS.slice(-days);
    const previous = ALL_DAYS.slice(-days * 2, -days);

    const totalRequests = sum(current, (d) => d.web + d.mobile);
    const prevRequests = previous.length ? sum(previous, (d) => d.web + d.mobile) : null;

    const totalErrors = sum(current, (d) => d.errors);
    const prevErrors = previous.length ? sum(previous, (d) => d.errors) : null;

    const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
    const prevSuccessRate = prevRequests ? ((prevRequests - prevErrors) / prevRequests) * 100 : null;

    const avgLatency = avg(current, (d) => d.latency);
    const prevLatency = previous.length ? avg(previous, (d) => d.latency) : null;

    const avgSessions = avg(current, (d) => d.sessions);
    const prevSessions = previous.length ? avg(previous, (d) => d.sessions) : null;

    const stats = [
        {
            key: 'requests',
            label: '총 요청 수',
            value: totalRequests,
            format: 'compact',
            delta: pctDelta(totalRequests, prevRequests),
            upIsGood: true,
            spark: sampleSparkline(current, (d) => d.web + d.mobile),
        },
        {
            key: 'sessions',
            label: '일평균 활성 세션',
            value: Math.round(avgSessions),
            format: 'compact',
            delta: pctDelta(avgSessions, prevSessions),
            upIsGood: true,
            spark: sampleSparkline(current, (d) => d.sessions),
        },
        {
            key: 'success',
            label: '요청 성공률',
            value: successRate,
            format: 'percent',
            delta: pointDelta(successRate, prevSuccessRate),
            upIsGood: true,
            spark: sampleSparkline(current, (d) => ((d.web + d.mobile - d.errors) / (d.web + d.mobile)) * 100),
        },
        {
            key: 'latency',
            label: '평균 응답시간',
            value: Math.round(avgLatency),
            format: 'ms',
            delta: pctDelta(avgLatency, prevLatency),
            upIsGood: false, // 응답시간은 내려가는 쪽이 좋다
            spark: sampleSparkline(current, (d) => d.latency),
        },
    ];

    const series = [
        {
            key: 'web',
            name: '웹',
            colorVar: '--series-1',
            points: current.map((d) => ({ date: d.date, value: d.web })),
        },
        {
            key: 'mobile',
            name: '모바일',
            colorVar: '--series-2',
            points: current.map((d) => ({ date: d.date, value: d.mobile })),
        },
    ];

    const services = SERVICES.map((service) => ({
        name: service.name,
        value: Math.round((totalRequests / days) * service.weight * 0.42),
    })).sort((a, b) => b.value - a.value);

    const events = EVENTS.map((event) => ({ ...event, statusLabel: STATUS_LABEL[event.status] }));

    return { stats, series, services, events, updatedAt: new Date() };
}
