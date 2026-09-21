<template>
    <div v-if="isEmbedded" class="iframe-banner" :class="statusClass">
        <strong>iframe 통신 테스트 (HAW-1165)</strong>
        <span v-if="status === 'waiting'">parent 응답 대기 중…</span>
        <span v-else-if="status === 'timeout'">3초 내 응답 없음 — parent가 REQUEST_USER_INFO를 처리하지 않았거나 origin이 안 맞을 수 있음</span>
        <span v-else-if="status === 'ok'">
            수신됨 — userId: {{ userInfo.userId || '(빈값)' }} / userNm: {{ userInfo.userNm || '(빈값)' }} /
            userEmail: {{ userInfo.userEmail || '(빈값)' }} / curCmpnId: {{ userInfo.curCmpnId || '(빈값)' }} /
            curCmpnNm: {{ userInfo.curCmpnNm || '(빈값)' }}
        </span>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

/**
 * bb8-plex-adminfront(parent) ↔ 이 페이지(child, iframe) postMessage 통신 테스트용 배너. (HAW-1165)
 *
 * adminfront 의 ExternalFramePage.vue 가 postMessage 요청/응답을 실제로 처리하는지
 * 눈으로 바로 확인하기 위한 임시 디버그 UI — 배포된 대시보드 기능과는 무관하다.
 * iframe 으로 embed 됐을 때만(window.self !== window.top) 렌더링된다.
 */

const REQUEST_TYPE = 'REQUEST_USER_INFO';
const RESPONSE_TYPE = 'USER_INFO_RESPONSE';
const TIMEOUT_MS = 3000;

const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
const status = ref('waiting'); // waiting | ok | timeout
const userInfo = reactive({});
let timeoutId = null;

function handleMessage(event) {
    if (event.data?.type !== RESPONSE_TYPE) return;
    clearTimeout(timeoutId);
    status.value = 'ok';
    Object.assign(userInfo, event.data.payload || {});
    // 콘솔에도 남겨 origin 등 값을 그대로 확인할 수 있게 한다.
    console.log('[HAW-1165] USER_INFO_RESPONSE 수신', { origin: event.origin, payload: event.data.payload });
}

const statusClass = computed(() => `iframe-banner--${status.value}`);

onMounted(() => {
    if (!isEmbedded) return;
    window.addEventListener('message', handleMessage);
    // parent origin 을 미리 알 방법이 없어 '*' 로 요청만 보낸다 — 사용자 정보가 담기는 건
    // parent 가 보내는 응답 쪽이고, 응답은 parent 가 검증된 origin(자기 자신의 iframe.src)
    // 으로만 보내도록 구현되어 있다(adminfront ExternalFramePage.vue 쪽 구현).
    window.parent.postMessage({ type: REQUEST_TYPE }, '*');
    timeoutId = setTimeout(() => {
        if (status.value === 'waiting') status.value = 'timeout';
    }, TIMEOUT_MS);
});

onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage);
    clearTimeout(timeoutId);
});
</script>

<style scoped lang="scss">
.iframe-banner {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    border: 1px solid transparent;
}

.iframe-banner--waiting {
    background: #fff8e1;
    border-color: #f2c94c;
    color: #7a5b00;
}

.iframe-banner--ok {
    background: #e8f7ee;
    border-color: #34c759;
    color: #1c6b3a;
}

.iframe-banner--timeout {
    background: #fdecea;
    border-color: #e5484d;
    color: #a41c1c;
}
</style>
