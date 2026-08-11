const nf = new Intl.NumberFormat('ko-KR');

export function formatNumber(value) {
    return nf.format(Math.round(value));
}

/** 좁은 화면·축 눈금용 축약 표기 (12,900 → 12.9K) */
export function formatCompact(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 10_000) return `${(value / 1000).toFixed(1)}K`;
    return nf.format(Math.round(value));
}

export function formatValue(value, format) {
    switch (format) {
        case 'compact':
            return formatCompact(value);
        case 'percent':
            return `${value.toFixed(2)}%`;
        case 'ms':
            return `${nf.format(Math.round(value))}ms`;
        default:
            return nf.format(value);
    }
}

/** 증감 표기. 부호는 −(U+2212) 를 써서 하이픈과 구분한다. */
export function formatDelta(delta) {
    if (!delta) return null;
    const sign = delta.value > 0 ? '+' : delta.value < 0 ? '−' : '';
    const abs = Math.abs(delta.value);
    return delta.kind === 'pct' ? `${sign}${abs.toFixed(1)}%` : `${sign}${abs.toFixed(2)}p`;
}

export function formatDate(date, { withYear = false } = {}) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return withYear ? `${date.getFullYear()}.${month}.${day}` : `${month}/${day}`;
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDateLong(date) {
    return `${formatDate(date, { withYear: true })} (${WEEKDAY[date.getDay()]})`;
}

/**
 * 축 눈금 — 사람이 읽기 좋은 값(1/2/5 배수)으로 올린 상한과 눈금 배열.
 * @param {number} max 데이터 최댓값
 * @param {number} count 목표 눈금 개수 (좁은 화면에서는 줄여 부른다)
 */
export function niceTicks(max, count = 4) {
    if (max <= 0) return { max: 1, ticks: [0, 1] };

    const rawStep = max / count;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / magnitude;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
    const top = Math.ceil(max / step) * step;

    const ticks = [];
    for (let value = 0; value <= top + step / 2; value += step) ticks.push(value);
    return { max: top, ticks };
}
