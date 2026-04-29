<template>
  <a-select
    :value="locale"
    :options="languages"
    style="width: 90px"
    variant="borderless"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const languages = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

const { locale } = useI18n();

const handleChange = (value: string) => {
  locale.value = value;
  localStorage.setItem('i18nextLng', value);
};
</script>
