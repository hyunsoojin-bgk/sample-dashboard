import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Vercel 은 도메인 루트로 서비스하므로 base 는 '/'.
// 서브 경로(예: GitHub Pages 의 /<repo>/)에 올릴 일이 생기면 BASE_PATH 만 넣으면 된다.
export default defineConfig({
    base: process.env.BASE_PATH || '/',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5173,
        host: true, // 같은 네트워크의 모바일 기기에서 실제 반응형 확인용
    },
});
