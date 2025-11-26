# Quickstart Guide: UGC Video Generator

**Feature**: `001-ugc-video-generator`  
**Date**: 2025-11-24  
**Version**: 1.0.0

This guide will help you get started with the UGC Video Generator application, which creates advertisement videos based on user-generated content analysis.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Using the Application](#using-the-application)
7. [API Examples](#api-examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The UGC Video Generator allows you to:
1. Upload a sample UGC advertisement video
2. Analyze it using AI to extract successful elements
3. Input your product information
4. Generate a custom text-to-video prompt
5. Create a new advertisement video for your product

**Tech Stack**: Node.js, Nest.js, React, Vite, TypeScript, AWS S3, Google Gemini, OpenAI (GPT-5 & Sora 2 via laozhang.ai)

**Note**: This is a POC (Proof of Concept) application. Session data is stored in memory and not persisted.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v20 or higher installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **AWS Account** with S3 access
- **Google Cloud Account** with Gemini API access
- **OpenAI API Key** (via laozhang.ai proxy)
- **Git** for cloning the repository

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/zeely.git
cd zeely
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Configuration

### 1. Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Google Gemini API
GOOGLE_API_KEY=your_google_api_key

# OpenAI API (laozhang.ai proxy)
OPENAI_API_KEY=your_laozhang_api_key
OPENAI_API_BASE_URL=https://api.laozhang.ai/v1

# Session Configuration (Optional)
SESSION_TTL_HOURS=24
```

### 2. AWS S3 Setup

1. Create an S3 bucket (e.g., `ugc-video-generator`)
2. Configure CORS policy to allow uploads from your frontend:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. Ensure your IAM user has `s3:PutObject`, `s3:GetObject`, and `s3:PutObjectAcl` permissions

### 3. Frontend Configuration

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

The backend API will start on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Serve Frontend from Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

The full application will be available on `http://localhost:3000`

---

## Using the Application

### Workflow Steps

#### 1. Upload Source Video

1. Navigate to `http://localhost:5173` in your browser
2. Click "Upload Video" and select a UGC advertisement video (MP4, MOV, or AVI, max 100MB)
3. Wait for the upload progress to complete
4. You'll see a thumbnail preview once uploaded

#### 2. Analyze Video

1. Click "Analyze Video" button
2. AI will analyze the video using Google Gemini (takes 1-3 minutes)
3. View the analysis results showing:
   - Visual style and camera angles
   - Messaging tone and pacing
   - Audio characteristics
   - Key engagement techniques
4. Optionally, edit the analysis text to refine insights

#### 3. Enter Product Information

1. Fill in the "Product Name" field (3-100 characters)
2. Enter a "Product Description" (up to 250 characters)
3. Click "Save Product Info"

#### 4. Upload Product Image

1. Click "Upload Product Image"
2. Select your product image (PNG, JPG, or WebP, max 10MB)
3. Preview the uploaded image

#### 5. Generate Video Prompt

1. Click "Generate Prompt" button
2. AI will create a text-to-video prompt combining analysis insights with your product details (takes ~30 seconds)
3. Review the generated prompt
4. Optionally, edit the prompt text (max 500 characters)
5. Click "Approve Prompt" when satisfied

#### 6. Generate Video

1. Click "Generate Video" button
2. Video generation begins using OpenAI Sora 2 (takes 3-5 minutes)
3. A progress indicator shows the generation status
4. The page automatically polls for updates

#### 7. Download Video

1. Once generation completes, you'll see both videos side-by-side:
   - Original UGC video
   - Your newly generated advertisement video
2. Click "Download Video" to save the generated video to your device

---

## API Examples

### Using the API Directly

All API examples use `curl`. Base URL: `http://localhost:3000/api`

#### 1. Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "created",
    "createdAt": "2025-11-24T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-11-24T12:00:00Z",
    "requestId": "req-uuid"
  }
}
```

#### 2. Get Upload URL for Video

```bash
curl -X POST http://localhost:3000/api/sessions/{sessionId}/video/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "sample-video.mp4",
    "fileSize": 52428800,
    "mimeType": "video/mp4"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/your-bucket",
    "uploadFields": {
      "key": "sessions/123e.../original.mp4",
      "policy": "...",
      "signature": "..."
    },
    "s3Key": "sessions/123e4567-e89b-12d3-a456-426614174000/original.mp4"
  },
  "meta": {...}
}
```

#### 3. Upload Video to S3

```bash
curl -X POST "{uploadUrl}" \
  -F "key={uploadFields.key}" \
  -F "policy={uploadFields.policy}" \
  -F "signature={uploadFields.signature}" \
  -F "file=@/path/to/video.mp4"
