# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omoide Art is a web application that transforms personal Japan travel memories into AI-generated shin-hanga style artwork. Users complete a guided 5-step questionnaire to describe their memory, and the system uses advanced AI preprocessing (Gemini API) to enhance prompts before generating high-resolution 2048x2048 artwork via Wavespeed AI. The system now features a Magic Link gallery architecture with print-on-demand capabilities.

## Current Status
- ✅ HTML structure (public/index.html) - Complete guided memory form
- ✅ CSS styling (public/style.css) - Japanese-inspired responsive design with square image containers
- ✅ JavaScript interactivity (script.js) - Form handling with Magic Link redirect
- ✅ AI preprocessing pipeline - Gemini API transforms basic inputs into sophisticated artistic prompts
- ✅ High-resolution image generation - Wavespeed AI producing 2048x2048 shin-hanga artwork
- ✅ Magic Link gallery system - Permanent URLs for sharing and revisiting galleries
- ✅ Tiered storage - Print-quality originals + watermarked web versions via Vercel Blob
- ✅ 30-day expiration system - Automated cleanup with purchase protection
- ✅ Print-on-demand integration - Prodigi API foundation for canvas and photo prints
- ✅ Deployment ready - Vercel serverless functions with cron jobs

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
BLOB_READ_WRITE_TOKEN='Your-Vercel-Blob-Token-Goes-Here'
PRODIGI_API_KEY='Your-Prodigi-API-Key-Goes-Here'
PRODIGI_SANDBOX='true'
CLEANUP_SECRET='your-cleanup-secret-key'
CRON_SECRET='your-cron-secret-key'
```

## Architecture

This is a Magic Link gallery system with serverless backend:

- `public/index.html` - Main HTML structure with 5-question memory form across 3 "acts"
- `public/script.js` - Client-side JavaScript for form submission and Magic Link redirect
- `public/style.css` - Complete styling using CSS custom properties and responsive design
- `public/gallery/index.html` - Dynamic gallery display page with print ordering
- `/api/generate.js` - Synchronous gallery creation with blob storage
- `/api/gallery.js` - Gallery data retrieval with expiration checking
- `/api/cleanup-expired.js` - Automated cleanup of expired galleries
- `/api/cron-cleanup.js` - Daily cron job for maintenance
- `/api/prodigi-orders.js` - Print-on-demand order management

## Key Technical Details

### Form Structure
The memory questionnaire follows a storytelling approach:
- **Act I (The Scene)**: Location input + atmosphere selection (5 radio buttons)
- **Act II (The Subject)**: Main focus text input
- **Act III (The Magic)**: Unique detail textarea + feeling tags (6 multi-select buttons)

### Magic Link Gallery Flow
1. User submits memory form
2. AI enhances prompts via Gemini API
3. Wavespeed AI generates 4 high-resolution images synchronously
4. System creates watermarked web versions using Sharp
5. Both versions uploaded to Vercel Blob storage
6. Gallery metadata created with 30-day expiration
7. User redirected to permanent Magic Link: `/gallery/{uuid}`
8. Gallery displays memory details + artwork with print ordering

### Styling Approach
- Japanese-inspired design (washi paper backgrounds, hanko red accents)
- Typography: Inter (UI) + Noto Serif JP (headings)
- Fully responsive with mobile-first breakpoints
- CSS custom properties for consistent theming

## Technical Implementation
- **Frontend**: Vanilla HTML/CSS/JS with Japanese-inspired design
- **Backend**: Vercel serverless functions with blob storage
- **AI Pipeline**:
  - **Text Enhancement**: Gemini 1.5 Flash transforms user inputs into sophisticated prompts
  - **Image Generation**: Wavespeed AI (Imagen 4.0 Ultra) creates 2048x2048 artwork
- **Art Style**: Modern shin-hanga woodblock print aesthetic
- **Storage**: Vercel Blob with tiered print/web versions
- **Print Integration**: Prodigi API for canvas prints, photo prints, etc.

## Recent Major Improvements
- ✅ **Magic Link Architecture**: Complete redesign from async polling to synchronous galleries
- ✅ **Vercel Blob Integration**: Persistent storage for print and web versions
- ✅ **Watermark System**: Automated watermarking for web versions using Sharp
- ✅ **30-Day Expiration**: Galleries expire unless purchased, with automated cleanup
- ✅ **Print-on-Demand Foundation**: Prodigi API integration for physical products
- ✅ **Gallery Display System**: Beautiful responsive gallery pages with memory context
- ✅ **Automated Maintenance**: Daily cron jobs for expired gallery cleanup
- ✅ **Dynamic Routing**: Vercel rewrites for `/gallery/{id}` URLs

## System Architecture

### Magic Link Gallery Pipeline
1. **User Input**: 5-question memory form captures location, focus, details, atmosphere, feelings
2. **AI Enhancement**: Gemini 1.5 Flash transforms basic inputs using expert art director instructions
3. **Synchronous Generation**: Wavespeed AI creates 4 variations in 2K resolution
4. **Image Processing**: Sharp creates watermarked web versions (2048x2048) + preserves print versions
5. **Blob Storage**: Vercel Blob stores both versions in organized gallery structure
6. **Metadata Creation**: Gallery metadata with expiration, user inputs, and image references
7. **Magic Link**: Permanent shareable URL with 30-day expiration protection

### Storage Structure
```
galleries/
  {gallery-id}/
    metadata.json          # Gallery info, expiration, user inputs
    print-1.jpg           # High-quality print version
    print-2.jpg
    print-3.jpg
    print-4.jpg
    web-1.jpg             # Watermarked web version
    web-2.jpg
    web-3.jpg
    web-4.jpg
