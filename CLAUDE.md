# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omoide Art is a web application that transforms personal Japan travel memories into AI-generated Ukiyo-e style artwork. Users complete a guided 5-step questionnaire to describe their memory, and the system generates personalized art using Google Cloud Vertex AI (Imagen).

## Current Status
- ✅ HTML structure (index.html) - Complete guided memory form
- ✅ CSS styling (style.css) - Japanese-inspired responsive design  
- ✅ JavaScript interactivity (script.js) - Button states and form handling
- ⏳ API integration with Vercel/Google Cloud Vertex AI - Not implemented

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

## Next Steps for Development
1. Create serverless API endpoint (`/api/generate-image`) for Vertex AI integration
2. Replace placeholder form submission with actual API call
3. Add loading states and progress indicators
4. Implement image display in canvas container
5. Add error handling for API failures