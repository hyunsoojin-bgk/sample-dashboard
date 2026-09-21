<template>
    <DefaultLayout>
        <IframeUserInfoBanner />
        <RouterView />
    </DefaultLayout>
</template>

<script setup>
import { RouterView } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import IframeUserInfoBanner from '@/components/IframeUserInfoBanner.vue';
</script>
