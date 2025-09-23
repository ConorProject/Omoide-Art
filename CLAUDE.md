# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omoide Art is a web application that transforms personal Japan travel memories into AI-generated shin-hanga style artwork. Users complete a guided 5-step questionnaire to describe their memory, and the system uses advanced AI preprocessing (Gemini API) to enhance prompts before generating high-resolution 4096x4096 artwork via Wavespeed AI. The system now features a Magic Link gallery architecture with print-on-demand capabilities.

## Current Status
- ✅ HTML structure (public/index.html) - Complete guided memory form
- ✅ CSS styling (public/style.css) - Japanese-inspired responsive design with square image containers
- ✅ JavaScript interactivity (script.js) - Form handling with Magic Link redirect
- ✅ AI preprocessing pipeline - Gemini API transforms basic inputs into sophisticated artistic prompts
- ✅ High-resolution image generation - Wavespeed AI producing 4096x4096 shin-hanga artwork
- ✅ Magic Link gallery system - Permanent URLs for sharing and revisiting galleries
- ✅ Tiered storage - Print-quality originals + watermarked web versions via Vercel Blob
- ✅ Webhook pipeline with blob metadata - Real-time gallery updates with progress tracking
- ✅ 30-day expiration system - Automated cleanup with purchase protection
- ✅ Digital collection system - Gallery aggregation and cumulative viewing with localStorage tracking
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
CLEANUP_SECRET='your-cleanup-secret-key'
CRON_SECRET='your-cron-secret-key'
```

## Architecture

This is a Magic Link gallery system with serverless backend:

- `public/index.html` - Main HTML structure with 5-question memory form across 3 "acts"
- `public/script.js` - Client-side JavaScript for form submission and Magic Link redirect
- `public/style.css` - Complete styling using CSS custom properties and responsive design
- `public/gallery/index.html` - Dynamic gallery display page with print ordering
- `/api/generate.js` - Gallery creation with webhook-based image generation
- `/api/webhook-simple.js` - Webhook handler for image generation and metadata updates
- `/api/gallery.js` - Gallery data retrieval with expiration checking
- `/api/cleanup-expired.js` - Automated cleanup of expired galleries
- `/api/cron-cleanup.js` - Daily cron job for maintenance
- `/api/collection.js` - Multi-gallery aggregation for cumulative collections

## Key Technical Details

### Form Structure
The memory questionnaire follows a storytelling approach:
- **Act I (The Scene)**: Location input + atmosphere selection (5 radio buttons)
- **Act II (The Subject)**: Main focus text input
- **Act III (The Magic)**: Unique detail textarea + feeling tags (6 multi-select buttons)

### Magic Link Gallery Flow
1. User submits memory form
2. AI enhances prompts via Gemini API
3. Webhook triggers parallel image generation via Wavespeed AI
4. Each completed image updates gallery metadata in real-time
5. Gallery shows live progress as images complete
6. Gallery metadata persisted to Vercel Blob storage
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
  - **Image Generation**: Wavespeed AI (Imagen 4.0 Ultra) creates 4096x4096 artwork
- **Art Style**: Modern shin-hanga woodblock print aesthetic
- **Storage**: Vercel Blob with tiered print/web versions
- **Digital Collections**: localStorage-based gallery tracking and aggregation

## Recent Major Improvements
- ✅ **Magic Link Architecture**: Complete redesign from async polling to synchronous galleries
- ✅ **Vercel Blob Integration**: Persistent storage for print and web versions
- ✅ **Watermark System**: Automated watermarking for web versions using Sharp
- ✅ **Webhook Metadata Pipeline**: Real-time gallery updates with blob storage persistence
- ✅ **30-Day Expiration**: Galleries expire unless purchased, with automated cleanup
- ✅ **Digital Collection System**: Multi-gallery aggregation with localStorage tracking and cumulative viewing
- ✅ **Gallery Display System**: Beautiful responsive gallery pages with memory context
- ✅ **Automated Maintenance**: Daily cron jobs for expired gallery cleanup
- ✅ **Dynamic Routing**: Vercel rewrites for `/gallery/{id}` URLs

## System Architecture

### Magic Link Gallery Pipeline
1. **User Input**: 5-question memory form captures location, focus, details, atmosphere, feelings
2. **AI Enhancement**: Gemini 1.5 Flash transforms basic inputs using expert art director instructions
3. **Webhook Generation**: Parallel webhook calls trigger 4 image generations in 4K resolution
4. **Real-time Updates**: Each completed image immediately updates gallery metadata
5. **Blob Storage**: Vercel Blob stores metadata with progress tracking and image URLs
6. **Progress Tracking**: Gallery shows live status from 'generating' to 'complete'
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
- **Wavespeed AI**: ~$0.058 per 4K image generation (4 images)
- **Vercel Blob**: Storage costs for images and metadata
- **Total**: Extremely cost-effective for professional-quality results

## Expiration & Cleanup System

### 30-Day Gallery Lifecycle
- Galleries created with 30-day expiration timestamp
- Web versions watermarked, print versions preserved
- Purchase protection prevents deletion of paid galleries
- Daily cron job (`0 2 * * *`) cleans expired galleries
- Manual cleanup API available with secret key authentication

### Digital Collection System

The system includes a cumulative gallery collection feature:

**Collection Features:**
- localStorage-based gallery tracking across sessions
- Multi-gallery aggregation via `/collection` endpoint
- Responsive grid display of all user artwork
- Digital download functionality for high-quality images

**API Endpoints:**
- `POST /api/collection` - Aggregates multiple galleries into collections
- Gallery pages include "View My Collection" navigation
- Collection page at `/collection` with responsive design

**Integration Status:**
- ✅ localStorage gallery tracking system
- ✅ Collection API for multi-gallery aggregation
- ✅ Responsive collection page with grid layout
- ✅ Digital download placeholder functionality
- ⚠️ Needs Stripe integration for digital checkout

## Environment Variables Required

### Core System
- `GEMINI_API_KEY` - Google Gemini API for prompt enhancement
- `WAVESPEED_API_KEY` - Wavespeed AI for image generation
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage access


### Maintenance
- `CLEANUP_SECRET` - Secret key for manual cleanup API
- `CRON_SECRET` - Vercel cron job authentication

## Future Enhancements
1. **Digital Checkout Flow**: Stripe integration for digital download purchases
2. **Download Management**: Track digital purchases in gallery metadata
3. **Enhanced Digital Products**: Multiple format options (PNG, JPG, PDF)
4. **Analytics**: Gallery view tracking and usage metrics
5. **Social Features**: Gallery sharing and discovery
6. **Collection Management**: Advanced filtering and organization tools

## Production Resource Constraint Solutions (TODO - Deferred)

### Rate Limiting & Queue Management
- **Implement user-based rate limiting**: Prevent individual users from overwhelming Wavespeed quota
- **Gallery-based cooldown**: 5-10 minute cooldown between gallery creations per IP/session
- **Queue system**: Handle concurrent requests by queuing rather than rejecting
- **Smart retry logic**: Exponential backoff for failed Wavespeed API calls

### Quota Management
- **Daily quota monitoring**: Track Wavespeed API usage against daily limits
- **Graceful degradation**: Reduce from 4 images to 2-3 when approaching quota limits
- **Quota alerts**: Email notifications when reaching 80% of daily quota
- **Peak hour management**: Adjust max concurrent generations during high traffic

### Download Timeout Handling
- **Extended Vercel timeouts**: Utilize Vercel Pro's longer function execution limits
- **Progressive image delivery**: Return gallery immediately with images loading progressively
- **CDN optimization**: Leverage Wavespeed's CDN for faster image delivery
- **Fallback mechanisms**: Retry failed downloads with exponential backoff

### Monitoring & Alerting
- **Health check endpoints**: Monitor Wavespeed API availability
- **Error rate tracking**: Alert when generation failure rate exceeds threshold
- **Performance metrics**: Track average generation times and identify slowdowns
- **User experience monitoring**: Track gallery completion rates and user satisfaction

## Magic Link Benefits
- **Permanent URLs**: Galleries never lose their links
- **Mobile Optimized**: Responsive design for all devices
- **Print Ready**: Immediate access to high-quality print versions
- **Memory Context**: Display original memory inputs alongside artwork
- **Expiration Protection**: 30-day purchase window with automated cleanup
- **Cost Effective**: No ongoing storage costs for expired galleries