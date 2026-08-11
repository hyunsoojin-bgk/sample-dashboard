<template>
    <div class="range-filter" role="group" aria-label="조회 기간">
        <button
            v-for="range in ranges"
            :key="range.days"
            type="button"
            class="range-filter__item"
            :class="{ 'is-active': range.days === modelValue }"
            :aria-pressed="range.days === modelValue"
            @click="emit('update:modelValue', range.days)"
        >
            {{ range.label }}
        </button>
    </div>
</template>

<script setup>
defineProps({
    modelValue: { type: Number, required: true },
    ranges: { type: Array, required: true },
});

const emit = defineEmits(['update:modelValue']);
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.range-filter {
    display: inline-flex;
    padding: 3px;
    gap: 2px;
    background: var(--surface-2);
    border-radius: 999px;
}

.range-filter__item {
    padding: getRem(6) getRem(14);
    border-radius: 999px;
    white-space: nowrap;
    color: var(--font-color-base);
    @include font(13, 500);
    @include focus-ring;
    transition: background-color 0.12s ease, color 0.12s ease;

    // 터치 타겟 최소 높이. 폭까지 44px 로 강제하면 세 칸이 화면을 넘겨 높이만 확보한다.
    min-height: 36px;

    @include hover {
        color: var(--font-color-strong);
    }

    &.is-active {
        background: var(--surface-1);
        color: var(--font-color-strong);
        box-shadow: $box-shadow-light;
    }

    @include respond-down(xs) {
        padding: getRem(6) getRem(10);
    }
}
</style>
