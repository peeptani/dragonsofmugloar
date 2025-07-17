export const API_BASE_URL = 'https://dragonsofmugloar.com/api/v2';

export const ENDPOINTS = {
  START_GAME: '/game/start',
  MESSAGES: (gameId: string) => `/${gameId}/messages`,
  SOLVE: (gameId: string, adId: string) => `/${gameId}/solve/${adId}`,
  SHOP: (gameId: string) => `/${gameId}/shop`,
  BUY: (gameId: string, itemId: string) => `/${gameId}/shop/buy/${itemId}`,
  REPUTATION: (gameId: string) => `/${gameId}/investigate/reputation`,
} as const;

export const GAME_CONSTANTS = {
  TARGET_SCORE: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

export const PROBABILITY_SCORES: { [key: string]: number } = {
  'Impossible': 0,
  'Suicide mission': 1,
  'Risky': 2,
  'Playing with fire': 3,
  'Gamble': 4,
  'Rather detrimental': 5,
  'Hmmm....': 6,
  'Quite likely': 7,
  'Walk in the park': 8,
  'Piece of cake': 9,
};
