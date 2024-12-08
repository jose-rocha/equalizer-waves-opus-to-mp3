<script setup lang="ts">
// import { Platform } from 'quasar';

defineOptions({
  name: 'App',
});

// if (Platform.is.mobile) {
//   document.documentElement.style.scrollbarWidth = 'thin';
//   document.documentElement.style.scrollbarColor = '#1976D2 transparent';
//   document.documentElement.style.scrollBehavior = 'smooth';
// }
</script>

<template>
  <router-view />
</template>
