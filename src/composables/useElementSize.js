import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * 컨테이너의 실제 픽셀 폭을 추적한다.
 *
 * SVG 차트를 viewBox 로 늘리면 선 두께·글자까지 같이 늘어나 흐려진다.
 * 그래서 폭을 재서 좌표를 다시 계산하는 방식을 쓴다 — 미디어 쿼리가 아니라
 * 부모 폭에 반응하므로, 같은 컴포넌트를 어느 칸에 넣어도 알아서 맞는다.
 */
export function useElementSize() {
    const el = ref(null);
    const width = ref(0);
    let observer;

    onMounted(() => {
        if (!el.value) return;
        width.value = el.value.clientWidth;
        observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                width.value = entry.contentRect.width;
            }
        });
        observer.observe(el.value);
    });

    onBeforeUnmount(() => observer?.disconnect());

    return { el, width };
}
