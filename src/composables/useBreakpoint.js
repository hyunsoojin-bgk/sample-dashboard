import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 브레이크포인트를 JS 에서 쓰기 위한 컴포저블.
 *
 * 값을 여기에 다시 적지 않고 `:root` 의 `--bp-*` 커스텀 프로퍼티를 읽는다.
 * (styles/_breakpoints.scss 의 `export-breakpoints` 믹스인이 내보낸 값)
 * → SCSS 와 JS 가 항상 같은 지점에서 꺾인다.
 *
 * 레이아웃은 CSS 로 처리하는 것이 원칙이고, 이 컴포저블은
 * "차트 높이", "축 눈금 개수"처럼 CSS 로 표현할 수 없는 값에만 쓴다.
 */

let cachedBreakpoints = null;

function readBreakpoints() {
    if (cachedBreakpoints) return cachedBreakpoints;

    const styles = getComputedStyle(document.documentElement);
    const read = (name, fallback) => {
        const raw = styles.getPropertyValue(`--bp-${name}`).trim();
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    cachedBreakpoints = {
        xs: read('xs', 480),
        sm: read('sm', 640),
        md: read('md', 768),
        lg: read('lg', 1024),
        xl: read('xl', 1280),
    };
    return cachedBreakpoints;
}

export function useBreakpoint() {
    const width = ref(typeof window === 'undefined' ? 1280 : window.innerWidth);
    const bp = ref({ xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280 });

    const update = () => {
        width.value = window.innerWidth;
    };

    onMounted(() => {
        bp.value = readBreakpoints();
        update();
        window.addEventListener('resize', update, { passive: true });
    });

    onBeforeUnmount(() => window.removeEventListener('resize', update));

    return {
        width,
        isMobile: computed(() => width.value < bp.value.md),
        isTablet: computed(() => width.value >= bp.value.md && width.value < bp.value.lg),
        isDesktop: computed(() => width.value >= bp.value.lg),
    };
}
