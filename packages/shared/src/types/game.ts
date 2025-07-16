export interface GameState {
  gameId: string;
  lives: number;
  gold: number;
  level: number;
  score: number;
  highScore: number;
  turn: number;
}

export interface GameStartResponse {
  gameId: string;
  lives: number;
  gold: number;
  level: number;
  score: number;
  highScore: number;
  turn: number;
}

export interface Message {
  adId: string;
  message: string;
  reward: number;
  expiresIn: number;
  encrypted: number | null;
  probability: string;
}

export interface SolveResponse {
  success: boolean;
  lives: number;
  gold: number;
  score: number;
  highScore: number;
  turn: number;
  message: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
}

export interface ShopResponse {
  items: ShopItem[];
}

export interface PurchaseResponse {
  shoppingSuccess: string;
  gold: number;
  lives: number;
  level: number;
  turn: number;
}

export interface Reputation {
  people: number;
  state: number;
  underworld: number;
}

export interface ReputationResponse {
  people: number;
  state: number;
  underworld: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
