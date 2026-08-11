<template>
    <section class="event-table">
        <header class="event-table__head">
            <h3 class="card-title">최근 이벤트</h3>
            <p class="card-subtitle">오늘 발생한 운영 이벤트 {{ events.length }}건</p>
        </header>

        <div class="event-table__scroll">
            <table>
                <caption class="visually-hidden">
                    시각, 서비스, 내용, 상태, 소요시간 순으로 구성된 최근 운영 이벤트 목록
                </caption>
                <thead>
                    <tr>
                        <th scope="col">시각</th>
                        <th scope="col">서비스</th>
                        <th scope="col">내용</th>
                        <th scope="col">상태</th>
                        <th scope="col" class="is-numeric">소요</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="event in events" :key="`${event.time}-${event.service}`">
                        <td data-label="시각" class="tabular">{{ event.time }}</td>
                        <td data-label="서비스">{{ event.service }}</td>
                        <td data-label="내용" class="event-table__message">{{ event.message }}</td>
                        <td data-label="상태">
                            <!-- 색만으로 상태를 말하지 않는다. 아이콘 + 글자를 항상 같이 둔다. -->
                            <span class="status-badge" :class="`is-${event.status}`">
                                <BaseIcon :name="STATUS_ICON[event.status]" :size="14" />
                                {{ event.statusLabel }}
                            </span>
                        </td>
                        <td data-label="소요" class="tabular is-numeric">{{ event.duration }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup>
import BaseIcon from '@/components/BaseIcon.vue';

defineProps({
    events: { type: Array, required: true },
});

const STATUS_ICON = {
    good: 'check-circle',
    warning: 'alert-triangle',
    serious: 'alert-circle',
    critical: 'x-circle',
};
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.event-table {
    @include card_box;
    padding: clamp(16px, 2.5vw, 20px);
    gap: getRem(12);
    min-width: 0;
}

.event-table__head {
    display: flex;
    flex-direction: column;
    gap: getRem(2);
}

.event-table__scroll {
    // md 이상에서는 표가 넘칠 때 페이지가 아니라 이 컨테이너가 스크롤한다.
    overflow-x: auto;
    @include scrollbar;
}

table {
    width: 100%;
    @include font(13, 400);
}

th,
td {
    padding: getRem(10) getRem(12);
    text-align: left;
    border-bottom: 1px solid var(--grid-color);
    vertical-align: middle;
}

th {
    @include font(12, 500);
    color: var(--font-color-muted);
    white-space: nowrap;
}

tbody tr:last-child td {
    border-bottom: 0;
}

.is-numeric {
    text-align: right;
}

.event-table__message {
    color: var(--font-color-strong);
    min-width: getRem(200);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: getRem(4);
    padding: getRem(2) getRem(8);
    border-radius: 999px;
    white-space: nowrap;
    @include font(12, 500);
    background: var(--surface-2);

    &.is-good { color: var(--status-good); }
    &.is-warning { color: var(--status-warning); }
    &.is-serious { color: var(--status-serious); }
    &.is-critical { color: var(--status-critical); }
}

// ── 좁은 화면: 표를 가로 스크롤시키지 않고 행 단위 카드로 바꾼다.
// 가로 스크롤은 열 제목이 시야에서 사라져 값의 의미를 잃는다.
// 대신 각 셀이 data-label 로 자기 열 제목을 들고 다닌다.
@include respond-down(md) {
    .event-table__scroll {
        overflow-x: visible;
    }

    thead {
        // 시각적으로만 숨긴다 — 스크린리더는 계속 헤더 셀을 읽는다.
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    tbody tr {
        display: flex;
        flex-direction: column;
        gap: getRem(4);
        padding: getRem(12) 0;
        border-bottom: 1px solid var(--grid-color);
    }

    tbody tr:last-child {
        border-bottom: 0;
    }

    td {
        display: grid;
        grid-template-columns: getRem(60) 1fr;
        align-items: baseline;
        gap: getRem(10);
        border-bottom: 0;
        padding: 0;

        &::before {
            content: attr(data-label);
            @include font(12, 400);
            color: var(--font-color-muted);
        }
    }

    .is-numeric {
        text-align: left;
    }

    .event-table__message {
        min-width: 0;
    }
}
</style>
