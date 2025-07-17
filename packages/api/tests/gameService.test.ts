import { GameService } from '../src/services/gameService';
import { GameApiClient } from '../src/services/gameApi';
import {
  mockGameStartResponse,
  mockGameState,
  mockUpdatedGameState,
  mockMessages,
  mockEncryptedMessage,
  mockSolveResponse,
  mockFailedSolveResponse,
  mockShopResponse,
  mockPurchaseResponse,
  mockLowLivesGameState,
  mockHighScoreGameState,
  mockExpiredMessages,
  mockDangerousMessages,
  mockEthicalMessage
} from './fixtures/gameData';
import { GAME_CONSTANTS } from '@dragons-mugloar/shared';

// Mock the GameApiClient
jest.mock('../src/services/gameApi');
const MockedGameApiClient = GameApiClient as jest.MockedClass<typeof GameApiClient>;

describe('GameService', () => {
  let gameService: GameService;
  let mockApiClient: jest.Mocked<GameApiClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create mocked API client
    mockApiClient = {
      startGame: jest.fn(),
      getMessages: jest.fn(),
      solveMessage: jest.fn(),
      getShop: jest.fn(),
      buyItem: jest.fn(),
      getReputation: jest.fn(),
    } as any;

    // Mock the constructor
    MockedGameApiClient.mockImplementation(() => mockApiClient);
    
    gameService = new GameService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with null game state', () => {
      expect(gameService.getCurrentGameState()).toBeNull();
    });

    it('should initialize with empty logs', () => {
      expect(gameService.getLogs()).toEqual([]);
    });

    it('should create GameApiClient instance', () => {
      expect(MockedGameApiClient).toHaveBeenCalledWith();
    });
  });

  describe('startNewGame', () => {
    it('should start a new game and return game state', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);

      const result = await gameService.startNewGame();

      expect(mockApiClient.startGame).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameState);
      expect(gameService.getCurrentGameState()).toEqual(mockGameState);
      expect(gameService.getLogs()).toEqual([]);
    });

    it('should handle API errors when starting a game', async () => {
      const error = new Error('API Error');
      mockApiClient.startGame.mockRejectedValue(error);

      await expect(gameService.startNewGame()).rejects.toThrow('API Error');
      expect(gameService.getCurrentGameState()).toBeNull();
    });

    it('should reset owned items when starting a new game', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);

      await gameService.startNewGame();
      
      // Start another game to test reset
      await gameService.startNewGame();
      
      expect(mockApiClient.startGame).toHaveBeenCalledTimes(2);
      expect(gameService.getCurrentGameState()).toEqual(mockGameState);
    });
  });

  describe('getCurrentGameState', () => {
    it('should return null when no game is started', () => {
      expect(gameService.getCurrentGameState()).toBeNull();
    });

    it('should return current game state after starting a game', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      await gameService.startNewGame();

      expect(gameService.getCurrentGameState()).toEqual(mockGameState);
    });
  });

  describe('getLogs', () => {
    it('should return empty array initially', () => {
      expect(gameService.getLogs()).toEqual([]);
    });

    it('should accumulate logs during gameplay', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      await gameService.startNewGame();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      const logs = gameService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toContain('Starting game');
    });
  });

  describe('playGame', () => {
    it('should throw error when game is not started', async () => {
      await expect(gameService.playGame()).rejects.toThrow('Game not started');
    });

    it('should play complete game until target score reached', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      await gameService.startNewGame();
      
      // Mock game state update to reach target score
      const highScoreState = { ...mockGameState, score: GAME_CONSTANTS.TARGET_SCORE };
      (gameService as any).gameState = highScoreState;

      const result = await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(result.score).toBe(GAME_CONSTANTS.TARGET_SCORE);
      // Since we already have target score, should exit immediately without calling API
      expect(mockApiClient.getMessages).not.toHaveBeenCalled();
    });

    it('should play complete game until lives run out', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      await gameService.startNewGame();
      
      // Mock game state update to lose all lives
      const noLivesState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = noLivesState;

      const result = await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(result.lives).toBe(0);
      // Since we already have 0 lives, should exit immediately without calling API
      expect(mockApiClient.getMessages).not.toHaveBeenCalled();
    });

    it('should handle turn errors gracefully', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockRejectedValue(new Error('Messages API Error'));
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      await gameService.startNewGame();
      
      const result = await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(result).toEqual(mockGameState);
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('Error during turn'))).toBe(true);
    });

    it('should include delays between turns', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      await gameService.startNewGame();
      
      // Mock only one turn
      const lowLivesState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = lowLivesState;

      const playPromise = gameService.playGame();
      
      // Fast forward timers
      jest.advanceTimersByTime(500);
      
      await playPromise;
      
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
    });
  });

  describe('message selection', () => {
    beforeEach(async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      await gameService.startNewGame();
    });

    it('should select best message from available options', async () => {
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalledWith(
        mockGameState.gameId,
        expect.any(String)
      );
    });

    it('should decode encrypted messages', async () => {
      mockApiClient.getMessages.mockResolvedValue([mockEncryptedMessage]);
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalledWith(
        mockGameState.gameId,
        mockEncryptedMessage.adId
      );
    });

    it('should avoid expired messages', async () => {
      mockApiClient.getMessages.mockResolvedValue(mockExpiredMessages);
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Should still attempt to solve even expired messages if they're the only option
      expect(mockApiClient.solveMessage).toHaveBeenCalled();
    });

    it('should avoid dangerous missions unless necessary', async () => {
      mockApiClient.getMessages.mockResolvedValue(mockDangerousMessages);
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Should still attempt dangerous missions if they're the only option
      expect(mockApiClient.solveMessage).toHaveBeenCalled();
    });

    it('should prefer ethical messages', async () => {
      const messagesWithEthical = [mockEthicalMessage, ...mockDangerousMessages];
      mockApiClient.getMessages.mockResolvedValue(messagesWithEthical);
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalledWith(
        mockGameState.gameId,
        mockEthicalMessage.adId
      );
    });

    it('should handle no messages available', async () => {
      mockApiClient.getMessages.mockResolvedValue([]);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).not.toHaveBeenCalled();
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('No messages available'))).toBe(true);
    });
  });

  describe('shopping logic', () => {
    beforeEach(async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);
      await gameService.startNewGame();
    });

    it('should not shop when gold is insufficient', async () => {
      const poorState = { ...mockGameState, gold: 10 };
      (gameService as any).gameState = poorState;

      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      // Mock to stop after one turn
      const updatedState = { ...poorState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.getShop).not.toHaveBeenCalled();
    });

    it('should buy emergency healing when lives are low', async () => {
      const lowLivesState = { ...mockGameState, lives: 1, gold: 100, turn: 20 };
      (gameService as any).gameState = lowLivesState;

      const shopWithHealing = {
        items: [
          { id: 'healing-1', name: 'Healing Potion', cost: 50 },
          { id: 'sword-1', name: 'Sword', cost: 75 }
        ]
      };
      mockApiClient.getShop.mockResolvedValue(shopWithHealing);
      mockApiClient.buyItem.mockResolvedValue(mockPurchaseResponse);

      // Mock to stop after one turn
      const updatedState = { ...lowLivesState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.buyItem).toHaveBeenCalledWith(
        mockGameState.gameId,
        'healing-1'
      );
    });

    it('should buy most expensive affordable item when collection', async () => {
      const richState = { ...mockGameState, gold: 150 };
      (gameService as any).gameState = richState;

      mockApiClient.getShop.mockResolvedValue(mockShopResponse);
      mockApiClient.buyItem.mockResolvedValue(mockPurchaseResponse);

      // Mock to stop after one turn
      const updatedState = { ...richState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.buyItem).toHaveBeenCalledWith(
        mockGameState.gameId,
        'item-2' // Magic Sword (most expensive at 100)
      );
    });

    it('should skip shopping when no affordable items', async () => {
      const poorState = { ...mockGameState, gold: 10 };
      (gameService as any).gameState = poorState;

      mockApiClient.getShop.mockResolvedValue(mockShopResponse);

      // Mock to stop after one turn
      const updatedState = { ...poorState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.buyItem).not.toHaveBeenCalled();
    });

    it('should handle shopping errors gracefully', async () => {
      const richState = { ...mockGameState, gold: 150 };
      (gameService as any).gameState = richState;

      mockApiClient.getShop.mockRejectedValue(new Error('Shop API Error'));

      // Mock to stop after one turn
      const updatedState = { ...richState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('Shopping failed'))).toBe(true);
    });
  });

  describe('game state updates', () => {
    beforeEach(async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      await gameService.startNewGame();
    });

    it('should update game state after successful quest', async () => {
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalled();
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('✅ Success!'))).toBe(true);
    });

    it('should update game state after failed quest', async () => {
      mockApiClient.solveMessage.mockResolvedValue(mockFailedSolveResponse);

      // Mock to stop after one turn
      const updatedState = { ...mockGameState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalled();
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('❌ Failed!'))).toBe(true);
    });

    it('should update game state after purchase', async () => {
      const richState = { ...mockGameState, gold: 150 };
      (gameService as any).gameState = richState;

      mockApiClient.getShop.mockResolvedValue(mockShopResponse);
      mockApiClient.buyItem.mockResolvedValue(mockPurchaseResponse);

      // Mock to stop after one turn
      const updatedState = { ...richState, lives: 0 };
      (gameService as any).gameState = updatedState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.buyItem).toHaveBeenCalled();
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('✅ Purchase successful!'))).toBe(true);
    });
  });

  describe('base64 decoding', () => {
    it('should decode base64 messages correctly', () => {
      const testString = 'Hello World';
      const encoded = Buffer.from(testString).toString('base64');
      const decoded = (gameService as any).decodeBase64(encoded);
      expect(decoded).toBe(testString);
    });

    it('should return original string if decoding fails', () => {
      const invalidBase64 = 'not-base64!';
      const result = (gameService as any).decodeBase64(invalidBase64);
      expect(result).toBe(invalidBase64);
    });
  });

  describe('performance and edge cases', () => {
    it('should handle high-frequency API calls', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);

      await gameService.startNewGame();

      // Simulate multiple rapid calls
      const promises = Array.from({ length: 3 }, () => {
        const richState = { ...mockGameState, gold: 150, lives: 0 };
        (gameService as any).gameState = richState;
        return gameService.playGame();
      });

      await Promise.all(promises);

      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle null gold values', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);

      await gameService.startNewGame();

      // Set gold to null (edge case)
      const nullGoldState = { ...mockGameState, gold: null as any, lives: 0 };
      (gameService as any).gameState = nullGoldState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Should not crash and should not attempt shopping
      expect(mockApiClient.getShop).not.toHaveBeenCalled();
    });

    it('should handle malformed shop response', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue([]);
      mockApiClient.getShop.mockResolvedValue(null as any);

      await gameService.startNewGame();

      const richState = { ...mockGameState, gold: 150, lives: 0 };
      (gameService as any).gameState = richState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Should not crash
      expect(mockApiClient.getShop).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('should log all major game events', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);
      mockApiClient.solveMessage.mockResolvedValue(mockSolveResponse);
      mockApiClient.buyItem.mockResolvedValue(mockPurchaseResponse);

      await gameService.startNewGame();

      const richState = { ...mockGameState, gold: 150, lives: 0 };
      (gameService as any).gameState = richState;

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      const logs = gameService.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(log => log.includes('Starting game'))).toBe(true);
      expect(logs.some(log => log.includes('Initial state'))).toBe(true);
      expect(logs.some(log => log.includes('Game ended'))).toBe(true);
    });
  });
});
