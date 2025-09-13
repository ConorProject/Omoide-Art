# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omoide Art is a web application that transforms personal Japan travel memories into AI-generated shin-hanga style artwork. Users complete a guided 5-step questionnaire to describe their memory, and the system uses advanced AI preprocessing (Gemini API) to enhance prompts before generating high-resolution 2048x2048 artwork via Wavespeed AI.

## Current Status
- ✅ HTML structure (public/index.html) - Complete guided memory form
- ✅ CSS styling (public/style.css) - Japanese-inspired responsive design with square image containers
- ✅ JavaScript interactivity (script.js) - Button states and form handling
- ✅ AI preprocessing pipeline - Gemini API transforms basic inputs into sophisticated artistic prompts
- ✅ High-resolution image generation - Wavespeed AI producing 2048x2048 shin-hanga artwork
- ✅ Advanced prompt engineering - Expert art director instructions with foreground anchors and layered composition
- ✅ Deployment ready - Vercel serverless functions configured

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

This is a frontend-focused application with planned serverless backend:

- `index.html` - Main HTML structure with 5-question memory form across 3 "acts"
- `script.js` - Client-side JavaScript for form interactions and button state management
- `style.css` - Complete styling using CSS custom properties and responsive design
- No build process - runs directly in the browser
- Planned: Vercel serverless functions for AI image generation

## Key Technical Details

### Form Structure
The memory questionnaire follows a storytelling approach:
- **Act I (The Scene)**: Location input + atmosphere selection (5 radio buttons)
- **Act II (The Subject)**: Main focus text input  
- **Act III (The Magic)**: Unique detail textarea + feeling tags (6 multi-select buttons)

### JavaScript Implementation
- Event-driven button state management
- Single-select atmosphere buttons (radio-like behavior)
- Multi-select feeling tags (checkbox-like behavior)
- Form submission currently shows placeholder alert - needs API integration

### Styling Approach
- Japanese-inspired design (washi paper backgrounds, hanko red accents)
- Typography: Inter (UI) + Noto Serif JP (headings)
- Fully responsive with mobile-first breakpoints
- CSS custom properties for consistent theming

## Technical Implementation
- **Frontend**: Vanilla HTML/CSS/JS with Japanese-inspired design
- **Backend**: Vercel serverless function at `/api/generate.js`
- **AI Pipeline**: 
  - **Text Enhancement**: Gemini 1.5 Flash transforms user inputs into sophisticated prompts
  - **Image Generation**: Wavespeed AI (Imagen 4.0 Ultra) creates 2048x2048 artwork
- **Art Style**: Modern shin-hanga woodblock print aesthetic
- **Display**: Square containers with perfect aspect ratio

## Recent Major Improvements
- ✅ **AI Preprocessing Pipeline**: Implemented Gemini API for sophisticated prompt enhancement
- ✅ **Resolution Upgrade**: Upgraded from 1024x1024 to 2048x2048 high-resolution images
- ✅ **API Integration**: Switched to Wavespeed AI for reliable Imagen 4.0 Ultra access
- ✅ **Advanced Prompt Engineering**: Expert art director instructions with foreground anchors and layered composition
- ✅ **Historical Accuracy**: Updated from generic "Ukiyo-e" to historically accurate "shin-hanga" style

## System Architecture

### AI Processing Pipeline
1. **User Input**: 5-question memory form captures location, focus, details, atmosphere, feelings
2. **AI Enhancement**: Gemini 1.5 Flash transforms basic inputs using expert art director instructions
3. **Image Generation**: Enhanced prompts sent to Wavespeed AI (Imagen 4.0 Ultra) for 2K rendering
4. **Output**: High-resolution 2048x2048 shin-hanga style artwork

### Cost Structure
- **Gemini API**: ~$0.0001-0.0005 per prompt enhancement (negligible)
- **Wavespeed AI**: ~$0.058 per 2K image generation
- **Total**: Extremely cost-effective for professional-quality results

## Future Considerations
1. **Usage Controls**: Implement rate limiting for cost management
2. **User Experience**: Add download and sharing functionality
3. **Gallery**: Consider showcasing generated artwork
4. **Form Refinement**: Optimize questions based on user feedback