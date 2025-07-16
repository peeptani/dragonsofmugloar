import express from 'express';
import cors from 'cors';
import { GameService } from './services/gameService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store game instances (in production, use a proper database)
const gameInstances = new Map<string, GameService>();

// Routes
app.post('/api/game/start', async (req, res) => {
  try {
    const gameService = new GameService();
    const gameState = await gameService.startNewGame();
    
    gameInstances.set(gameState.gameId, gameService);
    
    res.json(gameState);
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

app.get('/api/game/:gameId/state', (req, res) => {
  const { gameId } = req.params;
  const gameService = gameInstances.get(gameId);
  
  if (!gameService) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const gameState = gameService.getCurrentGameState();
  res.json(gameState);
});

app.post('/api/game/:gameId/auto-play', async (req, res) => {
  const { gameId } = req.params;
  const gameService = gameInstances.get(gameId);
  
  if (!gameService) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  try {
    const finalState = await gameService.playGame();
    res.json(finalState);
  } catch (error) {
    console.error('Error during auto-play:', error);
    res.status(500).json({ error: 'Auto-play failed' });
  }
});

// Proxy routes to the Dragons of Mugloar API
app.get('/api/game/:gameId/messages', async (req, res) => {
  const { gameId } = req.params;
  const gameService = gameInstances.get(gameId);
  
  if (!gameService) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  try {
    // Access the API client through the service (we'd need to expose it)
    // For now, return a placeholder
    res.json({ messages: [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/game/:gameId/shop', async (req, res) => {
  const { gameId } = req.params;
  const gameService = gameInstances.get(gameId);
  
  if (!gameService) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  try {
    // Similar to messages, we'd need to expose the API client
    res.json({ items: [] });
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dragons of Mugloar API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
