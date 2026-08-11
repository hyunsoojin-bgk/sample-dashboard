<template>
    <svg
        class="sparkline"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
    >
        <path :d="linePath" fill="none" stroke="var(--axis-color)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <path :d="lastSegment" fill="none" :stroke="`var(${colorVar})`" stroke-width="1.5" vector-effect="non-scaling-stroke" />
    </svg>
</template>

<script setup>
import { computed } from 'vue';

/**
 * 스탯 카드용 12포인트 스파크라인.
 * 값 자체는 카드의 숫자가 말하므로 축·눈금 없이 형태만 보여준다.
 * 지난 구간은 회색, 마지막 구간만 시리즈 색 — 색이 "지금"을 가리킨다.
 *
 * 폭은 부모에 맞춰 늘어나고(preserveAspectRatio="none"),
 * 선 두께는 non-scaling-stroke 로 고정해 늘어나도 굵어지지 않는다.
 */
const props = defineProps({
    values: { type: Array, required: true },
    colorVar: { type: String, default: '--primary-color' },
    width: { type: Number, default: 120 },
    height: { type: Number, default: 32 },
});

const points = computed(() => {
    const values = props.values;
    if (values.length < 2) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pad = 3;
    const innerHeight = props.height - pad * 2;

    return values.map((value, index) => [
        (index / (values.length - 1)) * props.width,
        pad + innerHeight * (1 - (value - min) / span),
    ]);
});

const toPath = (list) =>
    list.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

const linePath = computed(() => toPath(points.value));
const lastSegment = computed(() => toPath(points.value.slice(-2)));
</script>

<style scoped lang="scss">
.sparkline {
    width: 100%;
    height: 32px;
    overflow: visible;
}
</style>
