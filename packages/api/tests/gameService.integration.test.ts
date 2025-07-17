import { GameService } from '../src/services/gameService';
import { GameApiClient } from '../src/services/gameApi';

// Mock the API client
jest.mock('../src/services/gameApi');

describe('GameService Integration Tests', () => {
  let gameService: GameService;
  let mockApiClient: jest.Mocked<GameApiClient>;

  beforeEach(() => {
    gameService = new GameService();
    mockApiClient = GameApiClient.prototype as jest.Mocked<GameApiClient>;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('playGame with controlled execution', () => {
    beforeEach(() => {
      // Mock the initial game start
      mockApiClient.startGame.mockResolvedValue({
        gameId: 'test-game-123',
        lives: 3,
        gold: 100,
        level: 1,
        score: 0,
        highScore: 0,
        turn: 0
      });

      // Mock messages
      mockApiClient.getMessages.mockResolvedValue([
        {
          adId: 'ad1',
          message: 'Easy task for quick gold',
          reward: 10,
          expiresIn: 5,
          probability: 'Piece of cake'
        }
      ]);

      // Mock successful solve
      mockApiClient.solveMessage.mockResolvedValue({
        success: true,
        lives: 3,
        gold: 110,
        score: 100,
        highScore: 100,
        turn: 1
      });
    });

    it('should complete a limited number of turns without timeout', async () => {
      await gameService.startNewGame();
      
      const result = await gameService.playGame({ 
        maxTurns: 3, 
        delayMs: 0 // No delay for fast testing
      });

      expect(result).toBeDefined();
      expect(result.gameId).toBe('test-game-123');
      expect(mockApiClient.getMessages).toHaveBeenCalledTimes(3);
      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle game over conditions within turn limit', async () => {
      // Mock a scenario where we lose all lives
      mockApiClient.solveMessage
        .mockResolvedValueOnce({
          success: false,
          lives: 2,
          gold: 100,
          score: 0,
          highScore: 0,
          turn: 1
        })
        .mockResolvedValueOnce({
          success: false,
          lives: 1,
          gold: 100,
          score: 0,
          highScore: 0,
          turn: 2
        })
        .mockResolvedValueOnce({
          success: false,
          lives: 0,
          gold: 100,
          score: 0,
          highScore: 0,
          turn: 3
        });

      await gameService.startNewGame();
      
      const result = await gameService.playGame({ 
        maxTurns: 10, 
        delayMs: 0 
      });

      expect(result.lives).toBe(0);
      // Should stop before maxTurns due to lives = 0
      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle target score achievement within turn limit', async () => {
      // Mock high scoring responses
      mockApiClient.solveMessage.mockResolvedValue({
        success: true,
        lives: 3,
        gold: 200,
        score: 35000, // Above target
        highScore: 35000,
        turn: 1
      });

      await gameService.startNewGame();
      
      const result = await gameService.playGame({ 
        maxTurns: 10, 
        delayMs: 0 
      });

      expect(result.score).toBeGreaterThanOrEqual(30000);
      // Should stop after 1 turn due to target score reached
      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.getMessages.mockRejectedValueOnce(new Error('API Error'));

      await gameService.startNewGame();
      
      const result = await gameService.playGame({ 
        maxTurns: 5, 
        delayMs: 0 
      });

      expect(result).toBeDefined();
      // Should break out of loop on error
      expect(mockApiClient.getMessages).toHaveBeenCalledTimes(1);
    });

    it('should respect maxTurns parameter', async () => {
      await gameService.startNewGame();
      
      const result = await gameService.playGame({ 
        maxTurns: 2, 
        delayMs: 0 
      });

      expect(result).toBeDefined();
      // Should call exactly maxTurns times
      expect(mockApiClient.getMessages).toHaveBeenCalledTimes(2);
      expect(mockApiClient.solveMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('playGame with delays', () => {
    beforeEach(() => {
      mockApiClient.startGame.mockResolvedValue({
        gameId: 'test-game-delay',
        lives: 3,
        gold: 100,
        level: 1,
        score: 0,
        highScore: 0,
        turn: 0
      });

      mockApiClient.getMessages.mockResolvedValue([
        {
          adId: 'ad1',
          message: 'Quick task',
          reward: 10,
          expiresIn: 5,
          probability: 'Piece of cake'
        }
      ]);

      mockApiClient.solveMessage.mockResolvedValue({
        success: true,
        lives: 3,
        gold: 110,
        score: 100,
        highScore: 100,
        turn: 1
      });
    });

    it('should respect delayMs parameter', async () => {
      const startTime = Date.now();
      
      await gameService.startNewGame();
      await gameService.playGame({ 
        maxTurns: 2, 
        delayMs: 100 
      });

      const elapsedTime = Date.now() - startTime;
      
      // Should take at least 200ms (2 turns * 100ms delay)
      // Adding some buffer for test execution time
      expect(elapsedTime).toBeGreaterThan(150);
    });

    it('should not delay when delayMs is 0', async () => {
      const startTime = Date.now();
      
      await gameService.startNewGame();
      await gameService.playGame({ 
        maxTurns: 3, 
        delayMs: 0 
      });

      const elapsedTime = Date.now() - startTime;
      
      // Should complete quickly without delays
      expect(elapsedTime).toBeLessThan(1000);
    });
  });
});
