<template>
    <div class="dashboard col gap24">
        <!-- 필터는 차트 위 한 줄에 모은다 -->
        <section class="dashboard__toolbar">
            <div class="dashboard__intro">
                <h1 class="dashboard__title">서비스 운영 개요</h1>
                <p class="section-desc">
                    {{ rangeLabel }} 기준 · {{ updatedAtText }} 갱신
                </p>
            </div>
            <RangeFilter v-model="days" :ranges="RANGES" />
        </section>

        <!-- 지표 카드: 열 수를 고정하지 않는다. 카드 최소 폭만 정하면 알아서 접힌다. -->
        <section class="dashboard__stats">
            <StatCard
                v-for="(stat, index) in data.stats"
                :key="stat.key"
                :stat="stat"
                :color-var="index % 2 === 0 ? '--series-1' : '--series-2'"
            />
        </section>

        <!-- 본문: 좁으면 1열, 넓으면 8:4 -->
        <section class="dashboard__main">
            <LineChart
                title="채널별 일간 요청 수"
                description="웹·모바일 클라이언트에서 들어온 API 요청"
                :series="data.series"
                :height="chartHeight"
            />
            <BarChart
                title="서비스별 일평균 요청"
                description="상위 6개 서비스"
                :items="data.services"
            />
        </section>

        <EventTable :events="data.events" />
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import BarChart from '@/components/BarChart.vue';
import EventTable from '@/components/EventTable.vue';
import LineChart from '@/components/LineChart.vue';
import RangeFilter from '@/components/RangeFilter.vue';
import StatCard from '@/components/StatCard.vue';
import { useBreakpoint } from '@/composables/useBreakpoint';
import { fetchDashboard, RANGES } from '@/domains/dashboard/application/dashboardService';

const days = ref(30);
const data = ref(fetchDashboard(days.value));

watch(days, (value) => {
    data.value = fetchDashboard(value);
});

// 차트 "높이"는 CSS 로 표현할 수 없는 값이라 여기서만 브레이크포인트를 쓴다.
// 폭은 컴포넌트가 스스로 부모에 맞춘다.
const { isMobile, isTablet } = useBreakpoint();
const chartHeight = computed(() => (isMobile.value ? 200 : isTablet.value ? 240 : 300));

const rangeLabel = computed(() => `최근 ${days.value}일`);
const updatedAtText = computed(() =>
    data.value.updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
);
</script>

<style scoped lang="scss">
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
@use "@/styles/breakpoints" as *;

.dashboard__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: getRem(12);
}

.dashboard__title {
    @include font-fluid(20, 26, 600);
}

.dashboard__stats {
    // 220px 아래로는 카드가 읽히지 않으므로 그 폭을 하한으로 잡고 열 수는 맡긴다.
    // 1360px 컨테이너에서 4열 → 태블릿 2열 → 모바일 1열이 자동으로 나온다.
    @include auto-grid(220px, 16px);
}

.dashboard__main {
    display: grid;
    gap: getRem(16);
    // 기본(좁은 화면)은 1열. 넓어지면 8:4 로 나눈다.
    grid-template-columns: 1fr;
    // 칸마다 내용 높이가 다르다. 늘려 맞추면 짧은 카드 아래가 빈 채로 남는다.
    align-items: start;

    @include respond-up(lg) {
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    }
}
</style>
