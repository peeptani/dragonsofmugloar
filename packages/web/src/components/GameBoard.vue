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

      <!-- Results Panel -->
      <div class="section results-section">
        <h2>Activity Log</h2>
        <div class="results-container">
          <div v-if="gameStore.results.length === 0" class="no-results">
            No activity yet. Complete quests or buy items to see results here.
          </div>
          <div v-else class="results-list">
            <div 
              v-for="result in gameStore.results" 
              :key="result.id"
              class="result-item"
              :class="{ 'success': result.success, 'failure': !result.success, 'purchase': result.type === 'purchase' }"
            >
              <div class="result-header">
                <span class="result-type">{{ result.type === 'quest' ? '⚔️' : '🛒' }}</span>
                <span class="result-message">{{ result.message }}</span>
                <span class="result-time">{{ formatTime(result.timestamp) }}</span>
              </div>
              <div v-if="result.details" class="result-details">
                <span v-if="result.type === 'quest' && result.details.goldChange" class="detail-item">
                  💰 {{ result.details.goldChange > 0 ? '+' : '' }}{{ result.details.goldChange }} gold
                </span>
                <span v-if="result.type === 'quest' && result.details.scoreChange" class="detail-item">
                  ⭐ {{ result.details.scoreChange > 0 ? '+' : '' }}{{ result.details.scoreChange }} score
                </span>
                <span v-if="result.type === 'quest' && result.details.livesChange" class="detail-item">
                  💖 {{ result.details.livesChange > 0 ? '+' : '' }}{{ result.details.livesChange }} lives
                </span>
                <span v-if="result.type === 'purchase'" class="detail-item">
                  💰 -{{ result.details.cost }} gold
                </span>
              </div>
            </div>
          </div>
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

    <!-- Toast Container -->
    <div class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="toast"
        :class="[toast.type, { 'show': toast.show }]"
      >
        <span class="toast-message">{{ toast.message }}</span>
        <button @click="removeToast(toast.id)" class="toast-close">×</button>
      </div>
    </div>

    <!-- Game Over Modal -->
    <div v-if="gameStore.isGameOver" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>🎮 Game Over</h2>
        </div>
        <div class="modal-body">
          <div class="game-over-stats" v-if="gameStore.gameState">
            <div class="stat-item">
              <span class="stat-label">Final Score</span>
              <span class="stat-value">{{ gameStore.gameState.score }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Level Reached</span>
              <span class="stat-value">{{ gameStore.gameState.level }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Gold Collected</span>
              <span class="stat-value">{{ gameStore.gameState.gold }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Turns Survived</span>
              <span class="stat-value">{{ gameStore.gameState.turn }}</span>
            </div>
          </div>
          <p class="game-over-message">
            {{ (gameStore.gameState?.score || 0) >= 1000 ? 
              '🎉 Congratulations! You reached the target score!' : 
              '💀 Your dragon has fallen in battle. Better luck next time!' 
            }}
          </p>
        </div>
        <div class="modal-actions">
          <button @click="startGame" class="primary-button">
            🎮 Start New Game
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import MessageList from './MessageList.vue'
import Shop from './Shop.vue'

const gameStore = useGameStore()

// Toast system
const toasts = ref<Array<{
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  show: boolean
}>>([])

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const id = Date.now().toString()
  const toast = {
    id,
    message,
    type,
    show: true
  }
  
  toasts.value.push(toast)
  
  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value[index].show = false
    setTimeout(() => {
      toasts.value.splice(index, 1)
    }, 300)
  }
}

// Watch for errors
watch(() => gameStore.error, (newError) => {
  if (newError) {
    showToast(`❌ ${newError}`, 'error')
    setTimeout(() => {
      gameStore.error = null
    }, 100)
  }
})

// Watch for victory condition
const previousScore = ref(0)
watch(() => gameStore.gameState?.score, (newScore) => {
  if (newScore !== undefined && newScore >= 1000 && previousScore.value < 1000) {
    showToast('🎉 Congratulations! You\'ve achieved the target score of 1000+ points! 🎉', 'success')
  }
  if (newScore !== undefined) {
    previousScore.value = newScore
  }
})

// Watch for game over condition
const previousLives = ref(0)
watch(() => gameStore.gameState?.lives, (newLives) => {
  if (newLives !== undefined && newLives <= 0 && previousLives.value > 0) {
    showToast(`💀 Game Over! No lives remaining. Final score: ${gameStore.gameState?.score || 0}`, 'error')
  }
  if (newLives !== undefined) {
    previousLives.value = newLives
  }
})

// Initialize previous values when game starts
watch(() => gameStore.gameState, (newState) => {
  if (newState) {
    previousScore.value = newState.score || 0
    previousLives.value = newState.lives || 0
  }
}, { immediate: true })

// Watch for game over status
watch(() => gameStore.isGameOver, (isOver) => {
  if (isOver) {
    showToast('💀 Game Over! Your dragon has fallen.', 'error')
  }
})

const startGame = async () => {
  try {
    await gameStore.startNewGame()
    showToast('🎮 New game started! Good luck!', 'success')
  } catch (error) {
    console.error('Failed to start game:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to start game'
    showToast(`❌ ${errorMessage}`, 'error')
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      gameStore.loadMessages(),
      gameStore.loadShop()
    ])
    showToast('📡 Data refreshed successfully', 'success')
  } catch (error) {
    console.error('Failed to refresh data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data'
    showToast(`❌ ${errorMessage}`, 'error')
  }
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  return timestamp.toLocaleTimeString()
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

.results-section {
  margin-bottom: 2rem;
}

.results-container {
  max-height: 400px;
  overflow-y: auto;
}

.no-results {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  padding: 2rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.result-item.success {
  border-left: 4px solid #27ae60;
}

.result-item.failure {
  border-left: 4px solid #e74c3c;
}

.result-item.purchase {
  border-left: 4px solid #f39c12;
}

.result-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.result-type {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.result-message {
  white-space: pre-wrap;
  color: white;
  font-weight: 500;
  flex: 1;
}

.result-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  flex-shrink: 0;
}

.result-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.detail-item {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Custom scrollbar for results */
.results-container::-webkit-scrollbar {
  width: 8px;
}

.results-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.results-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.results-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
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
/* Toast Styles */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;
}

.toast.show {
  transform: translateX(0);
  opacity: 1;
}

.toast.success {
  border-left-color: #27ae60;
  background: rgba(46, 204, 113, 0.95);
  color: white;
}

.toast.error {
  border-left-color: #e74c3c;
  background: rgba(231, 76, 60, 0.95);
  color: white;
}

.toast.warning {
  border-left-color: #f39c12;
  background: rgba(243, 156, 18, 0.95);
  color: white;
}

.toast.info {
  border-left-color: #3498db;
  background: rgba(52, 152, 219, 0.95);
  color: white;
}

.toast-message {
  flex: 1;
  font-weight: 500;
  margin-right: 1rem;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

.modal {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.modal-body {
  margin-bottom: 2rem;
}

.game-over-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.game-over-message {
  text-align: center;
  font-size: 1.1rem;
  color: #333;
  margin: 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.primary-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
