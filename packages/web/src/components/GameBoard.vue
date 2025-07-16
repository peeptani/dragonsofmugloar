<template>
  <div class="game-board">
    <!-- Game Status Panel -->
    <div class="status-panel" v-if="gameStore.gameState">
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">Score</span>
          <span class="status-value score">{{ gameStore.gameState.score }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Lives</span>
          <span class="status-value lives">{{ gameStore.gameState.lives }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Gold</span>
          <span class="status-value gold">{{ gameStore.gameState.gold }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Level</span>
          <span class="status-value level">{{ gameStore.gameState.level }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Turn</span>
          <span class="status-value turn">{{ gameStore.gameState.turn }}</span>
        </div>
        <div class="status-item">
          <span class="status-label">High Score</span>
          <span class="status-value high-score">{{ gameStore.gameState.highScore }}</span>
        </div>
      </div>
    </div>

    <!-- Start Game Section -->
    <div class="start-section" v-if="!gameStore.isGameActive">
      <button 
        @click="startGame" 
        :disabled="gameStore.isLoading"
        class="start-button"
      >
        {{ gameStore.isLoading ? 'Starting...' : 'Start New Game' }}
      </button>
    </div>

    <!-- Game Content -->
    <div class="game-content" v-if="gameStore.isGameActive">
      <div class="content-grid">
        <!-- Messages Section -->
        <div class="section messages-section">
          <h2>Available Quests</h2>
          <MessageList />
        </div>

        <!-- Shop Section -->
        <div class="section shop-section">
          <h2>Dragon Shop</h2>
          <Shop />
        </div>
      </div>

      <!-- Game Actions -->
      <div class="actions-section">
        <button @click="gameStore.resetGame" class="secondary-button">
          Reset Game
        </button>
        <button @click="refreshData" :disabled="gameStore.isLoading" class="secondary-button">
          {{ gameStore.isLoading ? 'Refreshing...' : 'Refresh Data' }}
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="gameStore.error" class="error-message">
      {{ gameStore.error }}
    </div>

    <!-- Victory Message -->
    <div v-if="gameStore.gameState && gameStore.gameState.score >= 1000" class="victory-message">
      🎉 Congratulations! You've achieved the target score of 1000+ points! 🎉
    </div>

    <!-- Game Over Message -->
    <div v-if="gameStore.gameState && !gameStore.hasLives" class="game-over-message">
      💀 Game Over! No lives remaining. Final score: {{ gameStore.gameState.score }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'
import MessageList from './MessageList.vue'
import Shop from './Shop.vue'

const gameStore = useGameStore()

const startGame = async () => {
  try {
    await gameStore.startNewGame()
  } catch (error) {
    console.error('Failed to start game:', error)
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      gameStore.loadMessages(),
      gameStore.loadShop()
    ])
  } catch (error) {
    console.error('Failed to refresh data:', error)
  }
}
</script>

<style scoped>
.game-board {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.status-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.status-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.status-value.score {
  color: #ffd700;
}

.status-value.lives {
  color: #ff6b6b;
}

.status-value.gold {
  color: #f39c12;
}

.start-section {
  text-align: center;
  margin: 3rem 0;
}

.start-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.start-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.start-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.section h2 {
  margin: 0 0 1rem 0;
  color: white;
  text-align: center;
  font-size: 1.3rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.actions-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.secondary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 1rem;
  border-radius: 10px;
  margin: 1rem 0;
  text-align: center;
  font-weight: bold;
}

.victory-message {
  background: rgba(46, 204, 113, 0.9);
  color: white;
  padding: 1.5rem;
  border-radius: 15px;
  margin: 1rem 0;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  animation: pulse 2s infinite;
}

.game-over-message {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 1.5rem;
  border-radius: 15px;
  margin: 1rem 0;
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
</style>
