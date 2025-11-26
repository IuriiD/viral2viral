# viral2viral - UGC Advertisement Video Generator

An AI-powered application that analyzes successful UGC (User-Generated Content) advertisement videos and generates new promotional videos for your products based on the same style and techniques.

## Overview

viral2viral allows marketers to upload a reference UGC advertisement video, extracts key insights using AI (visual style, messaging tone, pacing, engagement techniques), and then generates a brand-new advertisement video for their product while maintaining the successful elements of the original.

**[Watch Demo on YouTube](https://youtu.be/Ylw-e1AayGE)**

**Built with [GitHub Spec Kit](https://github.com/github/spec-kit)**

## Features

- **Video Upload & Analysis**: Upload UGC advertisement videos (MP4, MOV, AVI up to 100MB) and get AI-powered analysis of visual style, messaging, pacing, and engagement techniques
- **Product Customization**: Input your product details (name, description, image) to personalize the generated advertisement
- **AI Prompt Generation**: Automatically generate and moderate text-to-video prompts combining insights from the original video with your product information
- **Video Generation**: Create new advertisement videos using advanced AI video generation services (Sora, Laozhang)
- **Side-by-Side Comparison**: View original and generated videos together to compare results
- **Cloud Storage**: All videos and assets are stored securely in AWS S3

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js/TypeScript)
- **Video Analysis**: Google Gemini 2.5 Flash API
- **Text Generation**: OpenAI GPT-5 (via Laozhang API)
- **Video Generation**: OpenAI Sora 2 (via Laozhang API)
- **Storage**: AWS S3 with presigned URLs
- **Architecture**: Modular structure with separate services for analysis, generation, prompts, products, storage, and sessions

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Custom hooks (`useWorkflow`)
- **API Client**: Axios

### Infrastructure
- Session-based workflow management (no authentication required for MVP)
- RESTful API with modular controllers
- File upload handling with Multer
- Environment-based configuration

## Project Structure

```
viral2viral/
├── backend/              # NestJS API server
│   └── src/
│       ├── modules/      # Feature modules
│       │   ├── analysis/ # Video analysis with Gemini
│       │   ├── generation/ # Video generation orchestration
│       │   ├── prompt/   # Prompt generation & moderation
│       │   ├── product/  # Product information management
│       │   ├── sessions/ # Session state management
│       │   ├── storage/  # AWS S3 integration
│       │   └── video/    # Video upload handling
│       ├── common/       # Shared utilities & types
│       └── config/       # Configuration management
├── frontend/             # React SPA
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── services/     # API client
│       └── types/        # TypeScript definitions
├── scripts/              # Testing & utility scripts
│   └── output/          # Example generated videos
└── specs/               # Spec-First development docs
    └── 001-ugc-video-generator/
```

## Example Output

See example generated videos in [`scripts/output/`](scripts/output/):
- `generated-26.11.25.mp4` - Generated advertisement video

## Getting Started

### Prerequisites
- Node.js 18+
- AWS account with S3 bucket configured
- API keys for:
  - Google Gemini API
  - OpenAI API
  - Laozhang API (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/IuriiD/viral2viral.git
cd viral2viral
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend: create backend/.env
cp backend/.env.example backend/.env
# Add your API keys and AWS credentials

# Frontend: create frontend/.env
cp frontend/.env.example frontend/.env
# Configure API endpoint
```

4. Start the development servers:
```bash
# Terminal 1: Start backend (port 3000)
cd backend
npm run start:dev

# Terminal 2: Start frontend (port 5173)
cd frontend
npm run dev
```

5. Open http://localhost:5173 in your browser

## Workflow

1. **Upload Reference Video**: Upload a successful UGC advertisement video
2. **Analyze**: AI extracts key elements (style, tone, pacing, techniques)
3. **Edit Analysis**: Review and modify the analysis if needed
4. **Add Product Info**: Enter your product name, description, and upload product image
5. **Generate Prompt**: AI creates a text-to-video prompt combining insights + product
6. **Moderate & Approve**: Review and edit the prompt
7. **Generate Video**: Create your new advertisement video
8. **Compare**: View original and generated videos side-by-side
9. **Download**: Save your generated video

## API Documentation

See [specs/001-ugc-video-generator/contracts/openapi.yaml](specs/001-ugc-video-generator/contracts/openapi.yaml) for full API specification.

## Development

- **Backend Tests**: `cd backend && npm test`
- **Frontend Tests**: `cd frontend && npm test`
- **Linting**: `npm run lint` in respective directories
- **Formatting**: `npm run format` in respective directories

## License

UNLICENSED - Private project

## Contributing

This project follows spec-first development practices. See [specs/001-ugc-video-generator/](specs/001-ugc-video-generator/) for detailed specifications and development plans.
