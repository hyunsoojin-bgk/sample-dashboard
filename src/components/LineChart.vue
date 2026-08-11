<template>
    <figure ref="el" class="line-chart">
        <figcaption class="line-chart__head">
            <div class="line-chart__heading">
                <h3 class="card-title">{{ title }}</h3>
                <p class="card-subtitle">{{ description }}</p>
            </div>
            <ul class="line-chart__legend">
                <li v-for="serie in series" :key="serie.key">
                    <span class="line-chart__legend-key" :style="{ background: `var(${serie.colorVar})` }" />
                    {{ serie.name }}
                </li>
            </ul>
        </figcaption>

        <div class="line-chart__plot">
            <svg
                :width="geom.width"
                :height="height"
                role="img"
                :aria-label="ariaLabel"
                tabindex="0"
                @pointermove="onPointerMove"
                @pointerdown="onPointerMove"
                @pointerleave="clearActive"
                @blur="clearActive"
                @keydown="onKeydown"
            >
                <g>
                    <line
                        v-for="tick in geom.ticks"
                        :key="`grid-${tick}`"
                        :x1="geom.pad.left"
                        :x2="geom.width - geom.pad.right"
                        :y1="geom.y(tick)"
                        :y2="geom.y(tick)"
                        :stroke="tick === 0 ? 'var(--axis-color)' : 'var(--grid-color)'"
                        stroke-width="1"
                        shape-rendering="crispEdges"
                    />
                    <text
                        v-for="tick in geom.ticks"
                        :key="`ytick-${tick}`"
                        class="line-chart__tick"
                        :x="geom.pad.left - 8"
                        :y="geom.y(tick) + 4"
                        text-anchor="end"
                    >
                        {{ formatCompact(tick) }}
                    </text>
                </g>

                <text
                    v-for="index in geom.xTicks"
                    :key="`xtick-${index}`"
                    class="line-chart__tick"
                    :x="geom.x(index)"
                    :y="height - 8"
                    text-anchor="middle"
                >
                    {{ formatDate(series[0].points[index].date) }}
                </text>

                <line
                    v-if="hovered"
                    :x1="hovered.x"
                    :x2="hovered.x"
                    :y1="geom.pad.top"
                    :y2="height - geom.pad.bottom"
                    stroke="var(--axis-color)"
                    stroke-width="1"
                    shape-rendering="crispEdges"
                />

                <path
                    v-for="path in paths"
                    :key="path.key"
                    :d="path.d"
                    fill="none"
                    :stroke="`var(${path.colorVar})`"
                    stroke-width="2"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                />

                <g v-for="path in paths" :key="`end-${path.key}`">
                    <circle
                        :cx="path.lastX"
                        :cy="path.lastY"
                        r="4"
                        :fill="`var(${path.colorVar})`"
                        stroke="var(--surface-1)"
                        stroke-width="2"
                    />
                    <text
                        v-if="showEndLabels"
                        class="line-chart__tick line-chart__tick--end"
                        :x="path.lastX + 8"
                        :y="path.lastY + 4"
                    >
                        {{ formatCompact(path.lastValue) }}
                    </text>
                </g>

                <circle
                    v-for="row in hovered?.rows ?? []"
                    :key="`hover-${row.key}`"
                    :cx="hovered.x"
                    :cy="row.y"
                    r="4.5"
                    :fill="`var(${row.colorVar})`"
                    stroke="var(--surface-1)"
                    stroke-width="2"
                />
            </svg>

            <div v-if="hovered" class="line-chart__tooltip" :style="tooltipStyle">
                <p class="line-chart__tooltip-title">{{ formatDateLong(hovered.date) }}</p>
                <p v-for="row in hovered.rows" :key="row.key" class="line-chart__tooltip-row">
                    <span class="line-chart__tooltip-key" :style="{ background: `var(${row.colorVar})` }" />
                    <span class="flex1">{{ row.name }}</span>
                    <strong>{{ formatNumber(row.value) }}</strong>
                </p>
            </div>
        </div>

        <details class="line-chart__table">
            <summary>표로 보기</summary>
            <div class="line-chart__table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">날짜</th>
                            <th v-for="serie in series" :key="serie.key" scope="col">{{ serie.name }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(point, index) in series[0].points" :key="point.date.toISOString()">
                            <th scope="row">{{ formatDate(point.date, { withYear: true }) }}</th>
                            <td v-for="serie in series" :key="serie.key">
                                {{ formatNumber(serie.points[index].value) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useElementSize } from '@/composables/useElementSize';
import {
    formatCompact,
    formatDate,
    formatDateLong,
    formatNumber,
    niceTicks,
} from '@/shared/utils/format';

/**
 * 다계열 라인 차트.
 *
 * 반응형 처리 방식
 *  - 폭: ResizeObserver 로 부모 폭을 재서 좌표를 다시 계산한다.
 *        viewBox 로 늘리면 선·글자까지 같이 늘어나 흐려지므로 쓰지 않는다.
 *  - 여백/눈금 수/끝점 라벨: 미디어 쿼리가 아니라 "지금 폭"으로 판단한다.
 *        차트가 어느 칸에 들어가든(전체 폭이든 2단 중 한 칸이든) 맞는다.
 */
const props = defineProps({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    series: { type: Array, required: true },
    height: { type: Number, default: 280 },
});

const { el, width } = useElementSize();
const activeIndex = ref(null);

const pointCount = computed(() => props.series[0]?.points.length ?? 0);

const geom = computed(() => {
    const w = Math.max(width.value, 280);
    const narrow = w < 480;

    const pad = {
        top: 16,
        right: narrow ? 16 : 60,
        bottom: 26,
        left: narrow ? 38 : 48,
    };

    const innerWidth = w - pad.left - pad.right;
    const innerHeight = props.height - pad.top - pad.bottom;

    const peak = Math.max(1, ...props.series.flatMap((s) => s.points.map((p) => p.value)));
    const { max, ticks } = niceTicks(peak, narrow ? 3 : 4);

    const count = pointCount.value;
    const x = (index) => pad.left + (count <= 1 ? innerWidth / 2 : (index * innerWidth) / (count - 1));
    const y = (value) => pad.top + innerHeight * (1 - value / max);

    // 라벨이 겹치지 않을 만큼만 x 눈금을 찍는다 (라벨 하나당 최소 56px).
    const slots = Math.max(2, Math.min(count, Math.floor(innerWidth / 56)));
    const step = Math.max(1, Math.round((count - 1) / (slots - 1)));
    const xTicks = [];
    for (let i = 0; i < count; i += step) xTicks.push(i);

    // 마지막 날짜는 항상 찍는다. 다만 직전 눈금과 붙어 겹치면 그 눈금을 대체한다.
    const last = count - 1;
    if (xTicks.at(-1) !== last) {
        if (last - xTicks.at(-1) < step * 0.6) xTicks.pop();
        xTicks.push(last);
    }

    return { width: w, narrow, pad, ticks, x, y, xTicks };
});

const paths = computed(() =>
    props.series.map((serie) => ({
        key: serie.key,
        colorVar: serie.colorVar,
        d: serie.points
            .map((point, index) => {
                const command = index === 0 ? 'M' : 'L';
                return `${command}${geom.value.x(index).toFixed(1)},${geom.value.y(point.value).toFixed(1)}`;
            })
            .join(' '),
        lastX: geom.value.x(serie.points.length - 1),
        lastY: geom.value.y(serie.points.at(-1).value),
        lastValue: serie.points.at(-1).value,
    })),
);

// 끝점 라벨이 서로 붙으면 세로로 밀지 않고 아예 생략한다.
// (라벨을 밀면 선과 분리돼 오히려 잘못 읽힌다 — 범례와 툴팁이 식별을 맡는다)
const showEndLabels = computed(() => {
    if (geom.value.narrow) return false;
    const ys = paths.value.map((path) => path.lastY);
    return ys.every((a, i) => ys.every((b, j) => i === j || Math.abs(a - b) > 16));
});

const ariaLabel = computed(
    () => `${props.title}. ${props.series.map((s) => s.name).join(', ')} 계열의 추이. 아래 "표로 보기"에서 값을 확인할 수 있습니다.`,
);

const hovered = computed(() => {
    const index = activeIndex.value;
    if (index == null || index >= pointCount.value) return null;

    return {
        x: geom.value.x(index),
        date: props.series[0].points[index].date,
        rows: props.series.map((serie) => ({
            key: serie.key,
            name: serie.name,
            colorVar: serie.colorVar,
            value: serie.points[index].value,
            y: geom.value.y(serie.points[index].value),
        })),
    };
});

// 오른쪽 끝에서는 툴팁을 왼쪽으로 넘겨 잘리지 않게 한다.
const tooltipStyle = computed(() => {
    if (!hovered.value) return {};
    const flip = hovered.value.x > geom.value.width * 0.6;
    return {
        left: `${hovered.value.x}px`,
        transform: flip ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
    };
});

function onPointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - geom.value.pad.left) /
        (geom.value.width - geom.value.pad.left - geom.value.pad.right || 1);
    activeIndex.value = Math.max(0, Math.min(pointCount.value - 1, Math.round(ratio * (pointCount.value - 1))));
}

