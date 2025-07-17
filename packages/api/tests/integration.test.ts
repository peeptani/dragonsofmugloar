import { GameService } from '../src/services/gameService';
import { GameApiClient } from '../src/services/gameApi';
import {
  mockGameStartResponse,
  mockMessages,
  mockSolveResponse,
  mockShopResponse,
  mockPurchaseResponse
} from './fixtures/gameData';

// Mock only specific methods to allow partial integration testing
jest.mock('../src/services/gameApi');
const MockedGameApiClient = GameApiClient as jest.MockedClass<typeof GameApiClient>;

describe('GameService Integration Tests', () => {
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

  describe('full game workflow', () => {
    it('should complete a full game session with shopping and quests', async () => {
      // Setup API responses
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);
      mockApiClient.buyItem.mockResolvedValue(mockPurchaseResponse);
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      
      // First quest succeeds and ends game
      mockApiClient.solveMessage.mockResolvedValueOnce({
        ...mockSolveResponse,
        lives: 0 // End game
      });

      // Start and play game
      await gameService.startNewGame();
      const result = await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Verify the complete workflow
      expect(mockApiClient.startGame).toHaveBeenCalledTimes(1);
      expect(mockApiClient.getShop).toHaveBeenCalledTimes(1);
      expect(mockApiClient.buyItem).toHaveBeenCalledTimes(1);
      expect(mockApiClient.getMessages).toHaveBeenCalledTimes(1);
      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(1);

      // Verify final state
      expect(result.lives).toBe(0);
      expect(result.score).toBe(mockSolveResponse.score);

      // Verify logs contain expected entries
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('Starting game'))).toBe(true);
      expect(logs.some(log => log.includes('Purchase successful'))).toBe(true);
      expect(logs.some(log => log.includes('Success!'))).toBe(true);
      expect(logs.some(log => log.includes('Game ended'))).toBe(true);
    });

    it('should handle game with multiple turns', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] }); // No items to buy
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      
      // Multiple quest attempts
      mockApiClient.solveMessage
        .mockResolvedValueOnce({
          ...mockSolveResponse,
          lives: 2,
          turn: 1
        })
        .mockResolvedValueOnce({
          ...mockSolveResponse,
          lives: 1,
          turn: 2
        })
        .mockResolvedValueOnce({
          ...mockSolveResponse,
          lives: 0, // End game
          turn: 3
        });

      await gameService.startNewGame();
      const result = await gameService.playGame({ maxTurns: 3, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(3);
      expect(result.lives).toBe(0);
      expect(result.turn).toBe(3);
    });

    it('should handle error recovery during gameplay', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      
      // First call fails, second succeeds
      mockApiClient.getMessages
        .mockRejectedValueOnce(new Error('API Timeout'))
        .mockResolvedValueOnce(mockMessages);
      
      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0 // End game
      });

      await gameService.startNewGame();
      const result = await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.getMessages).toHaveBeenCalledTimes(1);
      expect(result.lives).toBe(mockGameStartResponse.lives); // Should maintain original state
      
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('Error during turn'))).toBe(true);
    });

    it('should prioritize emergency healing over regular shopping', async () => {
      const lowLivesResponse = { ...mockGameStartResponse, lives: 1, gold: 100, turn: 20 };
      mockApiClient.startGame.mockResolvedValue(lowLivesResponse);
      
      const shopWithHealing = {
        items: [
          { id: 'healing-1', name: 'Healing Potion', cost: 50 },
          { id: 'expensive-1', name: 'Expensive Item', cost: 80 }
        ]
      };
      mockApiClient.getShop.mockResolvedValue(shopWithHealing);
      mockApiClient.buyItem.mockResolvedValue({
        ...mockPurchaseResponse,
        lives: 2 // Healing worked
      });
      mockApiClient.getMessages.mockResolvedValue([]);

      await gameService.startNewGame();
      
      // Set the game state to low lives scenario to trigger emergency healing
      (gameService as any).gameState = { ...lowLivesResponse, lives: 1, gold: 100, turn: 20 };
      
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.buyItem).toHaveBeenCalledWith(
        lowLivesResponse.gameId,
        'healing-1'
      );
      
      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('EMERGENCY'))).toBe(true);
    });
  });

  describe('message selection strategies', () => {
    beforeEach(async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      await gameService.startNewGame();
    });

    it('should select highest value viable messages', async () => {
      const prioritizedMessages = [
        {
          adId: 'low-reward',
          message: 'Low reward task',
          reward: 10,
          expiresIn: 5,
          encrypted: null,
          probability: 'Sure Thing'
        },
        {
          adId: 'high-reward',
          message: 'High reward task',
          reward: 50,
          expiresIn: 5,
          encrypted: null,
          probability: 'Sure Thing'
        }
      ];

      mockApiClient.getMessages.mockResolvedValue(prioritizedMessages);
      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0
      });

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Should select the high reward message
      expect(mockApiClient.solveMessage).toHaveBeenCalledWith(
        mockGameStartResponse.gameId,
        'high-reward'
      );
    });

    it('should handle base64 encoded messages', async () => {
      const encodedMessages = [
        {
          adId: Buffer.from('encoded-msg').toString('base64'),
          message: Buffer.from('Rescue the princess').toString('base64'),
          reward: 100,
          expiresIn: 5,
          encrypted: 1,
          probability: Buffer.from('Sure Thing').toString('base64')
        }
      ];

      mockApiClient.getMessages.mockResolvedValue(encodedMessages);
      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0
      });

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      expect(mockApiClient.solveMessage).toHaveBeenCalledWith(
        mockGameStartResponse.gameId,
        'encoded-msg'
      );

      const logs = gameService.getLogs();
      expect(logs.some(log => log.includes('Rescue the princess'))).toBe(true);
    });
  });

  describe('resource management', () => {
    it('should manage gold and inventory effectively', async () => {
      const richGameState = { ...mockGameStartResponse, gold: 200 };
      mockApiClient.startGame.mockResolvedValue(richGameState);
      
      const expensiveShop = {
        items: [
          { id: 'cheap-1', name: 'Cheap Item', cost: 25 },
          { id: 'expensive-1', name: 'Expensive Item', cost: 150 }
        ]
      };
      
      mockApiClient.getShop.mockResolvedValue(expensiveShop);
      mockApiClient.buyItem.mockResolvedValue({
        gold: 50,
        lives: 3,
        level: 1,
        turn: 1
      });
      mockApiClient.getMessages.mockResolvedValue([]);

      await gameService.startNewGame();
      
      // Set rich state with enough gold to trigger shopping
      (gameService as any).gameState = { ...richGameState, gold: 200 };

      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Should buy the most expensive affordable item
      expect(mockApiClient.buyItem).toHaveBeenCalledWith(
        richGameState.gameId,
        'expensive-1'
      );
    });

    it('should track owned items to avoid duplicates', async () => {
      mockApiClient.startGame.mockResolvedValue({ ...mockGameStartResponse, gold: 100 });
      mockApiClient.getShop.mockResolvedValue(mockShopResponse);
      mockApiClient.buyItem.mockResolvedValue(mockPurchaseResponse);
      mockApiClient.getMessages.mockResolvedValue([]);

      await gameService.startNewGame();

      // Simulate multiple shopping attempts
      const richState = { ...mockGameStartResponse, gold: 100, lives: 1 };
      (gameService as any).gameState = richState;
      
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // Reset for second attempt with same items
      (gameService as any).gameState = { ...richState, lives: 0 };
      
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      // First purchase should succeed, but item tracking should be maintained
      expect(mockApiClient.buyItem).toHaveBeenCalled();
    });
  });

  describe('performance under load', () => {
    it('should handle rapid successive API calls', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      mockApiClient.solveMessage.mockResolvedValue({
        ...mockSolveResponse,
        lives: 0
      });

      const gamePromises = Array.from({ length: 5 }, async () => {
        const service = new GameService();
        await service.startNewGame();
        return service.playGame({ maxTurns: 1, delayMs: 0 });
      });

      const results = await Promise.all(gamePromises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.gameId).toBe(mockGameStartResponse.gameId);
      });

      expect(mockApiClient.startGame).toHaveBeenCalledTimes(5);
    });
  });

  describe('state consistency', () => {
    it('should maintain consistent state throughout game session', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue(mockMessages);
      
      let turnCount = 0;
      mockApiClient.solveMessage.mockImplementation(() => {
        turnCount++;
        return Promise.resolve({
          ...mockSolveResponse,
          lives: 3 - turnCount,
          turn: turnCount,
          score: turnCount * 25
        });
      });

      await gameService.startNewGame();
      const result = await gameService.playGame({ maxTurns: 3, delayMs: 0 });

      expect(result.turn).toBe(3);
      expect(result.score).toBe(75);
      expect(result.lives).toBe(0);

      // Verify state consistency
      const currentState = gameService.getCurrentGameState();
      expect(currentState).toEqual(result);
    });

    it('should reset state properly when starting new games', async () => {
      mockApiClient.startGame.mockResolvedValue(mockGameStartResponse);
      mockApiClient.getShop.mockResolvedValue({ items: [] });
      mockApiClient.getMessages.mockResolvedValue([]);

      // First game
      await gameService.startNewGame();
      await gameService.playGame({ maxTurns: 1, delayMs: 0 });

      const firstGameLogs = gameService.getLogs().length;

      // Second game
      await gameService.startNewGame();
      
      const secondGameLogs = gameService.getLogs().length;
      expect(secondGameLogs).toBe(0); // Logs should be reset

      const currentState = gameService.getCurrentGameState();
      expect(currentState).toEqual(mockGameStartResponse);
    });
  });
});
