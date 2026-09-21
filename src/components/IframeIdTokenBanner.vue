<template>
    <div v-if="isEmbedded" class="iframe-banner" :class="statusClass">
        <strong>iframe id-token 통신 테스트 (HAW-1165)</strong>
        <span v-if="status === 'no-response'">
            parent 응답 없음(3초) — parent가 id-token-request를 처리하지 않거나 origin이 안 맞을 수 있음
        </span>
        <span v-else-if="status === 'loading'">parent가 토큰 갱신 중…</span>
        <span v-else-if="status === 'error'">
            parent가 토큰 갱신 실패(status=error) — Plex 세션은 유효, 네트워크/서버 일시 오류로 추정
        </span>
        <span v-else-if="status === 'timeout'">15초 내 최종 응답 없음 — loading에서 멈춘 상태</span>
        <template v-else-if="status === 'success'">
            <span>수신됨 — 아래는 서명 검증 없이 디코딩만 한 값(실제로는 외부 서버가 JWKS로 서명 검증해야 함)</span>
            <pre class="iframe-banner__token">header: {{ decoded.header }}
payload: {{ decoded.payload }}</pre>
        </template>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

/**
 * bb8-plex-adminfront(parent) ↔ 이 페이지(child, iframe) id-token 통신 테스트 배너. (HAW-1165)
 *
 * 외부 파트너가 전달한 명세를 그대로 따른다 — parent는 postMessage로 사용자 속성을 바로 주는 게
 * 아니라, Keycloak에서 새로 발급한 서명된 ID Token(JWT)을 준다. 실제 서비스라면 이 토큰을 다시
 * 이 페이지의 백엔드(외부 서버)로 보내 JWKS로 서명·iss·aud·azp·typ·exp·jti(재사용 방지)를
 * 검증한 뒤 세션 쿠키를 발급해야 한다 — 이 데모는 브라우저 단독(외부 API 없음) 페이지라 서명
 * 검증까지는 하지 않고, 수신된 토큰을 디코딩해서 보여주는 것까지만 확인한다.
 *
 * 응답은 loading → success|error 순으로 두 번 올 수 있다(parent가 refresh 시작 시 loading을
 * 먼저 보내고, 끝나면 최종 상태를 보낸다). iframe 으로 embed 됐을 때만 렌더링된다.
 */

const REQUEST_TYPE = 'id-token-request';
const RESPONSE_TYPE = 'id-token';
const NO_RESPONSE_TIMEOUT_MS = 3000; // parent가 아예 응답 안 할 때(프로토콜 미구현 등)
const FINAL_RESPONSE_TIMEOUT_MS = 15000; // loading 이후 최종 응답이 안 올 때

const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
// idle | no-response | loading | success | error | timeout
const status = ref('idle');
const decoded = reactive({ header: '', payload: '' });
let noResponseTimer = null;
let finalTimer = null;

/** JWT의 header/payload 세그먼트만 base64url 디코딩한다 — 서명 검증은 하지 않는다. */
function decodeJwtSegment(segment) {
    try {
        const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const json = decodeURIComponent(
            atob(padded)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
        return '(디코딩 실패)';
    }
}

function handleMessage(event) {
    if (event.data?.type !== RESPONSE_TYPE) return;

    if (event.data.status === 'loading') {
        clearTimeout(noResponseTimer);
        status.value = 'loading';
        finalTimer = setTimeout(() => {
            if (status.value === 'loading') status.value = 'timeout';
        }, FINAL_RESPONSE_TIMEOUT_MS);
        return;
    }

    clearTimeout(noResponseTimer);
    clearTimeout(finalTimer);

    if (event.data.status === 'success') {
        const [headerSeg, payloadSeg] = String(event.data.idToken || '').split('.');
        decoded.header = decodeJwtSegment(headerSeg || '');
        decoded.payload = decodeJwtSegment(payloadSeg || '');
        status.value = 'success';
        console.log('[HAW-1165] id-token success', { origin: event.origin, idToken: event.data.idToken });
    } else if (event.data.status === 'error') {
        status.value = 'error';
        console.log('[HAW-1165] id-token error', { origin: event.origin });
    }
}

const statusClass = computed(() => `iframe-banner--${status.value === 'idle' ? 'loading' : status.value}`);

onMounted(() => {
    if (!isEmbedded) return;
    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: REQUEST_TYPE }, '*');
    noResponseTimer = setTimeout(() => {
        if (status.value === 'idle') status.value = 'no-response';
    }, NO_RESPONSE_TIMEOUT_MS);
});

onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage);
    clearTimeout(noResponseTimer);
    clearTimeout(finalTimer);
});
</script>

<style scoped lang="scss">
.iframe-banner {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    border: 1px solid transparent;
}

.iframe-banner__token {
    margin: 4px 0 0;
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 6px;
    font-size: 11px;
    white-space: pre-wrap;
    word-break: break-word;
}

.iframe-banner--loading {
    background: #fff8e1;
    border-color: #f2c94c;
    color: #7a5b00;
}

.iframe-banner--success {
    background: #e8f7ee;
    border-color: #34c759;
    color: #1c6b3a;
}

.iframe-banner--error,
.iframe-banner--timeout,
.iframe-banner--no-response {
    background: #fdecea;
    border-color: #e5484d;
    color: #a41c1c;
}
</style>
