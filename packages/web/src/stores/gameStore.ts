import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameState, Message, ShopItem } from '@dragons-mugloar/shared'
import { gameApi } from '../services/gameApi'

export const useGameStore = defineStore('game', () => {
  // State
  const gameState = ref<GameState | null>(null)
  const messages = ref<Message[]>([])
  const shopItems = ref<ShopItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const results = ref<Array<{
    id: string
    type: 'quest' | 'purchase'
    message: string
    success: boolean
    timestamp: Date
    details?: any
  }>>([])

  // Getters
  const isGameActive = computed(() => gameState.value !== null)
  const hasLives = computed(() => gameState.value ? gameState.value.lives > 0 : false)
  const canAffordItem = computed(() => (cost: number) => 
    gameState.value ? gameState.value.gold >= cost : false
  )

  // Actions
  const decodeBase64 = (encoded: string): string => {
    try {
      return atob(encoded)
    } catch (error) {
      return encoded
    }
  }

  const startNewGame = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const newGameState = await gameApi.startGame()
      gameState.value = newGameState
      await loadMessages()
      await loadShop()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start game'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadMessages = async () => {
    if (!gameState.value) return
    
    try {
      const response = await gameApi.getMessages(gameState.value.gameId)
      
      const processedMessages = response.map(msg => {
        if (msg.encrypted !== null) {
          const decodedMessage = decodeBase64(msg.message)
          const decodedProbability = decodeBase64(msg.probability)
          const decodedReward = decodeBase64(msg.reward.toString())
          const decodedAdId = decodeBase64(msg.adId)
          
          return {
            ...msg,
            message: decodedMessage,
            probability: decodedProbability,
            reward: parseInt(decodedReward) || msg.reward,
            adId: decodedAdId,
          }
        }
        return msg
      })
      
      messages.value = processedMessages
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      console.error('Failed to load messages:', err)
      error.value = errorMessage
    }
  }

  const loadShop = async () => {
    if (!gameState.value) return
    
    try {
      const response = await gameApi.getShop(gameState.value.gameId)
      shopItems.value = Array.isArray(response) ? response : response.items || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shop'
      console.error('Failed to load shop:', err)
      error.value = errorMessage
    }
  }

  const addResult = (type: 'quest' | 'purchase', message: string, success: boolean, details?: any) => {
    results.value.unshift({
      id: Date.now().toString(),
      type,
      message,
      success,
      timestamp: new Date(),
      details
    })
  }

  const solveMessage = async (adId: string, taskDescription: string) => {
    if (!gameState.value) return
    
    isLoading.value = true
    
    try {
      const response = await gameApi.solveMessage(gameState.value.gameId, adId)
      
      // Update game state
      gameState.value.lives = response.lives
      gameState.value.gold = response.gold
      gameState.value.score = response.score
      gameState.value.turn = response.turn

      const resultMessage = `You took on task ${taskDescription}\n${response.message}`
      
      // Add result to history
      addResult('quest', resultMessage, response.success, {
        goldChange: response.gold - (gameState.value.gold || 0),
        scoreChange: response.score - (gameState.value.score || 0),
        livesChange: response.lives - (gameState.value.lives || 0)
      })
      
      // Reload messages after solving
      await loadMessages()
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to solve message'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const buyItem = async (itemId: string) => {
    if (!gameState.value) return
    
    isLoading.value = true
    
    try {
      const response = await gameApi.buyItem(gameState.value.gameId, itemId)
      
      // Find the item name for the result message
      const item = shopItems.value.find(i => i.id === itemId)
      const itemName = item ? item.name : 'Unknown Item'
      
      // Update game state
      gameState.value.gold = response.gold
      gameState.value.lives = response.lives
      gameState.value.level = response.level
      gameState.value.turn = response.turn
      
      // Add result to history
      addResult('purchase', `Purchased ${itemName}`, true, {
        cost: item?.cost || 0,
        goldAfter: response.gold,
        livesAfter: response.lives,
        levelAfter: response.level
      })
      
      // Reload shop and messages after purchase
      await loadShop()
      await loadMessages()
      
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to buy item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resetGame = () => {
    gameState.value = null
    messages.value = []
    shopItems.value = []
    results.value = []
    error.value = null
  }

  return {
    // State
    gameState,
    messages,
    shopItems,
    isLoading,
    error,
    results,
    
    // Getters
    isGameActive,
    hasLives,
    canAffordItem,
    
    // Actions
    startNewGame,
    loadMessages,
    loadShop,
    solveMessage,
    buyItem,
    resetGame
  }
})
