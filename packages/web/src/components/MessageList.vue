<template>
  <div class="message-list">
    <div v-if="gameStore.messages.length === 0" class="no-messages">
      No quests available at the moment
    </div>
    
    <div v-else class="messages-grid">
      <div 
        v-for="message in sortedMessages" 
        :key="message.adId"
        class="message-card"
        :class="{ 'expiring-soon': message.expiresIn <= 2 }"
      >
        <div class="message-header">
          <span class="reward">{{ message.reward }} Gold</span>
          <span class="expires" :class="{ 'urgent': message.expiresIn <= 2 }">
            Expires in {{ message.expiresIn }} turns
          </span>
        </div>
        
        <div class="message-content">
          <p>{{ message.message }}</p>
        </div>
        
        <div class="message-actions">
          <button 
            @click="solveMessage(message.adId, message.message)"
            :disabled="gameStore.isLoading || !gameStore.hasLives"
            class="solve-button"
            :class="{ 'high-reward': getRewardValue(String(message.reward)) >= 100 }"
          >
            {{ gameStore.isLoading ? 'Solving...' : 'Accept Quest' }}
          </button>
        </div>
        
        <div class="difficulty-indicator" :class="getDifficultyClass(message)">
          {{ getDifficultyLabel(message) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import type { Message } from '@dragons-mugloar/shared'
import { PROBABILITY_SCORES } from '@dragons-mugloar/shared'

const gameStore = useGameStore()

const sortedMessages = computed(() => {
  return [...gameStore.messages].sort((a, b) => {
    // Sort by reward (descending) then by expiration (ascending)
    const rewardA = getRewardValue(String(a.reward))
    const rewardB = getRewardValue(String(b.reward))
    
    if (rewardA !== rewardB) {
      return rewardB - rewardA
    }
    
    return a.expiresIn - b.expiresIn
  })
})

const getRewardValue = (reward: string): number => {
  return parseInt(reward) || 0
}

const getDifficultyClass = (message: Message): string => {
  const score = PROBABILITY_SCORES[message.probability] ?? 0;
  if (score >= 8) return 'common';
  if (score >= 6) return 'rare';
  if (score >= 4) return 'epic';
  if (score >= 2) return 'legendary';
  return 'impossible';     
};

const getDifficultyLabel = (message: Message): string => {
  return message.probability;
};

const solveMessage = async (adId: string, taskDescription: string) => {
  try {
    const result = await gameStore.solveMessage(adId, taskDescription)
    if (result?.success) {
      console.log('Quest completed successfully!')
    } else {
      console.log('Quest failed!')
    }
  } catch (error) {
    console.error('Error solving message:', error)
  }
}
</script>

<style scoped>
.message-list {
  height: 100%;
}

.no-messages {
  text-align: center;
  color: #b8c5b8;
  font-style: italic;
  margin: 2rem 0;
}

.messages-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.message-card {
  background: rgba(155, 184, 143, 0.15);
  border: 1px solid rgba(168, 191, 168, 0.3);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.message-card:hover {
  background: rgba(155, 184, 143, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(58, 66, 58, 0.4);
}

.message-card.expiring-soon {
  border-color: #e74c3c;
  animation: glow 2s infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 5px rgba(231, 76, 60, 0.5); }
  to { box-shadow: 0 0 15px rgba(231, 76, 60, 0.8); }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.reward {
  background: linear-gradient(45deg, #9bb88f, #8b9a7d);
  color: #2f362f;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: bold;
  font-size: 0.9rem;
}

.expires {
  font-size: 0.8rem;
  color: #b8c5b8;
}

.expires.urgent {
  color: #e74c3c;
  font-weight: bold;
}

.message-content {
  color: #d8e5d8;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.message-content p {
  margin: 0;
  font-size: 0.95rem;
}

.message-actions {
  display: flex;
  justify-content: center;
}

.solve-button {
  background: linear-gradient(45deg, #7a8471, #5e6b54);
  border: none;
  border-radius: 20px;
  color: #d8e5d8;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 100%;
}

.solve-button:hover:not(:disabled) {
  background: linear-gradient(45deg, #5e6b54, #2f362f);
  transform: translateY(-1px);
}

.solve-button.high-reward {
  background: linear-gradient(45deg, #9bb88f, #a8bfa8);
  color: #2f362f;
}

.solve-button.high-reward:hover:not(:disabled) {
  background: linear-gradient(45deg, #a8bfa8, #7a8471);
}

.solve-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.difficulty-indicator {
  position: absolute;
  top: -4px;
  right: 10px;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.difficulty-indicator.impossible {
  background: #c0392b;
  color: white;
}

.difficulty-indicator.common {
  background: #b8c5b8;
  color: #2f362f;
}

.difficulty-indicator.rare {
  background: #7a8471;
  color: #d8e5d8;
}

.difficulty-indicator.epic {
  background: #9bb88f;
  color: #2f362f;
}

.difficulty-indicator.legendary {
  background: linear-gradient(45deg, #a8bfa8, #9bb88f);
  color: #2f362f;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
  100% { filter: brightness(1); }
}

/* Custom scrollbar */
.messages-grid::-webkit-scrollbar {
  width: 8px;
}

.messages-grid::-webkit-scrollbar-track {
  background: rgba(168, 191, 168, 0.1);
  border-radius: 4px;
}

.messages-grid::-webkit-scrollbar-thumb {
  background: #9bb88f;
  border-radius: 4px;
}

.messages-grid::-webkit-scrollbar-thumb:hover {
  background: #a8bfa8;
}
</style>