function clearActive() {
    activeIndex.value = null;
}

// 키보드로도 값을 훑을 수 있어야 한다 (마우스 호버가 유일한 경로면 안 된다).
function onKeydown(event) {
    const count = pointCount.value;
    if (!count) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const current = activeIndex.value ?? count - 1;
        activeIndex.value = Math.max(0, Math.min(count - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
    } else if (event.key === 'Escape') {
        clearActive();
    }
}
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.line-chart {
    @include card_box;
    padding: clamp(16px, 2.5vw, 20px);
    gap: getRem(12);
    min-width: 0;
}

.line-chart__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: getRem(8);
}

.line-chart__legend {
    display: flex;
    flex-wrap: wrap;
    gap: getRem(14);
    @include font(12, 400);
    color: var(--font-color-base);

    li {
        display: flex;
        align-items: center;
        gap: getRem(6);
    }
}

.line-chart__legend-key {
    width: 12px;
    height: 2px;
    border-radius: 1px;
}

.line-chart__plot {
    position: relative;
}

svg {
    display: block;
    // 세로 스크롤은 그대로 두고 가로 제스처만 차트가 받는다 (모바일에서 스크롤이 막히지 않게).
    touch-action: pan-y;
    @include focus-ring;
}

.line-chart__tick {
    @include font(11, 400);
    fill: var(--font-color-muted);
    font-variant-numeric: tabular-nums;
}

