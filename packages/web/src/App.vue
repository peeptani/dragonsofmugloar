<template>
  <div id="app">
    <header class="app-header">
      <h1>🐉 Dragons of Mugloar 🐉</h1>
      <p>Conquer the realm and achieve 1000+ points!</p>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped>
.app-header {
  text-align: center;
  padding: 2rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  margin: 1rem;
  color: white;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.app-header p {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  padding: 1rem;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
