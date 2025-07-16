#!/usr/bin/env node

import { GameService } from './services/gameService.js';

async function main() {
  console.log('🐉 Dragons of Mugloar - Console Game Bot 🐉');
  console.log('=========================================\n');

  try {
    const gameService = new GameService();
    
    // Start a new game
    console.log('Starting new game...');
    await gameService.startNewGame();
    
    // Play the game
    const finalState = await gameService.playGame();
    
    console.log('\n=== GAME SUMMARY ===');
    console.log(`Final Score: ${finalState.score}`);
    console.log(`Lives Remaining: ${finalState.lives}`);
    console.log(`Gold Remaining: ${finalState.gold}`);
    console.log(`Turns Played: ${finalState.turn}`);
    
    if (finalState.score >= 1000) {
      console.log('🎉 SUCCESS! Target score of 1000+ achieved!');
    } else {
      console.log('💀 Game ended before reaching target score of 1000');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Game interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
