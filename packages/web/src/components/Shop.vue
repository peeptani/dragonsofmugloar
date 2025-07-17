<template>
  <div class="shop">
    <div v-if="gameStore.shopItems.length === 0" class="no-items">
      No items available in the shop
    </div>
    
    <div v-else class="shop-grid">
      <div 
        v-for="item in sortedItems" 
        :key="item.id"
        class="shop-item"
        :class="{ 'affordable': canAfford(item.cost), 'expensive': !canAfford(item.cost) }"
      >
        <div class="item-header">
          <h3 class="item-name">{{ item.name }}</h3>
          <div class="item-cost">
            <span class="cost-value">{{ item.cost }}</span>
            <span class="cost-currency">Gold</span>
          </div>
        </div>
        
        <div class="item-actions">
          <button 
            @click="buyItem(item.id)"
            :disabled="gameStore.isLoading || !canAfford(item.cost)"
            class="buy-button"
            :class="{ 'can-afford': canAfford(item.cost) }"
          >
            {{ gameStore.isLoading ? 'Purchasing...' : getBuyButtonText(item.cost) }}
          </button>
        </div>
        
        <div class="affordability-indicator" :class="getAffordabilityClass(item.cost)">
          {{ getAffordabilityText(item.cost) }}
        </div>
      </div>
    </div>
    
    <div class="shop-info">
      <p class="info-text">
        💡 Items may provide various benefits to improve your dragon's abilities
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

const sortedItems = computed(() => {
  return [...gameStore.shopItems].sort((a, b) => a.cost - b.cost)
})

const canAfford = (cost: number): boolean => {
  return gameStore.gameState ? gameStore.gameState.gold >= cost : false
}

const getBuyButtonText = (cost: number): string => {
  if (!canAfford(cost)) {
    const needed = cost - (gameStore.gameState?.gold || 0)
    return `Need ${needed} more gold`
  }
  return 'Purchase'
} 

const getAffordabilityClass = (cost: number): string => {
  if (!gameStore.gameState) return 'unknown'
  
  const gold = gameStore.gameState.gold
  if (gold >= cost) return 'affordable'
  if (gold >= cost * 0.75) return 'almost'
  return 'expensive'
}

const getAffordabilityText = (cost: number): string => {
  if (!gameStore.gameState) return ''
  
  const gold = gameStore.gameState.gold
  if (gold >= cost) return 'Affordable'
  if (gold >= cost * 0.75) return 'Almost Affordable'
  return 'Too Expensive'
}

const buyItem = async (itemId: string) => {
  try {
    const result = await gameStore.buyItem(itemId)
    if (result) {
      console.log('Item purchased successfully!')
    } else {
      console.log('Purchase failed!')
    }
  } catch (error) {
    console.error('Error buying item:', error)
  }
}
</script>

<style scoped>
.shop {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.no-items {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin: 2rem 0;
}

.shop-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  max-height: 450px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.shop-item {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.shop-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.shop-item.affordable {
  border-color: #27ae60;
}

.shop-item.expensive {
  border-color: #e74c3c;
  opacity: 0.7;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.item-name {
  margin: 0;
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

.item-cost {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cost-value {
  background: linear-gradient(45deg, #f39c12, #e67e22);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: bold;
  font-size: 0.9rem;
}

.cost-currency {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

.item-actions {
  display: flex;
  justify-content: center;
}

.buy-button {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  border: none;
  border-radius: 20px;
  color: white;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 100%;
  font-size: 0.9rem;
}

.buy-button.can-afford {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
}

.buy-button:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.buy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.affordability-indicator {
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

.affordability-indicator.affordable {
  background: #27ae60;
  color: white;
}

.affordability-indicator.almost {
  background: #f39c12;
  color: white;
}

.affordability-indicator.expensive {
  background: #e74c3c;
  color: white;
}

.shop-info {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.info-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin: 0 0 0.5rem 0;
  text-align: center;
  font-style: italic;
}

/* Custom scrollbar */
.shop-grid::-webkit-scrollbar {
  width: 8px;
}

.shop-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.shop-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.shop-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
