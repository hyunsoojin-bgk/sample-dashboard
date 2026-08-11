import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '@/pages/DashboardPage.vue';

const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: DashboardPage,
        meta: { title: '서비스 운영 개요' },
    },
    // 없는 경로는 대시보드로 돌린다 (GitHub Pages 의 404 → index.html 폴백과 짝을 이룬다)
    { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
    // BASE_URL 은 vite.config.js 의 base 값. 서브 경로 배포(/sample-dashboard/)에서 필요하다.
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
});

router.afterEach((to) => {
    document.title = to.meta?.title ? `${to.meta.title} · Sample Dashboard` : 'Sample Dashboard';
});

export default router;
