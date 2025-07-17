import {
  GameStartResponse,
  GameState,
  Message,
  SolveResponse,
  ShopResponse,
  ShopItem,
  PurchaseResponse,
  ReputationResponse
} from '@dragons-mugloar/shared';

export const mockGameStartResponse: GameStartResponse = {
  gameId: 'test-game-123',
  lives: 3,
  gold: 50,
  level: 1,
  score: 0,
  highScore: 100,
  turn: 0
};

export const mockGameState: GameState = {
  gameId: 'test-game-123',
  lives: 3,
  gold: 50,
  level: 1,
  score: 0,
  highScore: 100,
  turn: 0
};

export const mockUpdatedGameState: GameState = {
  gameId: 'test-game-123',
  lives: 2,
  gold: 75,
  level: 1,
  score: 25,
  highScore: 100,
  turn: 1
};

export const mockMessages: Message[] = [
  {
    adId: 'msg-1',
    message: 'Rescue a cat from a tree',
    reward: 10,
    expiresIn: 5,
    encrypted: null,
    probability: 'Gamble'
  },
  {
    adId: 'msg-2',
    message: 'Deliver a package safely',
    reward: 25,
    expiresIn: 8,
    encrypted: null,
    probability: 'Sure Thing'
  },
  {
    adId: 'msg-3',
    message: 'VGFrZSBhIGhpZ2gtcmlzayBtaXNzaW9u', // "Take a high-risk mission" (base64)
    reward: 50,
    expiresIn: 3,
    encrypted: 1,
    probability: 'Umllc2t5' // "Risky" (base64)
  }
];

export const mockEncryptedMessage: Message = {
  adId: 'msg-encrypted',
  message: 'UmVzY3VlIHRoZSBwcmluY2Vzcw==', // "Rescue the princess" (base64)
  reward: 100,
  expiresIn: 10,
  encrypted: 1,
  probability: 'U3VyZSBUaGluZw==' // "Sure Thing" (base64)
};

export const mockSolveResponse: SolveResponse = {
  success: true,
  lives: 2,
  gold: 75,
  score: 25,
  highScore: 100,
  turn: 1,
  message: 'Quest completed successfully!'
};

export const mockFailedSolveResponse: SolveResponse = {
  success: false,
  lives: 2,
  gold: 50,
  score: 0,
  highScore: 100,
  turn: 1,
  message: 'Quest failed! Better luck next time.'
};

export const mockShopItems: ShopItem[] = [
  {
    id: 'item-1',
    name: 'Healing Potion',
    cost: 20
  },
  {
    id: 'item-2',
    name: 'Magic Sword',
    cost: 100
  },
  {
    id: 'item-3',
    name: 'Lucky Charm',
    cost: 50
  }
];

export const mockShopResponse: ShopResponse = {
  items: mockShopItems
};

export const mockPurchaseResponse: PurchaseResponse = {
  gold: 30,
  lives: 3,
  level: 1,
  turn: 1
};

export const mockReputationResponse: ReputationResponse = {
  people: 5,
  state: 0,
  underworld: -2
};

export const mockLowLivesGameState: GameState = {
  gameId: 'test-game-low-lives',
  lives: 1,
  gold: 100,
  level: 2,
  score: 150,
  highScore: 200,
  turn: 10
};

export const mockHighScoreGameState: GameState = {
  gameId: 'test-game-high-score',
  lives: 3,
  gold: 200,
  level: 5,
  score: 1500,
  highScore: 1500,
  turn: 50
};

export const mockExpiredMessages: Message[] = [
  {
    adId: 'expired-1',
    message: 'Urgent delivery needed',
    reward: 15,
    expiresIn: 1,
    encrypted: null,
    probability: 'Sure Thing'
  },
  {
    adId: 'expired-2',
    message: 'Time-sensitive mission',
    reward: 30,
    expiresIn: 0,
    encrypted: null,
    probability: 'Piece of Cake'
  }
];

export const mockDangerousMessages: Message[] = [
  {
    adId: 'dangerous-1',
    message: 'Steal from the royal treasury',
    reward: 200,
    expiresIn: 10,
    encrypted: null,
    probability: 'Suicide Mission'
  },
  {
    adId: 'dangerous-2',
    message: 'Assassinate the king',
    reward: 500,
    expiresIn: 5,
    encrypted: null,
    probability: 'Impossible'
  }
];

export const mockEthicalMessage: Message = {
  adId: 'ethical-1',
  message: 'Steal from the corrupt nobles and share some of the profits with the people',
  reward: 80,
  expiresIn: 8,
  encrypted: null,
  probability: 'Risky'
};
