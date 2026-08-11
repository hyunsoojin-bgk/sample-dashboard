<template>
    <article class="stat-card">
        <p class="stat-card__label">{{ stat.label }}</p>

        <div class="stat-card__value-row">
            <strong class="stat-card__value">{{ formatValue(stat.value, stat.format) }}</strong>
            <span v-if="deltaText" class="stat-card__delta" :class="deltaClass">
                <BaseIcon :name="stat.delta.value >= 0 ? 'arrow-up' : 'arrow-down'" :size="13" />
                {{ deltaText }}
            </span>
        </div>

        <p class="stat-card__caption">직전 동일 기간 대비</p>

        <SparkLine class="stat-card__spark" :values="stat.spark" :color-var="colorVar" />
    </article>
</template>

<script setup>
import { computed } from 'vue';
import BaseIcon from '@/components/BaseIcon.vue';
import SparkLine from '@/components/SparkLine.vue';
import { formatDelta, formatValue } from '@/shared/utils/format';

const props = defineProps({
    stat: { type: Object, required: true },
    colorVar: { type: String, default: '--primary-color' },
});

const deltaText = computed(() => formatDelta(props.stat.delta));

// 색은 "올랐다/내렸다"가 아니라 "좋아졌다/나빠졌다"를 가리킨다.
// 응답시간처럼 내려가는 게 좋은 지표는 upIsGood: false 로 뒤집는다.
const deltaClass = computed(() => {
    const delta = props.stat.delta;
    if (!delta || delta.value === 0) return 'is-flat';
    const improved = delta.value > 0 === props.stat.upIsGood;
    return improved ? 'is-good' : 'is-bad';
});
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.stat-card {
    @include card_box;
    padding: clamp(14px, 2.2vw, 18px);
    gap: getRem(6);
    // 카드 폭은 부모 그리드가 정한다. 여기서는 폭을 고정하지 않는다.
    min-width: 0;
}

.stat-card__label {
    @include font(13, 500);
    color: var(--font-color-base);
    @include ellipsis;
}

.stat-card__value-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: getRem(8);
}

.stat-card__value {
    // 큰 숫자는 tabular-nums 를 쓰지 않는다 — 자간이 들떠 보인다.
    @include font-fluid(24, 32, 600);
    color: var(--font-color-strong);
}

.stat-card__delta {
    display: inline-flex;
    align-items: center;
    gap: getRem(2);
    @include font(12, 600);
    font-variant-numeric: tabular-nums;

    &.is-good { color: var(--delta-up-color); }
    &.is-bad { color: var(--delta-down-color); }
    &.is-flat { color: var(--font-color-muted); }
}

.stat-card__caption {
    @include font(11, 400);
    color: var(--font-color-muted);
}

.stat-card__spark {
    margin-top: getRem(4);

    // 아주 좁은 화면에서는 카드가 세로로 길어지지 않도록 스파크라인을 낮춘다.
    @include respond-down(xs) {
        height: 24px;
    }
}
</style>
