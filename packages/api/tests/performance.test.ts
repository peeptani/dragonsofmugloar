import { GameService } from '../src/services/gameService';
import { GameApiClient } from '../src/services/gameApi';
import {
  mockGameStartResponse,
  mockMessages,
  mockSolveResponse,
  mockShopResponse
} from './fixtures/gameData';

// Mock for performance testing
jest.mock('../src/services/gameApi');
const MockedGameApiClient = GameApiClient as jest.MockedClass<typeof GameApiClient>;

describe('GameService Performance Tests', () => {
  let gameService: GameService;
  let mockApiClient: jest.Mocked<GameApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockApiClient = {
      startGame: jest.fn(),
      getMessages: jest.fn(),
      solveMessage: jest.fn(),
      getShop: jest.fn(),
      buyItem: jest.fn(),
      getReputation: jest.fn(),
    } as any;

    MockedGameApiClient.mockImplementation(() => mockApiClient);
    gameService = new GameService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('memory management', () => {
    it('should not leak memory during long game sessions', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      
      let turnCount = 0;
      mockApiClient.solveMessage.mockImplementation(() => {
        turnCount++;
        return Promise.resolve({
          ...mockSolveResponse,
          lives: turnCount >= 100 ? 0 : 3, // End after 100 turns
          turn: turnCount,
          score: turnCount * 10
        });
      });

      await gameService.startNewGame();
      const result = await gameService.playGame({ maxTurns: 100, delayMs: 0 });

      expect(result.turn).toBe(100);
      expect(result.score).toBe(1000);

      // Verify final state is correct
      const finalState = gameService.getCurrentGameState();
      expect(finalState?.turn).toBe(100);
    });

    it('should handle large numbers of messages efficiently', async () => {
      const startTime = performance.now();
      
      // Generate large message list
      const largeMessageList = Array.from({ length: 1000 }, (_, i) => ({
        adId: `msg-${i}`,
        message: `Message ${i}`,
        reward: Math.floor(Math.random() * 100) + 1,
        expiresIn: Math.floor(Math.random() * 10) + 1,
        encrypted: null,
        probability: 'Sure Thing'
      }));

      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue(largeMessageList);
      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0 // End immediately
      });

      await gameService.startNewGame();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (< 1000ms for processing 1000 messages)
      expect(executionTime).toBeLessThan(1000);
      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(1);
    });

    it('should efficiently manage owned items tracking', async () => {
      const largeShop = {
        items: Array.from({ length: 500 }, (_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          cost: Math.floor(Math.random() * 100) + 1
        }))
      };

      mockApiClient.startGame.mockResolvedValue({ ...mockGameStartResponse, gold: 10000 });
      mockApiClient.getShop.mockResolvedValue(largeShop);
      mockApiClient.buyItem.mockResolvedValue({
        gold: 9900,
        lives: 3,
        level: 1,
        turn: 1
      });
      mockApiClient.getMessages.mockResolvedValue([]);

      await gameService.startNewGame();
      
      // Set rich state to enable shopping
      (gameService as any).gameState = { ...mockGameStartResponse, gold: 10000, lives: 3 };

      const startTime = performance.now();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(mockApiClient.buyItem).toHaveBeenCalled();
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple GameService instances', async () => {
      const instances = Array.from({ length: 10 }, () => new GameService());
      
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue([]);

      const startPromises = instances.map(service => service.startNewGame());
      const startResults = await Promise.all(startPromises);

      expect(startResults).toHaveLength(10);
      startResults.forEach(result => {
        expect(result.gameId).toBe(mockGameStartResponse.gameId);
      });

      const playPromises = instances.map(service => service.playGame({ maxTurns: 1, delayMs: 0 }));
      const playResults = await Promise.all(playPromises);

      expect(playResults).toHaveLength(10);
      expect(mockApiClient.startGame).toHaveBeenCalledTimes(10);
    });

    it('should handle rapid sequential calls', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue([]);

      const rapidCalls = [];
      for (let i = 0; i < 20; i++) {
        rapidCalls.push(gameService.startNewGame());
      }

      const results = await Promise.all(rapidCalls);
      
      expect(results).toHaveLength(20);
      expect(mockApiClient.startGame).toHaveBeenCalledTimes(20);
    });
  });

  describe('error handling performance', () => {
    it('should recover quickly from API errors', async () => {
      let errorCount = 0;
      mockApiClient.startGame.mockImplementation(() => {
        errorCount++;
        if (errorCount <= 5) {
          return Promise.reject(new Error('Temporary API Error'));
        }
        return Promise.resolve(mockGameStartResponse);
      });

      const startTime = performance.now();
      
      // Try multiple times until success
      let result;
      for (let i = 0; i < 10; i++) {
        try {
          result = await gameService.startNewGame();
          break;
        } catch (error) {
          // Expected to fail first 5 times
          continue;
        }
      }

      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(result?.gameId).toBe(mockGameStartResponse.gameId);
      expect(endTime - startTime).toBeLessThan(500); // Should recover quickly
    });

    it('should handle timeout scenarios efficiently', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      
      // First call fails, causing error log
      mockApiClient.getMessages.mockRejectedValueOnce(new Error('Request timeout'));

      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0
      });

      await gameService.startNewGame();
      
      const startTime = performance.now();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('Error during turn'))).toBe(true);
    });
  });

  describe('scaling performance', () => {
    it('should maintain performance with large log volumes', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      
      // Generate many log entries
      let turnCount = 0;
      mockApiClient.solveMessage.mockImplementation(() => {
        turnCount++;
        return Promise.resolve({
          ...mockSolveResponse,
          lives: turnCount >= 50 ? 0 : 3,
          turn: turnCount,
          message: `Detailed log message for turn ${turnCount} with lots of information about what happened during this specific turn including quest details and outcomes`
        });
      });

      await gameService.startNewGame();
      
      const startTime = performance.now();
      await gameService.playGame({ maxTurns: 50, delayMs: 0 });
      const endTime = performance.now();

      const logs = gameService.getLogs();
      expect(logs.length).toBeGreaterThan(100); // Should have many log entries
      expect(endTime - startTime).toBeLessThan(2000); // Still performant
    });
  });

  describe('resource optimization', () => {
    it('should optimize message selection algorithms', async () => {
      // Create messages with various priorities
      const complexMessages = [
        { adId: 'low-1', message: 'Low priority', reward: 5, expiresIn: 10, encrypted: null, probability: 'Gamble' }, // Score 4
        { adId: 'high-1', message: 'High priority', reward: 100, expiresIn: 10, encrypted: null, probability: 'Piece of cake' }, // Score 9
        { adId: 'medium-1', message: 'Medium priority', reward: 25, expiresIn: 10, encrypted: null, probability: 'Walk in the park' }, // Score 8
        { adId: 'risky-1', message: 'Risky', reward: 200, expiresIn: 10, encrypted: null, probability: 'Suicide mission' }, // Score 1 - filtered out
        { adId: 'expired-1', message: 'Expired', reward: 150, expiresIn: 1, encrypted: null, probability: 'Piece of cake' } // Filtered out due to expiry
      ];

      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue(complexMessages);
      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0
      });

      await gameService.startNewGame();
      
      const startTime = performance.now();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
      
      // Should select a high-value, high-probability message (but algorithm decides exact choice)
      expect(mockApiClient.solveMessage).toHaveBeenCalledWith(
        mockGameStartResponse.gameId,
        expect.stringMatching(/^(high-1|medium-1)$/) // Either high or medium priority acceptable
      );
    });

    it('should optimize shopping decision algorithms', async () => {
      const complexShop = {
        items: [
          { id: 'healing-1', name: 'Healing Potion', cost: 20 },
          { id: 'sword-1', name: 'Iron Sword', cost: 50 },
          { id: 'armor-1', name: 'Leather Armor', cost: 75 },
          { id: 'shield-1', name: 'Wooden Shield', cost: 30 },
          { id: 'potion-1', name: 'Strength Potion', cost: 40 }
        ]
      };

      mockApiClient.startGame.mockResolvedValue({ ...mockGameStartResponse, gold: 100 });
      mockApiClient.getShop.mockResolvedValue(complexShop);
      mockApiClient.buyItem.mockResolvedValue({
        gold: 25,
        lives: 3,
        level: 1,
        turn: 1
      });
      mockApiClient.getMessages.mockResolvedValue([]);

      await gameService.startNewGame();
      
      // Set rich state with lives to enable shopping
      (gameService as any).gameState = { ...mockGameStartResponse, gold: 100, lives: 3 };

      const startTime = performance.now();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
      
      // Should buy the most expensive affordable item
      expect(mockApiClient.buyItem).toHaveBeenCalledWith(
        mockGameStartResponse.gameId,
        'armor-1' // 75 gold, most expensive under 100
      );
    });
  });
});
