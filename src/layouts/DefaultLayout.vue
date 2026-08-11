<template>
    <div class="ly-wrapper">
        <a class="skip-link" href="#main">본문으로 건너뛰기</a>

        <header class="ly-header">
            <div class="page-container ly-header__inner">
                <RouterLink to="/" class="ly-header__brand">
                    <BaseIcon name="activity" :size="18" />
                    <span class="ly-header__title">Sample Dashboard</span>
                </RouterLink>

                <nav class="ly-header__nav" aria-label="주요 메뉴">
                    <RouterLink v-for="item in NAV" :key="item.to" :to="item.to">
                        {{ item.label }}
                    </RouterLink>
                </nav>

                <ThemeToggle class="ly-header__toggle" />
            </div>
        </header>

        <main id="main" class="ly-body">
            <div class="page-container">
                <slot />
            </div>
        </main>

        <footer class="ly-footer">
            <div class="page-container ly-footer__inner">
                <span>Vue 3 · Vite · SCSS 반응형 데모</span>
                <a href="https://github.com/hyunsoojin-bgk/sample-dashboard" target="_blank" rel="noreferrer">
                    GitHub
                </a>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import BaseIcon from '@/components/BaseIcon.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const NAV = [{ to: '/', label: '개요' }];
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.ly-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100dvh; // 모바일 주소창 높이 변화를 반영한다 (100vh 는 잘린다)
}

.skip-link {
    position: absolute;
    left: getRem(8);
    top: getRem(-48);
    z-index: 10;
    padding: getRem(8) getRem(12);
    border-radius: $radius-sm;
    background: var(--surface-1);
    color: var(--font-color-strong);
    box-shadow: $box-shadow-pop;
    transition: top 0.15s ease;

    &:focus-visible {
        top: getRem(8);
    }
}

.ly-header {
    position: sticky;
    top: 0;
    z-index: 5;
    background: color-mix(in srgb, var(--page-bg) 88%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-color);
}

.ly-header__inner {
    display: flex;
    align-items: center;
    gap: getRem(16);
    height: $header-height;

    @include respond-down(md) {
        height: $header-height-mobile;
        gap: getRem(10);
    }
}

.ly-header__brand {
    display: flex;
    align-items: center;
    gap: getRem(8);
    color: var(--font-color-strong);
    @include font(15, 600);
    @include focus-ring;
}

.ly-header__title {
    // 아주 좁은 화면에서는 아이콘만 남기고 글자를 접는다.
    @include respond-down(xs) {
        display: none;
    }
}

.ly-header__nav {
    display: flex;
    gap: getRem(4);
    margin-right: auto;
    overflow-x: auto;
    @include scrollbar;

    a {
        padding: getRem(6) getRem(10);
        border-radius: $radius-sm;
        white-space: nowrap;
        color: var(--font-color-base);
        @include font(13, 500);
        @include focus-ring;

        @include hover {
            background: var(--surface-hover);
            color: var(--font-color-strong);
        }
    }

    .router-link-active {
        color: var(--font-color-strong);
        background: var(--surface-2);
    }
}

.ly-body {
    flex: 1;
    padding-block: clamp(20px, 3vw, 32px);
}

.ly-footer {
    border-top: 1px solid var(--border-color);
    padding-block: getRem(12);
    @include font(12, 400);
    color: var(--font-color-muted);
}

.ly-footer__inner {
    display: flex;
    flex-wrap: wrap;
    gap: getRem(8);
    justify-content: space-between;

    a {
        @include focus-ring;
        @include hover {
            color: var(--font-color-strong);
        }
    }
}
</style>
