import { GameService } from '../src/services/gameService';
import { GameApiClient } from '../src/services/gameApi';

// Mock the GameApiClient
jest.mock('../src/services/gameApi');

describe('GameService', () => {
  let gameService: GameService;
  let mockApiClient: jest.Mocked<GameApiClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
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
    (GameApiClient as jest.MockedClass<typeof GameApiClient>).mockImplementation(() => mockApiClient);
    
    gameService = new GameService();
  });

  describe('startNewGame', () => {
    it('should start a new game and return game state', async () => {
      const mockResponse = {
        gameId: 'test-game-id',
        lives: 3,
        gold: 50,
        level: 1,
        score: 0,
        highScore: 0,
        turn: 0
      };

      mockApiClient.startGame.mockResolvedValue(mockResponse);

      const result = await gameService.startNewGame();

      expect(mockApiClient.startGame).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
      expect(gameService.getCurrentGameState()).toEqual(mockResponse);
    });

    it('should handle API errors when starting a game', async () => {
      const error = new Error('API Error');
      mockApiClient.startGame.mockRejectedValue(error);

      await expect(gameService.startNewGame()).rejects.toThrow('API Error');
    });
  });

  describe('getCurrentGameState', () => {
    it('should return null when no game is started', () => {
      expect(gameService.getCurrentGameState()).toBeNull();
    });

    it('should return current game state after starting a game', async () => {
      const mockResponse = {
        gameId: 'test-game-id',
        lives: 3,
        gold: 50,
        level: 1,
        score: 0,
        highScore: 0,
        turn: 0
      };

      mockApiClient.startGame.mockResolvedValue(mockResponse);
      await gameService.startNewGame();

      expect(gameService.getCurrentGameState()).toEqual(mockResponse);
    });
  });

  describe('playGame', () => {
    it('should throw error when game is not started', async () => {
      await expect(gameService.playGame()).rejects.toThrow('Game not started');
    });
  });
});
