<template>
    <svg
        class="base-icon"
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <path v-for="(d, index) in paths" :key="index" :d="d" />
        <circle
            v-for="(c, index) in circles"
            :key="`c${index}`"
            :cx="c[0]"
            :cy="c[1]"
            :r="c[2]"
        />
    </svg>
</template>

<script setup>
import { computed } from 'vue';

// adminfront 의 BaseIcon 과 같은 인터페이스(name/size)를 쓴다.
// 아이콘 패키지를 얹지 않고 필요한 것만 인라인으로 들고 있다.
const ICONS = {
    'check-circle': { paths: ['M9 12l2 2 4-4'], circles: [[12, 12, 9]] },
    'alert-triangle': {
        paths: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z', 'M12 9v4', 'M12 17h.01'],
        circles: [],
    },
    'alert-circle': { paths: ['M12 8v4', 'M12 16h.01'], circles: [[12, 12, 9]] },
    'x-circle': { paths: ['M15 9l-6 6', 'M9 9l6 6'], circles: [[12, 12, 9]] },
    'arrow-up': { paths: ['M12 19V5', 'M5 12l7-7 7 7'], circles: [] },
    'arrow-down': { paths: ['M12 5v14', 'M19 12l-7 7-7-7'], circles: [] },
    activity: { paths: ['M22 12h-4l-3 9L9 3l-3 9H2'], circles: [] },
    sun: {
        paths: ['M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
        circles: [[12, 12, 4]],
    },
    moon: { paths: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'], circles: [] },
};

const props = defineProps({
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
});

const icon = computed(() => ICONS[props.name] ?? { paths: [], circles: [] });
const paths = computed(() => icon.value.paths);
const circles = computed(() => icon.value.circles);
</script>

<style scoped lang="scss">
.base-icon {
    flex: none;
}
</style>
