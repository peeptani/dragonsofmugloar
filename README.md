# Dragons of Mugloar - TypeScript Monorepo

A comprehensive solution for the Dragons of Mugloar adventure game, featuring both a Vue 3 frontend and Node.js backend in a TypeScript monorepo architecture.

## 🏗️ Project Structure

```
dragonsofmugloar/
├── packages/
│   ├── shared/           # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/    # TypeScript type definitions
│   │   │   └── utils/    # Constants and utilities
│   │   └── package.json
│   ├── api/              # Node.js backend
│   │   ├── src/
│   │   │   ├── services/ # Game logic and API client
│   │   │   ├── console.ts # Console application
│   │   │   └── server.ts  # Express server
│   │   ├── tests/        # Unit tests
│   │   └── package.json
│   └── web/              # Vue 3 frontend
│       ├── src/
│       │   ├── components/ # Vue components
│       │   ├── stores/     # Pinia state management
│       │   └── services/   # API client
│       └── package.json
├── package.json          # Root package.json with workspaces
└── tsconfig.json         # Root TypeScript configuration
```

## 🚀 Features

### Backend (Node.js + TypeScript)

- **Dual Mode Operation**: 
  - Console application for automated gameplay
  - Express server with REST API
- **Game Logic**: Somewhat (to be improved) intelligent quest selection and shopping strategy
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Unit Tests**: Jest-based testing with mocks
- **Type Safety**: Full TypeScript integration with shared types

### Frontend (Vue 3 + TypeScript)

- **Modern UI**: Beautiful, responsive design with glassmorphism effects
- **State Management**: Pinia for reactive state management
- **Real-time Updates**: Live game state updates and quest management
- **Quest Management**: Visual quest browser with difficulty indicators
- **Shop Interface**: Interactive shop with affordability indicators
- **Cross-browser Compatible**: Works across modern browsers

### Shared Package

- **Type Definitions**: Shared TypeScript interfaces for API responses
- **Constants**: Game constants and API endpoints
- **Utilities**: Common utility functions

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd dragonsofmugloar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the shared package**
   ```bash
   npm run build --workspace=packages/shared
   ```

## 🎮 Usage

### Console Application (Automated Bot)

Run the backend as a console application to automatically play the game:

```bash
npm run api:console
```

This will:
- Start a new game
- Automatically select and solve quests
- Make strategic item purchases
- Play until reaching 1000+ points or running out of lives

### Web Application

1. **Start the backend server**
   ```bash
   npm run api:server
   ```

2. **Start the frontend development server**
   ```bash
   npm run web:dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

### Development Scripts

```bash
# Build all packages
npm run build

# Run core api tests
npm run test --workspace=packages/api

# Run all api tests
npm run test:all --workspace=packages/api

# Start development mode for all packages
npm run dev

# Backend only (console mode)
npm run api:console

# Backend only (server mode)
npm run api:server

# Frontend only
npm run web:dev

# Build frontend for production
npm run web:build
```

## 🎯 Game Strategy

### Backend Bot Strategy

The automated bot implements several strategies:

1. **Quest Selection**:
   - Prioritizes quests with higher rewards
   - Considers quest expiration times
   - Avoids quests about to expire unless necessary

2. **Shopping Logic**:
   - Purchases items when gold is available
   - Focuses on cheaper items for better value
   - Strategic timing based on game state

3. **Risk Management**:
   - Monitors lives and score continuously
   - Implements retry mechanisms for API failures
   - Graceful error handling

### Frontend Features

1. **Interactive Gameplay**:
   - Manual quest selection
   - Real-time game state display
   - Shop browsing and purchasing

2. **Visual Indicators**:
   - Quest difficulty color coding
   - Affordability indicators in shop
   - Expiration warnings for quests

3. **Responsive Design**:
   - Mobile-friendly interface
   - Glassmorphism visual effects
   - Smooth animations and transitions

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Tests include:
- Unit tests for game service logic
- API client mocking
- Error handling scenarios

## 📱 API Endpoints

The backend server exposes the following endpoints:

- `POST /api/game/auto-auto-play` - Auto-play the game

- `POST /api/game/start` - Start a new game
- `GET /api/game/:gameId/state` - Get current game state
- `POST /api/game/:gameId/auto-play` - Auto-play the started game
- `GET /api/game/:gameId/messages` - Get available quests
- `GET /api/game/:gameId/shop` - Get shop items
- `GET /health` - Health check

## 🔧 Configuration

### Environment Variables

```bash
# Backend server port (default: 3000)
PORT=3000

# Frontend development server port (default: 5173)
VITE_PORT=5173
```

### TypeScript Configuration

The project uses project references for efficient compilation:
- Root `tsconfig.json` manages the overall project
- Each package has its own `tsconfig.json` extending the root
- Shared types are properly referenced across packages

## 🎨 UI Design

The frontend features a modern design with:
- **Glassmorphism effects** for a modern look
- **Gradient backgrounds** for visual appeal
- **Responsive grid layouts** for different screen sizes
- **Color-coded elements** for better UX
- **Smooth animations** for interactive feedback

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `npm install`
2. **Type Errors**: Run `npm run build --workspace=packages/shared` first
3. **API Connection**: Check that the backend server is running on port 3000
4. **CORS Issues**: The backend includes CORS middleware for development

### Performance Tips

1. Use the console application for fastest automated gameplay
2. The web interface is optimized for user interaction
3. Both modes implement proper error handling and retry logic

## 📄 License

This project is created for demonstration purposes as part of a technical assessment.

## 🤝 Contributing

This is a showcase project, but feedback and suggestions are welcome!

---

**Ready to conquer the Dragons of Mugloar? Choose your mode and start your adventure!** 🐉✨
