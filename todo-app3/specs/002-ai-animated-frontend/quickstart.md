# Quickstart Guide: AI Animated Frontend

## Prerequisites
- Node.js 18+ installed
- Python 3.11+ installed
- Access to backend API endpoints
- Internet connection for CDN assets

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd todo-app3
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_BASE_URL=<backend-api-url>
REACT_APP_OPENAI_API_KEY=<your-openai-key>
REACT_APP_ANIMATION_ENABLED=true
REACT_APP_DEFAULT_AVATAR_STYLE=default
```

### 4. Start the Development Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Key Components

### AI Avatar Component
Located at `frontend/src/components/ai-avatar/AIAvatar.jsx`
- Handles animated avatar expressions
- Manages animation sequences based on AI states
- Integrates with backend processing events

### Animation System
Located at `frontend/src/components/animation-system/`
- Core animation engine using Framer Motion
- Performance optimization for 30+ FPS
- Accessibility features for motion sensitivity

### Skill Indicators
Located at `frontend/src/components/skill-indicators/`
- Visual indicators for active AI skills
- Progress bars and status badges
- Customizable appearance options

## Configuration Options

### Animation Settings
Adjust in `frontend/src/config/animation-config.js`:
- Animation speed multiplier
- Performance thresholds
- Accessibility defaults

### Avatar Styles
Available in `frontend/src/assets/avatars/`:
- Default animated avatar
- Custom style options
- Expression mapping configurations

## API Integration

The frontend connects to backend endpoints:
- `/api/chat` - Main chat interface
- `/api/status` - Backend health check
- WebSocket connection for real-time updates

## Development Workflow

1. Run `npm run dev` for hot-reloading development
2. Use `npm test` to run animation component tests
3. Build with `npm run build` for production
4. Lint with `npm run lint` to ensure code quality

## Troubleshooting

### Performance Issues
- Check browser console for animation performance warnings
- Verify 30+ FPS on target devices
- Adjust animation complexity in config if needed

### Accessibility Concerns
- Verify reduced-motion settings work correctly
- Test keyboard navigation for animated elements
- Ensure all visual indicators have alternative representations

### Connection Problems
- Confirm backend API endpoint is accessible
- Check WebSocket connection status
- Verify authentication tokens are valid