```

#### 4. Trigger Video Analysis

```bash
curl -X POST http://localhost:3000/api/sessions/{sessionId}/analysis \
  -H "Content-Type: application/json"
```

#### 5. Poll Analysis Status

```bash
curl http://localhost:3000/api/sessions/{sessionId}/analysis
```

**Response (complete):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-uuid",
    "status": "complete",
    "sceneBreakdown": "Detailed scene-by-scene analysis...",
    "analyzedAt": "2025-11-24T12:03:00Z"
  },
  "meta": {...}
}
```

#### 6. Submit Product Information

```bash
curl -X POST http://localhost:3000/api/sessions/{sessionId}/product \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "SuperBelly Nutrition Powder",
    "productDescription": "All-in-one daily nutrition supplement"
  }'
```

#### 7. Generate Prompt

```bash
curl -X POST http://localhost:3000/api/sessions/{sessionId}/prompt \
  -H "Content-Type: application/json"
```

#### 8. Approve Prompt

```bash
curl -X POST http://localhost:3000/api/sessions/{sessionId}/prompt/approve \
  -H "Content-Type: application/json"
```

#### 9. Generate Video

```bash
curl -X POST http://localhost:3000/api/sessions/{sessionId}/generate \
  -H "Content-Type: application/json"
```

#### 10. Poll Video Generation Status

```bash
curl http://localhost:3000/api/sessions/{sessionId}/generate
```

**Response (complete):**
```json
{
  "success": true,
  "data": {
    "generatedVideoId": "video-uuid",
    "status": "complete",
    "downloadUrl": "https://s3.amazonaws.com/...",
    "fileName": "generated-video.mp4",
    "completedAt": "2025-11-24T12:10:00Z"
  },
  "meta": {...}
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Video upload failed"

**Possible causes:**
- File size exceeds 100MB limit
- Invalid file format (must be MP4, MOV, or AVI)
- CORS policy not configured on S3 bucket

**Solution:**
- Check file size and format
- Verify S3 bucket CORS policy includes your frontend origin

#### 2. "Video analysis failed"

**Possible causes:**
- Google Gemini API key invalid or rate limited
- Video file corrupted or unreadable
- Video too long (>10 minutes)

**Solution:**
- Check `GOOGLE_API_KEY` environment variable
- Try a different video file
- Check backend logs for detailed error

#### 3. "Prompt generation failed"

**Possible causes:**
- laozhang.ai API key invalid
- Analysis not complete before prompt generation
- Product information missing

**Solution:**
- Verify `OPENAI_API_KEY` is set correctly
- Ensure analysis completed successfully
- Check product name and description were submitted

#### 4. "Video generation timeout"

**Possible causes:**
- Sora 2 generation taking longer than expected (can be 5-10 minutes)
- Network connectivity issues
- API rate limiting

**Solution:**
- Continue polling - generation may still complete
- Check backend logs for errors
- Retry video generation after a few minutes

#### 5. "Session not found"

**Possible causes:**
- Session expired (24-hour TTL)
- Backend restarted (in-memory sessions lost)
- Invalid session ID

**Solution:**
- Start a new session
- For persistent sessions, implement database storage (future enhancement)

### Debugging Tips

#### Backend Logs

```bash
cd backend
npm run start:dev
# Watch console output for detailed error messages
```

#### Check S3 Files

```bash
aws s3 ls s3://your-bucket-name/sessions/ --recursive
```

#### Test API Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T12:00:00Z"
}
```

---

## Next Steps

- **Testing**: Run the test suite with `npm test` in backend/frontend directories
- **API Documentation**: View the complete OpenAPI spec at `specs/001-ugc-video-generator/contracts/openapi.yaml`
- **Data Model**: Review entity definitions in `specs/001-ugc-video-generator/data-model.md`
- **Research**: Read technical decisions in `specs/001-ugc-video-generator/research.md`

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review backend logs for detailed error messages
- Consult the OpenAPI spec for API contract details
- File an issue in the GitHub repository

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-24  
**Status**: Ready for Implementation
