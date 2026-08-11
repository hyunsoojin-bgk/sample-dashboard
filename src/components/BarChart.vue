<template>
    <figure ref="el" class="bar-chart">
        <figcaption class="bar-chart__head">
            <h3 class="card-title">{{ title }}</h3>
            <p class="card-subtitle">{{ description }}</p>
        </figcaption>

        <ul class="bar-chart__list">
            <li
                v-for="(item, index) in rows"
                :key="item.name"
                class="bar-chart__row"
                :class="{ 'is-active': activeIndex === index }"
                @pointerenter="activeIndex = index"
                @pointerleave="activeIndex = null"
                @focusin="activeIndex = index"
                @focusout="activeIndex = null"
                tabindex="0"
            >
                <span class="bar-chart__name">{{ item.name }}</span>

                <span class="bar-chart__track">
                    <span
                        class="bar-chart__bar"
                        :style="{ width: `${item.ratio * 100}%`, background: `var(${colorVar})` }"
                    />
                </span>

                <span class="bar-chart__value tabular">{{ formatCompact(item.value) }}</span>

                <span class="bar-chart__share tabular" :class="{ 'is-visible': activeIndex === index }">
                    {{ item.share }}%
                </span>
            </li>
        </ul>
    </figure>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useElementSize } from '@/composables/useElementSize';
import { formatCompact } from '@/shared/utils/format';

/**
 * 가로 막대 차트 — 항목 이름이 길어 세로 축에 두는 편이 읽기 쉬운 경우에 쓴다.
 *
 * SVG 가 아니라 HTML/CSS 로 그린다. 막대는 1차원 길이라서 flex 만으로 정확하고,
 * 이름 라벨이 자동 줄바꿈·말줄임 처리돼 좁은 화면 대응이 SVG 보다 낫다.
 */
const props = defineProps({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    items: { type: Array, required: true },
    colorVar: { type: String, default: '--series-1' },
});

const { el } = useElementSize();
const activeIndex = ref(null);

const rows = computed(() => {
    const max = Math.max(1, ...props.items.map((item) => item.value));
    const total = props.items.reduce((acc, item) => acc + item.value, 0) || 1;

    return props.items.map((item) => ({
        ...item,
        ratio: item.value / max,
        share: ((item.value / total) * 100).toFixed(1),
    }));
});
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.bar-chart {
    @include card_box;
    padding: clamp(16px, 2.5vw, 20px);
    gap: getRem(12);
    min-width: 0;
}

.bar-chart__head {
    display: flex;
    flex-direction: column;
    gap: getRem(2);
}

.bar-chart__list {
    display: flex;
    flex-direction: column;
    gap: getRem(4);
}

.bar-chart__row {
    display: grid;
    // 이름 | 막대 | 값 | 점유율. 이름 칸은 내용에 맞춰 줄되 상한을 둔다.
    grid-template-columns: minmax(72px, 116px) 1fr auto auto;
    align-items: center;
    gap: getRem(10);
    padding: getRem(6) getRem(8);
    border-radius: $radius-sm;
    transition: background-color 0.12s ease;
    @include focus-ring(0);

    &.is-active {
        background: var(--surface-hover);
    }

    // 좁은 화면에서는 이름을 막대 위로 올린다 — 이름 칸을 줄이면 전부 말줄임돼 못 읽는다.
    @include respond-down(sm) {
        grid-template-columns: 1fr auto auto;
        grid-template-areas:
            "name name share"
            "bar value value";
        gap: getRem(4) getRem(8);
    }
}

.bar-chart__name {
    @include font(13, 400);
    color: var(--font-color-base);
    @include ellipsis;

    @include respond-down(sm) {
        grid-area: name;
    }
}

.bar-chart__track {
    display: block;
    height: 20px;
    // 미채움 구간은 같은 색 계열의 옅은 단계 — 막대 전체에서 상태가 읽힌다.
    background: var(--primary-soft-bg);
    border-radius: 2px 4px 4px 2px;
    overflow: hidden;

    @include respond-down(sm) {
        grid-area: bar;
        height: 14px;
    }
}

.bar-chart__bar {
    display: block;
    height: 100%;
    min-width: 2px;
    // 데이터가 끝나는 쪽만 둥글게, 기준선 쪽은 각지게.
    border-radius: 0 4px 4px 0;
}

.bar-chart__value {
    @include font(13, 600);
    color: var(--font-color-strong);

    @include respond-down(sm) {
        grid-area: value;
    }
}

.bar-chart__share {
    @include font(12, 400);
    color: var(--font-color-muted);
    min-width: getRem(44);
    text-align: right;
    // 호버 전에는 자리만 잡아둔다 — 나타날 때 레이아웃이 밀리지 않게.
    opacity: 0;
    transition: opacity 0.12s ease;

    &.is-visible {
        opacity: 1;
    }

    // 터치 기기에는 호버가 없으므로 항상 보여준다.
    @media (hover: none) {
        opacity: 1;
    }

    @include respond-down(sm) {
        grid-area: share;
    }
}
</style>
