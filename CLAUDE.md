# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omoide Art is a web application that transforms personal Japan travel memories into AI-generated Ukiyo-e style artwork. Users complete a guided 5-step questionnaire to describe their memory, and the system generates personalized art using Google Gemini API with Imagen 4.0 Ultra.

## Current Status
- ✅ HTML structure (public/index.html) - Complete guided memory form
- ✅ CSS styling (public/style.css) - Japanese-inspired responsive design with square image containers
- ✅ JavaScript interactivity (script.js) - Button states and form handling
- ✅ API integration (api/generate.js) - Fully working with Google Gemini API + Imagen 4.0 Ultra
- ✅ Image generation - Producing 1024x1024 Ukiyo-e style artwork
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
GOOGLE_API_KEY='Your-Secret-API-Key-Goes-Here'
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
- **AI Model**: Google Imagen 4.0 Ultra via Gemini API
- **Image Output**: 1024x1024 Ukiyo-e style artwork
- **Container**: Square 512x512 display with perfect aspect ratio

## Recent Fixes
- ✅ Resolved CSS file conflicts (consolidated to `/public/style.css`)
- ✅ Fixed square image container display (was showing rectangular)
- ✅ Switched from Vertex AI to Gemini API (quota/auth issues)
- ✅ Implemented proper error handling and loading states

## Next Steps for Optimization
1. **Prompt Engineering**: Refine the artistic prompt template for better Ukiyo-e results
2. **Resolution Options**: Configure output resolution (currently 1024x1024, could be 2048x2048)
3. **Form Optimization**: Review the 5 questions - are they capturing the best memory details?
4. **UI Polish**: Enhance visual design and user experience
5. **Additional Features**: Consider download, share, or gallery functionality