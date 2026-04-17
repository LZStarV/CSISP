<template>
  <div class="demo-component">
    <a-button type="primary" @click="handleClick">Hello Antd</a-button>
  </div>
</template>

<script setup lang="ts">
const handleClick = () => {
  // eslint-disable-next-line no-console
  console.log('Button clicked');
};
</script>

<style scoped>
.demo-component {
  padding: 20px;
}
</style>
