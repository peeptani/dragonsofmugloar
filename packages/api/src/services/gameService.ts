import { GameApiClient } from './gameApi.js';
import {
  GameState,
  Message,
  ShopItem,
  GAME_CONSTANTS
} from '@dragons-mugloar/shared';

export class GameService {
  private apiClient: GameApiClient;
  private gameState: GameState | null = null;
  private ownedItems: Set<string> = new Set();
  private logs: string[] = [];

  constructor() {
    this.apiClient = new GameApiClient();
  }

  private log(message: string) {
    console.log(message);
    this.logs.push(message);
  }

  async startNewGame(): Promise<GameState> {
    const response = await this.apiClient.startGame();
    this.gameState = {
      gameId: response.gameId,
      lives: response.lives,
      gold: response.gold,
      level: response.level,
      score: response.score,
      highScore: response.highScore,
      turn: response.turn
    };
    this.ownedItems = new Set();
    this.logs = []; // Reset logs for a new game
    return this.gameState;
  }

  public getLogs(): string[] {
    return this.logs;
  }

  async playGame(): Promise<GameState> {
    if (!this.gameState) {
      throw new Error('Game not started. Call startNewGame() first.');
    }

    this.log(`Starting game ${this.gameState.gameId}`);
    this.log(`Initial state: Lives: ${this.gameState.lives}, Gold: ${this.gameState.gold}, Score: ${this.gameState.score}`);

    while (this.gameState.lives > 0 && this.gameState.score < GAME_CONSTANTS.TARGET_SCORE) {
      try {
        await this.playTurn();
        await this.delay(500); // Small delay between turns
      } catch (error) {
        console.error('Error during turn:', error);
        this.log(`Error during turn: ${error instanceof Error ? error.message : error}`);
        break;
      }
    }

    this.log(`Game ended. Final score: ${this.gameState.score}, Lives: ${this.gameState.lives}`);
    return this.gameState;
  }

  private async playTurn(): Promise<void> {
    if (!this.gameState) return;

    // Consider buying items FIRST if we have enough gold
    await this.considerShopping();

    // Get available messages AFTER shopping (since shopping increases turn counter)
    const messages = await this.apiClient.getMessages(this.gameState.gameId);

    if (messages.length === 0) {
      this.log('No messages available');
      return;
    }

    // Pick the best message to solve
    const bestMessage = this.selectBestMessage(messages);
    if (bestMessage) {
      await this.solveMessage(bestMessage);
    }
  }

