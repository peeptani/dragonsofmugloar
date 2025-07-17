import axios from 'axios';
import { GameApiClient } from '../src/services/gameApi';
import {
  mockGameStartResponse,
  mockMessages,
  mockSolveResponse,
  mockShopResponse,
  mockPurchaseResponse,
  mockReputationResponse
} from './fixtures/gameData';
import { API_BASE_URL } from '@dragons-mugloar/shared';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('GameApiClient', () => {
  let apiClient: GameApiClient;

  beforeEach(() => {
    apiClient = new GameApiClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should use default base URL when none provided', () => {
      const client = new GameApiClient();
      expect(client).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const customUrl = 'https://custom-api.example.com';
      const client = new GameApiClient(customUrl);
      expect(client).toBeDefined();
    });
  });

  describe('startGame', () => {
    it('should successfully start a new game', async () => {
      mockAxios.post.mockResolvedValue({ 
        data: mockGameStartResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.startGame();

      expect(mockAxios.post).toHaveBeenCalledWith(`${API_BASE_URL}/game/start`);
      expect(result).toEqual(mockGameStartResponse);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxios.post.mockRejectedValue(networkError);

      await expect(apiClient.startGame()).rejects.toEqual({
        message: 'Failed to start game: Network Error'
      });
    });

    it('should handle HTTP errors with status codes', async () => {
      const httpError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        },
        message: 'Request failed with status code 500'
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(httpError);

      await expect(apiClient.startGame()).rejects.toEqual({
        message: 'Failed to start game: Internal Server Error',
        status: 500
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(timeoutError);

      await expect(apiClient.startGame()).rejects.toEqual({
        message: 'Failed to start game: timeout of 5000ms exceeded',
        status: undefined
      });
    });
  });

  describe('getMessages', () => {
    const gameId = 'test-game-123';

    it('should successfully retrieve messages', async () => {
      mockAxios.get.mockResolvedValue({ 
        data: mockMessages,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.getMessages(gameId);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_BASE_URL}/${gameId}/messages`);
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages available', async () => {
      mockAxios.get.mockResolvedValue({ 
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.getMessages(gameId);

      expect(result).toEqual([]);
    });

    it('should handle 404 not found errors', async () => {
      const notFoundError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Game not found' }
        }
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.get.mockRejectedValue(notFoundError);

      await expect(apiClient.getMessages(gameId)).rejects.toEqual({
        message: 'Failed to get messages: Game not found',
        status: 404
      });
    });
  });

  describe('solveMessage', () => {
    const gameId = 'test-game-123';
    const adId = 'msg-1';

    it('should successfully solve a message', async () => {
      mockAxios.post.mockResolvedValue({ 
        data: mockSolveResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.solveMessage(gameId, adId);

      expect(mockAxios.post).toHaveBeenCalledWith(`${API_BASE_URL}/${gameId}/solve/${adId}`);
      expect(result).toEqual(mockSolveResponse);
    });

    it('should handle solve failures with detailed logging', async () => {
      const solveError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Invalid quest' }
        },
        message: 'Bad Request'
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(solveError);

      await expect(apiClient.solveMessage(gameId, adId)).rejects.toEqual({
        message: 'Failed to solve message: Invalid quest',
        status: 400
      });
    });

    it('should handle malformed response data', async () => {
      mockAxios.post.mockResolvedValue({ 
        data: { incomplete: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.solveMessage(gameId, adId);

      expect(result).toEqual({ incomplete: 'data' });
    });
  });

  describe('getShop', () => {
    const gameId = 'test-game-123';

    it('should successfully retrieve shop items', async () => {
      mockAxios.get.mockResolvedValue({ 
        data: mockShopResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.getShop(gameId);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_BASE_URL}/${gameId}/shop`);
      expect(result).toEqual(mockShopResponse);
    });

    it('should handle empty shop', async () => {
      const emptyShop = { items: [] };
      mockAxios.get.mockResolvedValue({ 
        data: emptyShop,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.getShop(gameId);

      expect(result).toEqual(emptyShop);
    });
  });

  describe('buyItem', () => {
    const gameId = 'test-game-123';
    const itemId = 'item-1';

    it('should successfully purchase an item', async () => {
      mockAxios.post.mockResolvedValue({ 
        data: mockPurchaseResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.buyItem(gameId, itemId);

      expect(mockAxios.post).toHaveBeenCalledWith(`${API_BASE_URL}/${gameId}/shop/buy/${itemId}`);
      expect(result).toEqual(mockPurchaseResponse);
    });

    it('should handle insufficient funds error', async () => {
      const insufficientFundsError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Insufficient gold' }
        }
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(insufficientFundsError);

      await expect(apiClient.buyItem(gameId, itemId)).rejects.toEqual({
        message: 'Failed to buy item: Insufficient gold',
        status: 400
      });
    });

    it('should handle item not found error', async () => {
      const itemNotFoundError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Item not found' }
        }
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(itemNotFoundError);

      await expect(apiClient.buyItem(gameId, itemId)).rejects.toEqual({
        message: 'Failed to buy item: Item not found',
        status: 404
      });
    });
  });

  describe('getReputation', () => {
    const gameId = 'test-game-123';

    it('should successfully retrieve reputation', async () => {
      mockAxios.post.mockResolvedValue({ 
        data: mockReputationResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });

      const result = await apiClient.getReputation(gameId);

      expect(mockAxios.post).toHaveBeenCalledWith(`${API_BASE_URL}/${gameId}/investigate/reputation`);
      expect(result).toEqual(mockReputationResponse);
    });

    it('should handle reputation errors', async () => {
      const reputationError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Reputation service unavailable' }
        }
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(reputationError);

      await expect(apiClient.getReputation(gameId)).rejects.toEqual({
        message: 'Failed to get reputation: Reputation service unavailable',
        status: 500
      });
    });
  });

  describe('error handling', () => {
    it('should handle non-axios errors', async () => {
      const genericError = new Error('Generic error');
      (mockAxios.isAxiosError as any).mockReturnValue(false);
      mockAxios.post.mockRejectedValue(genericError);

      await expect(apiClient.startGame()).rejects.toEqual({
        message: 'Failed to start game: Generic error'
      });
    });

    it('should handle unknown errors', async () => {
      const unknownError = 'string error';
      (mockAxios.isAxiosError as any).mockReturnValue(false);
      mockAxios.post.mockRejectedValue(unknownError);

      await expect(apiClient.startGame()).rejects.toEqual({
        message: 'Failed to start game: Unknown error'
      });
    });

    it('should handle axios errors without response data', async () => {
      const axiosErrorNoResponse = {
        isAxiosError: true,
        message: 'Network Error',
        response: undefined
      };
      
      (mockAxios.isAxiosError as any).mockReturnValue(true);
      mockAxios.post.mockRejectedValue(axiosErrorNoResponse);

      await expect(apiClient.startGame()).rejects.toEqual({
        message: 'Failed to start game: Network Error',
        status: undefined
      });
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const gameId = 'test-game-123';
      
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('messages')) {
          return Promise.resolve({ data: mockMessages } as any);
        }
        if (url.includes('shop')) {
          return Promise.resolve({ data: mockShopResponse } as any);
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const [messagesResult, shopResult] = await Promise.all([
        apiClient.getMessages(gameId),
        apiClient.getShop(gameId)
      ]);

      expect(messagesResult).toEqual(mockMessages);
      expect(shopResult).toEqual(mockShopResponse);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
