import axios, { AxiosResponse } from 'axios';
import {
  GameStartResponse,
  Message,
  SolveResponse,
  ShopResponse,
  PurchaseResponse,
  ReputationResponse,
  ApiError,
  API_BASE_URL,
  ENDPOINTS
} from '@dragons-mugloar/shared';

export class GameApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async startGame(): Promise<GameStartResponse> {
    try {
      const response: AxiosResponse<GameStartResponse> = await axios.post(
        `${this.baseURL}${ENDPOINTS.START_GAME}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to start game');
    }
  }

  async getMessages(gameId: string): Promise<Message[]> {
    try {
      const response: AxiosResponse<Message[]> = await axios.get(
        `${this.baseURL}${ENDPOINTS.MESSAGES(gameId)}`
      );
      return response.data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get messages');
    }
  }

  async solveMessage(gameId: string, adId: string): Promise<SolveResponse> {
    try {
      const url = `${this.baseURL}${ENDPOINTS.SOLVE(gameId, adId)}`;
      /* console.log(`🔍 Making solve request to: ${url}`);
      console.log(`🔍 GameID: ${gameId}, AdID: ${adId}`); */
      
      const response: AxiosResponse<SolveResponse> = await axios.post(url);
      
      /* console.log(`✅ Solve response status: ${response.status}`); */
      return response.data;
    } catch (error) {
      console.error(`❌ Solve request failed:`);
      console.error(`   URL: ${this.baseURL}${ENDPOINTS.SOLVE(gameId, adId)}`);
      console.error(`   GameID: ${gameId}`);
      console.error(`   AdID: ${adId}`);
      if (axios.isAxiosError(error)) {
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Response data:`, error.response?.data);
      }
      throw this.handleError(error, 'Failed to solve message');
    }
  }

  async getShop(gameId: string): Promise<ShopResponse> {
    try {
      const response: AxiosResponse<ShopResponse> = await axios.get(
        `${this.baseURL}${ENDPOINTS.SHOP(gameId)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get shop');
    }
  }

  async buyItem(gameId: string, itemId: string): Promise<PurchaseResponse> {
    try {
      const response: AxiosResponse<PurchaseResponse> = await axios.post(
        `${this.baseURL}${ENDPOINTS.BUY(gameId, itemId)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to buy item');
    }
  }

  async getReputation(gameId: string): Promise<ReputationResponse> {
    try {
      const response: AxiosResponse<ReputationResponse> = await axios.post(
        `${this.baseURL}${ENDPOINTS.REPUTATION(gameId)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get reputation');
    }
  }

  private handleError(error: any, message: string): ApiError {
    if (axios.isAxiosError(error)) {
      return {
        message: `${message}: ${error.response?.data?.message || error.message}`,
        status: error.response?.status
      };
    }
    return {
      message: `${message}: ${error.message || 'Unknown error'}`
    };
  }
}
