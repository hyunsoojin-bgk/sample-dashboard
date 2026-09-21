<template>
    <DefaultLayout>
        <IframeIdTokenBanner />
        <RouterView />
    </DefaultLayout>
</template>

<script setup>
import { RouterView } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import IframeIdTokenBanner from '@/components/IframeIdTokenBanner.vue';
</script>
