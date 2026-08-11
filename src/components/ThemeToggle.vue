<template>
    <button
        type="button"
        class="theme-toggle"
        :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
        :title="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggle"
    >
        <BaseIcon :name="isDark ? 'sun' : 'moon'" :size="16" />
    </button>
</template>

<script setup>
import BaseIcon from '@/components/BaseIcon.vue';
import { useTheme } from '@/composables/useTheme';

const { isDark, toggle } = useTheme();
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.theme-toggle {
    @include display_center;
    @include focus-ring;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--font-color-base);
    background: var(--surface-2);
    transition: color 0.12s ease, background-color 0.12s ease;

    @include hover {
        color: var(--font-color-strong);
        background: var(--surface-hover);
    }
}
</style>
