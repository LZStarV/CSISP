<template>
  <n-select
    :value="localeStore.currentLocale"
    :options="LOCALE_OPTIONS"
    style="width: 90px"
    @update:value="handleChange"
  />
</template>

<script setup lang="ts">
import { LOCALE_OPTIONS } from '@/constants';
import { useLocaleStore } from '@/stores/locale';
import type { SupportedLocale } from '@/types';

const localeStore = useLocaleStore();

const handleChange = (value: string) => {
  localeStore.setLocale(value as SupportedLocale);
};
</script>
