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

  // Getters
  const isGameActive = computed(() => gameState.value !== null)
  const hasLives = computed(() => gameState.value ? gameState.value.lives > 0 : false)
  const canAffordItem = computed(() => (cost: number) => 
    gameState.value ? gameState.value.gold >= cost : false
  )

  // Actions
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
      messages.value = response.messages
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const loadShop = async () => {
    if (!gameState.value) return
    
    try {
      const response = await gameApi.getShop(gameState.value.gameId)
      shopItems.value = response.items
    } catch (err) {
      console.error('Failed to load shop:', err)
    }
  }

  const solveMessage = async (adId: string) => {
    if (!gameState.value) return
    
    isLoading.value = true
    
    try {
      const response = await gameApi.solveMessage(gameState.value.gameId, adId)
      
      // Update game state
      gameState.value.lives = response.lives
      gameState.value.gold = response.gold
      gameState.value.score = response.score
      gameState.value.turn = response.turn
      
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
      
      // Update game state
      gameState.value.gold = response.gold
      gameState.value.lives = response.lives
      gameState.value.level = response.level
      gameState.value.turn = response.turn
      
      // Reload shop after purchase
      await loadShop()
      
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
    error.value = null
  }

  return {
    // State
    gameState,
    messages,
    shopItems,
    isLoading,
    error,
    
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
