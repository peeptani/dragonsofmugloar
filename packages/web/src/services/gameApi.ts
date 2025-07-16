import axios from 'axios'
import type {
  GameStartResponse,
  Message,
  SolveResponse,
  ShopResponse,
  PurchaseResponse,
  ReputationResponse
} from '@dragons-mugloar/shared'

const API_BASE_URL = 'https://dragonsofmugloar.com/api/v2'

class GameApi {
  async startGame(): Promise<GameStartResponse> {
    const response = await axios.post(`${API_BASE_URL}/game/start`)
    return response.data
  }

  async getMessages(gameId: string): Promise<Message[]> {
    const response = await axios.get(`${API_BASE_URL}/${gameId}/messages`)
    return response.data || []
  }

  async solveMessage(gameId: string, adId: string): Promise<SolveResponse> {
    const response = await axios.post(`${API_BASE_URL}/${gameId}/solve/${adId}`)
    return response.data
  }

  async getShop(gameId: string): Promise<ShopResponse> {
    const response = await axios.get(`${API_BASE_URL}/${gameId}/shop`)
    return response.data
  }

  async buyItem(gameId: string, itemId: string): Promise<PurchaseResponse> {
    const response = await axios.post(`${API_BASE_URL}/${gameId}/shop/buy/${itemId}`)
    return response.data
  }

  async getReputation(gameId: string): Promise<ReputationResponse> {
    const response = await axios.post(`${API_BASE_URL}/${gameId}/investigate/reputation`)
    return response.data
  }
}

export const gameApi = new GameApi()
