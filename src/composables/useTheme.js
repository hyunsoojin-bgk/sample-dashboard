import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 테마 전환.
 * - 저장값이 없으면 OS 설정을 따른다 (CSS 의 prefers-color-scheme 가 처리)
 * - 사용자가 고르면 html[data-theme] 로 못박고 localStorage 에 남긴다
 *
 * adminfront 와 동일하게 `[data-theme="dark"]` 선택자를 쓰되,
 * 대상 요소는 body 가 아니라 documentElement 다 (첫 페인트 전에 적용하기 위함, index.html 참고).
 */

const STORAGE_KEY = 'theme';

export function useTheme() {
    const preference = ref(null); // 'light' | 'dark' | null(= OS 따름)
    const systemDark = ref(false);
    let media;

    const isDark = computed(() =>
        preference.value ? preference.value === 'dark' : systemDark.value,
    );

    function apply(value) {
        preference.value = value;
        const root = document.documentElement;
        if (value) {
            root.setAttribute('data-theme', value);
            localStorage.setItem(STORAGE_KEY, value);
        } else {
            root.removeAttribute('data-theme');
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function toggle() {
        apply(isDark.value ? 'light' : 'dark');
    }

    const onSystemChange = (event) => {
        systemDark.value = event.matches;
    };

    onMounted(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        preference.value = saved === 'light' || saved === 'dark' ? saved : null;

        media = window.matchMedia('(prefers-color-scheme: dark)');
        systemDark.value = media.matches;
        media.addEventListener('change', onSystemChange);
    });

    onBeforeUnmount(() => media?.removeEventListener('change', onSystemChange));

    return { isDark, preference, toggle, apply };
}
