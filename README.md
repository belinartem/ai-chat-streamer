# AI Chat Streamer

A high-performance AI chat interface built with React and TypeScript, designed to handle extreme streaming scenarios with zero UI freezes.

## 🚀 Features

- **Extreme Performance**: Handles 5MB+ message history with 100+ messages
- **High-Speed Streaming**: Supports streaming at 10-20ms chunk intervals (50-100 updates/second)
- **Smooth UI**: Maintains 60 FPS with zero freezes during streaming
- **Virtual Scrolling**: Efficiently renders large message lists using @tanstack/react-virtual
- **Rich Content Support**: Markdown rendering, code syntax highlighting, and mixed content types
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Type-Safe**: Full TypeScript support throughout the codebase
- **State Management**: Zustand with granular selectors for optimal re-renders

## 🛠️ Tech Stack

- **Framework**: React 18.3 with Vite 5.4
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 3.4 with shadcn/ui components
- **State Management**: Zustand with middleware support
- **Data Fetching**: TanStack Query (React Query)
- **Virtualization**: TanStack Virtual for efficient list rendering
- **Routing**: React Router DOM 6.30
- **Markdown**: react-markdown with syntax highlighting
- **Testing**: Vitest with Testing Library
- **Linting**: ESLint 9 with TypeScript support

## 📋 Prerequisites

- Node.js 18+ (or Bun runtime)
- npm, yarn, pnpm, or bun package manager

## 🔧 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-chat-streamer-main
```

2. Install dependencies:

```bash
npm install
# or
bun install
```

## 🚀 Running the Project

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8080`

### Production Build

Build the optimized production bundle:

```bash
npm run build
```

### Development Build

Build with development mode optimizations:

```bash
npm run build:dev
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## 🐳 Docker

Run the application in a Docker container:

```bash
# Build the Docker image
docker build -t ai-chat-streamer:latest .

# Run the container
docker run -d -p 8080:80 --name ai-chat-app ai-chat-streamer:latest

# Stop the container
docker stop ai-chat-app

# Start the container again
docker start ai-chat-app
```

The application will be available at `http://localhost:8080`

## 🧪 Testing

Run tests once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── chat/           # Chat-specific components
│   │   ├── ChatContainer.tsx       # Main chat wrapper
│   │   ├── ChatHeader.tsx          # Chat header
│   │   ├── ChatInput.tsx           # Message input
│   │   ├── ChatMessage.tsx         # Individual message
│   │   ├── MessageContent.tsx      # Message content renderer
│   │   └── VirtualizedMessageList.tsx  # Virtualized list
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── streamingEngine.ts  # High-performance streaming logic
│   └── utils.ts        # Utility functions
├── pages/              # Route pages
│   ├── Index.tsx       # Main chat page
│   └── NotFound.tsx    # 404 page
├── stores/             # Zustand state stores
│   └── chatStore.ts    # Chat state management
└── test/               # Test configuration and setup
```

## 🎯 Key Features Explained

### Streaming Engine

The streaming engine (`src/lib/streamingEngine.ts`) is architected for extreme performance:

- Generates chunks at 10-20ms intervals
- Uses RAF (requestAnimationFrame) for 60fps UI updates
- Decoupled producer/consumer pattern prevents UI blocking
- Buffer-based batch updates

### State Management

Zustand store (`src/stores/chatStore.ts`) with:

- Granular selectors to minimize re-renders
- Immutable updates with structural sharing
- Separated streaming state for independent updates
- Subscription-based middleware for fine-grained control

### Virtualization

Virtual scrolling implementation:

- Renders only visible messages
- Handles lists with 100+ messages efficiently
- Maintains scroll position during streaming
- Auto-scrolls to new messages

## 📦 Available Scripts

| Script               | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Build for production     |
| `npm run build:dev`  | Build for development    |
| `npm run preview`    | Preview production build |
| `npm run lint`       | Run ESLint               |
| `npm test`           | Run tests once           |
| `npm run test:watch` | Run tests in watch mode  |

## 🎨 UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/) components library, which includes:

- Accordion, Alert Dialog, Avatar, Badge
- Button, Card, Checkbox, Dialog
- Dropdown Menu, Input, Label, Popover
- Scroll Area, Select, Separator, Slider
- Tabs, Textarea, Toast, Tooltip
- And many more...

## 🔑 Environment Variables

Create a `.env` file in the root directory if needed for API keys or configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