.line-chart__tick--end {
    fill: var(--font-color-base);
    font-weight: 600;
}

.line-chart__tooltip {
    position: absolute;
    top: 8px;
    z-index: 2;
    min-width: getRem(150);
    padding: getRem(10) getRem(12);
    background: var(--surface-1);
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;
    box-shadow: $box-shadow-pop;
    pointer-events: none;
}

.line-chart__tooltip-title {
    @include font(11, 400);
    color: var(--font-color-muted);
    margin-bottom: getRem(6);
}

.line-chart__tooltip-row {
    display: flex;
    align-items: center;
    gap: getRem(8);
    @include font(12, 400);

    strong {
        color: var(--font-color-strong);
        font-variant-numeric: tabular-nums;
    }
}

.line-chart__tooltip-key {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex: none;
}

.line-chart__table {
    @include font(12, 400);

    summary {
        cursor: pointer;
        color: var(--font-color-muted);
        @include focus-ring(4px);
    }
}

.line-chart__table-scroll {
    max-height: getRem(240);
    margin-top: getRem(8);
    // 표는 페이지를 밀지 않고 자기 안에서 가로 스크롤한다.
    overflow: auto;
    @include scrollbar;

    table {
        width: 100%;
        font-variant-numeric: tabular-nums;
    }

    th,
    td {
        padding: getRem(6) getRem(8);
        text-align: right;
        white-space: nowrap;
        border-bottom: 1px solid var(--grid-color);
    }

    thead th,
    tbody th {
        text-align: left;
        font-weight: 500;
        color: var(--font-color-muted);
    }

    thead th {
        position: sticky;
        top: 0;
        background: var(--surface-1);
    }
}
</style>
