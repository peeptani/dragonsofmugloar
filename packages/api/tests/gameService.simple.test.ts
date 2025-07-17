import { GameService } from '../src/services/gameService';
import { GameApiClient } from '../src/services/gameApi';
import { GAME_CONSTANTS, PROBABILITY_SCORES } from '@dragons-mugloar/shared';
import { 
  mockGameStartResponse, 
  mockGameState, 
  mockMessages, 
  mockShopResponse, 
  mockSolveResponse 
} from './fixtures/gameData';

// Mock the GameApiClient
jest.mock('../src/services/gameApi');
const mockApiClient = jest.mocked(GameApiClient);

describe('GameService Unit Tests', () => {
  let gameService: GameService;
  let apiClientInstance: jest.Mocked<GameApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mocked instance
    apiClientInstance = {
      startGame: jest.fn(),
      getMessages: jest.fn(),
      solveMessage: jest.fn(),
      getShop: jest.fn(),
      buyItem: jest.fn(),
      getReputation: jest.fn(),
    } as any;

    // Mock the constructor to return our mocked instance
    mockApiClient.mockImplementation(() => apiClientInstance);
    
    gameService = new GameService();
  });

  describe('initialization', () => {
    it('should create a new instance with no active game', () => {
      expect(gameService['gameState']).toBeNull();
      expect(gameService.getLogs()).toEqual([]);
    });
  });

  describe('startNewGame', () => {
    it('should start a new game successfully', async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);

      const result = await gameService.startNewGame();

      expect(apiClientInstance.startGame).toHaveBeenCalled();
      expect(result).toEqual({
        gameId: mockGameStartResponse.gameId,
        lives: mockGameStartResponse.lives,
        gold: mockGameStartResponse.gold,
        level: mockGameStartResponse.level,
        score: mockGameStartResponse.score,
        highScore: mockGameStartResponse.highScore,
        turn: mockGameStartResponse.turn
      });
    });

    it('should reset logs when starting new game', async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);
      
      // Add some logs first
      gameService['logs'] = ['old log'];
      
      await gameService.startNewGame();
      
      expect(gameService.getLogs()).toEqual([]);
    });
  });

  describe('message selection', () => {
    beforeEach(async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);
      await gameService.startNewGame();
    });

    it('should select message with highest probability score', () => {
      const messages = [
        { adId: 'low', message: 'Low priority', reward: 100, expiresIn: 10, encrypted: null, probability: 'Gamble' },
        { adId: 'high', message: 'High priority', reward: 50, expiresIn: 10, encrypted: null, probability: 'Walk in the park' },
      ];

      const bestMessage = gameService['selectBestMessage'](messages);
      
      expect(bestMessage?.adId).toBe('high'); // Walk in the park has higher probability score
    });

    it('should prefer higher reward when probability scores are equal', () => {
      const messages = [
        { adId: 'low-reward', message: 'Low reward', reward: 50, expiresIn: 10, encrypted: null, probability: 'Walk in the park' },
        { adId: 'high-reward', message: 'High reward', reward: 100, expiresIn: 10, encrypted: null, probability: 'Walk in the park' },
      ];

      const bestMessage = gameService['selectBestMessage'](messages);
      
      expect(bestMessage?.adId).toBe('high-reward');
    });

    it('should avoid messages about to expire', () => {
      const messages = [
        { adId: 'expiring', message: 'Expiring soon', reward: 1000, expiresIn: 1, encrypted: null, probability: 'Walk in the park' },
        { adId: 'stable', message: 'Stable', reward: 50, expiresIn: 10, encrypted: null, probability: 'Gamble' },
      ];

      const bestMessage = gameService['selectBestMessage'](messages);
      
      expect(bestMessage?.adId).toBe('stable');
    });
  });

  describe('base64 decoding', () => {
    it('should decode base64 strings correctly', () => {
      const encoded = Buffer.from('hello world', 'utf-8').toString('base64');
      const decoded = gameService['decodeBase64'](encoded);
      
      expect(decoded).toBe('hello world');
    });

    it('should handle invalid base64 input', () => {
      const invalidBase64 = 'not-base64!@#';
      const result = gameService['decodeBase64'](invalidBase64);
      
      // Base64 decoder will decode whatever it can, so we just expect it not to crash
      expect(typeof result).toBe('string');
    });
  });

  describe('shopping logic', () => {
    beforeEach(async () => {
      apiClientInstance.startGame.mockResolvedValue({ ...mockGameStartResponse, gold: 1000 });
      apiClientInstance.getShop.mockResolvedValue(mockShopResponse);
      await gameService.startNewGame();
    });

    it('should buy healing items when lives are low', async () => {
      // Set low lives
      gameService['gameState'] = { ...gameService['gameState']!, lives: 1 };
      
      const healingShop = {
        items: [
          { id: 'healing-potion', name: 'Healing Potion', cost: 50 },
          { id: 'expensive-item', name: 'Expensive Item', cost: 500 }
        ]
      };
      
      apiClientInstance.getShop.mockResolvedValue(healingShop);
      apiClientInstance.buyItem.mockResolvedValue({ gold: 950, lives: 2, level: 1, turn: 1 });

      await gameService['considerShopping']();

      expect(apiClientInstance.buyItem).toHaveBeenCalledWith(
        mockGameStartResponse.gameId,
        'healing-potion'
      );
    });

    it('should buy most expensive affordable item when not in danger', async () => {
      apiClientInstance.buyItem.mockResolvedValue({ gold: 500, lives: 3, level: 1, turn: 1 });

      await gameService['considerShopping']();

      // Should buy the most expensive item it can afford
      expect(apiClientInstance.buyItem).toHaveBeenCalled();
    });

    it('should not buy items if insufficient gold', async () => {
      gameService['gameState'] = { ...gameService['gameState']!, gold: 10 };
      
      await gameService['considerShopping']();

      expect(apiClientInstance.buyItem).not.toHaveBeenCalled();
    });
  });

  describe('turn logic', () => {
    beforeEach(async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);
      apiClientInstance.getShop.mockResolvedValue({ items: [] });
      apiClientInstance.getMessages.mockResolvedValue(mockMessages);
      apiClientInstance.solveMessage.mockResolvedValue(mockSolveResponse);
      await gameService.startNewGame();
    });

    it('should process turn with shopping and message solving', async () => {
      await gameService['playTurn']();

      expect(apiClientInstance.getShop).toHaveBeenCalled();
      expect(apiClientInstance.getMessages).toHaveBeenCalled();
      expect(apiClientInstance.solveMessage).toHaveBeenCalled();
    });

    it('should handle empty message list gracefully', async () => {
      apiClientInstance.getMessages.mockResolvedValue([]);

      await gameService['playTurn']();

      expect(apiClientInstance.solveMessage).not.toHaveBeenCalled();
    });

    it('should decode encrypted messages', async () => {
      const encryptedMessage = {
        adId: Buffer.from('encrypted-id', 'utf-8').toString('base64'),
        message: Buffer.from('Secret mission', 'utf-8').toString('base64'),
        reward: 100,
        expiresIn: 10,
        encrypted: 1,
        probability: Buffer.from('Walk in the park', 'utf-8').toString('base64')
      };
      
      apiClientInstance.getMessages.mockResolvedValue([encryptedMessage]);

      const selectBestMessageSpy = jest.spyOn(gameService as any, 'selectBestMessage');
      
      await gameService['playTurn']();

      const decodedMessages = selectBestMessageSpy.mock.calls[0][0] as any[];
      expect(decodedMessages[0].message).toBe('Secret mission');
      expect(decodedMessages[0].probability).toBe('Walk in the park');
    });
  });

  describe('logging', () => {
    it('should log game events', async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);
      apiClientInstance.getShop.mockResolvedValue({ items: [] });
      apiClientInstance.getMessages.mockResolvedValue([]);
      
      await gameService.startNewGame();
      
      // Mock state to complete quickly
      gameService['gameState'] = { ...gameService['gameState']!, score: GAME_CONSTANTS.TARGET_SCORE };
      
      await gameService.playGame();
      
      const logs = gameService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toContain('Starting game');
    });

    it('should clear logs on new game', async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);
      apiClientInstance.getShop.mockResolvedValue({ items: [] });
      apiClientInstance.getMessages.mockResolvedValue([]);
      
      // Start first game and play to generate logs
      await gameService.startNewGame();
      gameService['gameState'] = { ...gameService['gameState']!, score: GAME_CONSTANTS.TARGET_SCORE };
      await gameService.playGame();
      expect(gameService.getLogs().length).toBeGreaterThan(0);
      
      // Start second game - logs should be reset
      await gameService.startNewGame();
      
      expect(gameService.getLogs().length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      apiClientInstance.startGame.mockRejectedValue(new Error('API Error'));

      await expect(gameService.startNewGame()).rejects.toThrow('API Error');
    });

    it('should handle solve message errors', async () => {
      apiClientInstance.startGame.mockResolvedValue(mockGameStartResponse);
      apiClientInstance.getShop.mockResolvedValue({ items: [] });
      apiClientInstance.getMessages.mockResolvedValue(mockMessages);
      apiClientInstance.solveMessage.mockRejectedValue(new Error('Solve failed'));
      
      await gameService.startNewGame();
      
      // solveMessage errors are not caught in playTurn, so it should throw
      await expect(gameService['playTurn']()).rejects.toThrow('Solve failed');
    });
  });
});
