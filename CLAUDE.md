# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omoide Art is a web application that transforms personal Japan travel memories into AI-generated shin-hanga style artwork. Users complete a guided 6-step questionnaire to describe their memory, and the system uses advanced AI preprocessing (Gemini API) to enhance prompts before generating print-quality 4K artwork via Wavespeed AI. Features a 3-roll system with persistent image storage.

## Current Status
- ✅ HTML structure (public/index.html) - Complete guided memory form with season selection
- ✅ CSS styling (public/style.css) - Japanese-inspired responsive design with dynamic image containers
- ✅ JavaScript interactivity (script.js) - Full form handling with roll tracking and sessionStorage
- ✅ AI preprocessing pipeline - Gemini API transforms basic inputs into sophisticated artistic prompts
- ✅ 4K image generation - Wavespeed AI producing 4096x4096 print-quality shin-hanga artwork
- ✅ 3-roll system - Users get 3 rolls of 4 images each (12 total images per session)
- ✅ Image persistence - SessionStorage tracks generated images across page refreshes
- ✅ Error handling & retry logic - Robust API timeout handling with automatic retries
- ✅ Deployment ready - Vercel serverless functions configured and tested

## Development Commands

### Local Development
```bash
# Install Vercel CLI globally (for serverless functions)
npm install -g vercel

# Start local development server
vercel dev
```

### Environment Setup
Create `.env.local` for API keys:
```
GEMINI_API_KEY='Your-Gemini-API-Key-Goes-Here'
WAVESPEED_API_KEY='Your-Wavespeed-API-Key-Goes-Here'
```

## Architecture

This is a frontend-focused application with serverless backend:

- `index.html` - Main HTML structure with 6-question memory form across 3 "acts" including season selection
- `script.js` - Client-side JavaScript for form interactions, roll tracking, and sessionStorage management
- `style.css` - Complete styling using CSS custom properties and responsive design
- `/api/generate.js` - Vercel serverless function handling AI preprocessing and image generation
- No build process - runs directly in the browser

## Key Technical Details

### Form Structure
The memory questionnaire follows a storytelling approach:
- **Act I (The Scene)**: Location input + season selection + atmosphere selection (5 radio buttons)
- **Act II (The Subject)**: Main focus text input
- **Act III (The Magic)**: Unique detail textarea + feeling tags (6 multi-select buttons)
- **Canvas Choice**: Aspect ratio selection (square, portrait, landscape)

### JavaScript Implementation
- Event-driven button state management
- Single-select atmosphere and season buttons (radio-like behavior)
- Multi-select feeling tags (checkbox-like behavior)
- 3-roll system with roll counter and progress tracking
- SessionStorage for image persistence across page refreshes
- Dynamic gallery with lightbox functionality
- Robust error handling and user feedback

### Styling Approach
- Japanese-inspired design (washi paper backgrounds, hanko red accents)
- Typography: Inter (UI) + Noto Serif JP (headings)
- Fully responsive with mobile-first breakpoints
- CSS custom properties for consistent theming

## Technical Implementation
- **Frontend**: Vanilla HTML/CSS/JS with Japanese-inspired design
- **Backend**: Vercel serverless function at `/api/generate.js`
- **AI Pipeline**:
  - **Text Enhancement**: Gemini 1.5 Flash transforms user inputs into sophisticated prompts (1000 token limit)
  - **Image Generation**: Wavespeed AI (Seedream-v4 Sequential) creates 4K print-quality artwork
- **Art Style**: Modern shin-hanga woodblock print aesthetic in the style of Kawase Hasui
- **Display**: Dynamic gallery with lightbox, roll tracking, and sessionStorage persistence

## Recent Major Improvements
- ✅ **4K Resolution Upgrade**: Upgraded to 4096x4096 print-quality images (4x pixel density)
- ✅ **3-Roll System**: Implemented session-based roll tracking with 12 total images per user
- ✅ **SessionStorage Persistence**: Images persist across page refreshes and browser sessions
- ✅ **Error Handling & Retries**: Robust API timeout handling with automatic retry logic
- ✅ **Token Limit Fix**: Increased Gemini output tokens from 200 to 1000 for complete prompts
- ✅ **Season Selection**: Added seasonal context to memory form for enhanced artwork
- ✅ **Dynamic Gallery**: Live image gallery with lightbox, download, and roll counter
- ✅ **API Optimization**: Switched to sync mode for faster, more reliable image generation

## System Architecture

### AI Processing Pipeline
1. **User Input**: 6-question memory form captures location, season, focus, details, atmosphere, feelings, aspect ratio
2. **AI Enhancement**: Gemini 1.5 Flash transforms basic inputs using expert art director instructions (1000 tokens)
3. **Image Generation**: Enhanced prompts sent to Wavespeed AI (Seedream-v4 Sequential) for 4K rendering
4. **Output**: Print-quality 4096x4096 shin-hanga style artwork (4 variations per roll)
5. **Storage**: Images stored in sessionStorage with roll tracking and persistence

### Cost Structure
- **Gemini API**: ~$0.0001-0.0005 per prompt enhancement (negligible)
- **Wavespeed AI**: $0.027 per 4K image ($0.108 per 4-image roll)
- **Total per user**: $0.324 for complete 3-roll experience (12 premium 4K images)
- **Exceptional value**: Print-quality 4K shin-hanga artwork at ~$0.027 per piece

## Future Considerations
1. **Usage Controls**: Implement rate limiting for cost management
2. **User Experience**: Add download and sharing functionality
3. **Gallery**: Consider showcasing generated artwork
4. **Form Refinement**: Optimize questions based on user feedback