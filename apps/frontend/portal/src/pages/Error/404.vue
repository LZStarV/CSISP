<template>
  <div>{{ t('error.notFound', '404 Not Found') }}</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