  private decodeBase64(encoded: string): string {
    try {
      return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch (error) {
      return encoded;
    }
  }

  private selectBestMessage(messages: Message[]): Message | null {
    if (messages.length === 0) return null;

    const probabilityScores: { [key: string]: number } = {
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

    // Process all messages, decoding encrypted ones for analysis only
    const processedMessages = messages.map(msg => {
      if (msg.encrypted !== null) {
        // Decode the encrypted probability for analysis, but keep original adId
        const decodedProbability = this.decodeBase64(msg.probability);
        const decodedAdId = this.decodeBase64(msg.adId);
        const decodedMessage = this.decodeBase64(msg.message);
        const processed = {
          ...msg, 
          decodedProbability,
          decodedAdId, 
          probabilityScore: probabilityScores[decodedProbability] ?? 0,
          message: decodedMessage,
        };
        return processed;
      }
      const processed = {
        ...msg,
        decodedProbability: msg.probability,
        decodedAdId: msg.adId, 
        probabilityScore: probabilityScores[msg.probability] ?? 0
      };
      return processed;
    });

    // Filter out the most dangerous missions unless they are the only options
    const viableMessages = processedMessages.filter(msg => msg.probabilityScore > 1 );
    const messagePool = viableMessages.length > 0 ? viableMessages : processedMessages;

    // Filter out messages that will expire immediately (expiresIn <= 1)
    const nonExpiredMessages = messagePool.filter(msg => msg.expiresIn > 1);
    const ethicalMessages = nonExpiredMessages.filter(msg => !msg.message.includes('Steal') || msg.message.includes('share some of the profits with the people'));
    const finalMessagePool = ethicalMessages.length > 0 ? ethicalMessages : messagePool;

    // Sort messages by a combined score of reward and probability
    const sortedMessages = [...finalMessagePool].sort((a, b) => {
      const scoreA = a.probabilityScore + 1;
      const scoreB = b.probabilityScore + 1;
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      return a.reward - b.reward; 
    });
    
    const selected = sortedMessages[0];
    
    return selected;
  }

  private async solveMessage(message: Message): Promise<void> {
    if (!this.gameState) return;

    // For encrypted messages, use the decoded adId
    let adIdToUse = message.adId;
    if (message.encrypted !== null) {
      adIdToUse = this.decodeBase64(message.adId);
      const decodedMessage = this.decodeBase64(message.message);
      const decodedProbability = this.decodeBase64(message.probability);
      const decodedReward = this.decodeBase64(message.reward.toString());
      this.log(`Attempting to solve: "${decodedMessage}" (Reward: ${decodedReward}, Probability: ${decodedProbability})`);

    } else {
      this.log(`Attempting to solve: "${message.message}" (Reward: ${message.reward}, Probability: ${message.probability})`);
    }

    

    const response = await this.apiClient.solveMessage(this.gameState.gameId, adIdToUse);

    this.gameState.lives = response.lives;
    this.gameState.gold = response.gold;
    this.gameState.score = response.score;
    this.gameState.turn = response.turn;
    
    this.log(`\n--- Turn ${this.gameState.turn} ---`);
    if (response.success) {
      this.log(`✅ Success! ${response.message}`);
    } else {
      this.log(`❌ Failed! ${response.message}`);
    }

    this.log(`Current state: Lives: ${this.gameState.lives}, Gold: ${this.gameState.gold}, Score: ${this.gameState.score}`);
  }

  private async considerShopping(): Promise<void> {
    if (!this.gameState || this.gameState.gold === null) {
      return;
    }

    // Create a non-nullable constant for gold to use within this function scope.
    // This assures TypeScript that 'gold' is a number from this point forward.
    const gold = this.gameState.gold;

    if (gold < 50) return;

    try {
      const shopResponse = await this.apiClient.getShop(this.gameState.gameId);
      const items = shopResponse?.items || shopResponse || [];

      // Emergency Healing
      const healingPotion = items.find(item => item.name.toLowerCase().includes('healing') && item.cost <= gold);
      if (this.gameState.lives <= Math.round(this.gameState.turn / 20) + 1 && healingPotion) {
        
        if (healingPotion) {
          this.log(`🚨 EMERGENCY: Lives low. Buying healing potion for ${healingPotion.cost} gold.`);
          await this.purchaseItem(healingPotion.id);
        }
        return; // Do nothing else this turn
      }

      // Collection & Upgrade Strategy
      const affordableItems = items.filter(item => item.cost <= gold);

      if (affordableItems.length === 0) {
        this.log(`💰 Holding gold (${gold}). No affordable items in shop.`);
        return;
      }

      const unownedItems = affordableItems.filter(item => !this.ownedItems.has(item.id));
      let itemToBuy: ShopItem | null = null;

      if (unownedItems.length > 0) {
        // Collection Phase: Buy the most expensive *unowned* item we can afford.
        itemToBuy = unownedItems.reduce((mostExpensive, current) => 
          current.cost > mostExpensive.cost ? current : mostExpensive
        );
        
      } else {
        // Upgrade Phase: We own everything affordable. Buy the absolute most expensive item we can afford.
        itemToBuy = affordableItems.reduce((mostExpensive, current) => 
          current.cost > mostExpensive.cost ? current : mostExpensive
        );
        
      }

      if (itemToBuy && !itemToBuy.name.toLowerCase().includes('healing')) {
        this.log(`💎 Buying item "${itemToBuy.name}" for ${itemToBuy.cost} gold.`);
        await this.purchaseItem(itemToBuy.id);
      }

    } catch (error) {
      this.log(`Shopping failed: ${error instanceof Error ? error.message : error}`); 
    }
  }

  private async purchaseItem(itemId: string): Promise<void> {
    if (!this.gameState) return;

    const purchaseResponse = await this.apiClient.buyItem(this.gameState.gameId, itemId);
    
    this.gameState.gold = purchaseResponse.gold;
    this.gameState.lives = purchaseResponse.lives;
    this.gameState.level = purchaseResponse.level;
    this.gameState.turn = purchaseResponse.turn;
    
    this.ownedItems.add(itemId);
    this.log(`\n--- Turn ${this.gameState.turn} ---`);
    this.log(`✅ Purchase successful! Gold: ${this.gameState.gold}, Lives: ${this.gameState.lives}, Turn: ${this.gameState.turn}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCurrentGameState(): GameState | null {
    return this.gameState;
  }
}