```

### Cost Structure
- **Gemini API**: ~$0.0001-0.0005 per prompt enhancement (negligible)
- **Wavespeed AI**: ~$0.058 per 2K image generation (4 images)
- **Vercel Blob**: Storage costs for images and metadata
- **Total**: Extremely cost-effective for professional-quality results

## Expiration & Cleanup System

### 30-Day Gallery Lifecycle
- Galleries created with 30-day expiration timestamp
- Web versions watermarked, print versions preserved
- Purchase protection prevents deletion of paid galleries
- Daily cron job (`0 2 * * *`) cleans expired galleries
- Manual cleanup API available with secret key authentication

### Print-on-Demand Integration

The system includes Prodigi API integration for physical product fulfillment:

**Available Products:**
- 8" x 10" Canvas Print - $24.99
- 12" x 16" Canvas Print - $39.99
- 8" x 10" Photo Print - $8.99
- 12" x 16" Photo Print - $14.99

**API Endpoints:**
- `POST /api/prodigi-orders` - Product catalog, quotes, order creation
- Gallery pages include "Order Prints" functionality
- Sandbox/production environment support

**Integration Status:**
- ✅ API wrapper and product catalog
- ✅ Quote generation system
- ✅ Order creation pipeline
- ⚠️ Requires Prodigi API credentials for activation
- ⚠️ Needs full checkout UI and payment processing

## Environment Variables Required

### Core System
- `GEMINI_API_KEY` - Google Gemini API for prompt enhancement
- `WAVESPEED_API_KEY` - Wavespeed AI for image generation
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage access

### Print Integration
- `PRODIGI_API_KEY` - Prodigi print-on-demand service
- `PRODIGI_SANDBOX` - Set to 'true' for testing

### Maintenance
- `CLEANUP_SECRET` - Secret key for manual cleanup API
- `CRON_SECRET` - Vercel cron job authentication

## Future Enhancements
1. **Full Checkout Flow**: Complete UI for product selection and payment
2. **Order Management**: Track purchases in gallery metadata
3. **Enhanced Products**: Additional print formats and sizes
4. **Analytics**: Gallery view tracking and usage metrics
5. **Social Features**: Gallery sharing and discovery

## Magic Link Benefits
- **Permanent URLs**: Galleries never lose their links
- **Mobile Optimized**: Responsive design for all devices
- **Print Ready**: Immediate access to high-quality print versions
- **Memory Context**: Display original memory inputs alongside artwork
- **Expiration Protection**: 30-day purchase window with automated cleanup
- **Cost Effective**: No ongoing storage costs for expired galleries