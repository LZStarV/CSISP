<template>
  <n-button quaternary circle @click="themeStore.toggleTheme">
    <template #icon>
      <n-icon size="20">
        <Sunny v-if="themeStore.currentTheme === THEME.DARK" />
        <Moon v-else />
      </n-icon>
    </template>
  </n-button>
</template>

<script setup lang="ts">
import { Moon, Sunny } from '@vicons/ionicons5';

import { useThemeStore, THEME } from '@/stores/theme';

const themeStore = useThemeStore();
</script>
