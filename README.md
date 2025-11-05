# Invoice Processing & Financial Tracking App

A serverless invoice processing and financial tracking application built on Cloudflare's platform with WhatsApp integration via Kapso.ai.

## Overview

This application automates invoice ingestion from WhatsApp, extracts structured data using OCR, and provides a comprehensive financial dashboard for tracking expenses, managing credit cards, and optimizing payment schedules.

## Architecture

- **Compute**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Queue**: Cloudflare Queues (OCR processing)
- **Scheduling**: Cloudflare Cron Triggers
- **Frontend**: Cloudflare Pages
- **Styling**: Tailwind CSS
- **WhatsApp**: Kapso.ai integration

## Features

- 📸 **WhatsApp Invoice Ingestion**: Send invoice photos/PDFs via WhatsApp
- 🤖 **Automated OCR**: Extract data from invoices automatically
- 📊 **Financial Dashboard**: View KPIs, trends, and spending analytics
- 💳 **Credit Card Tracking**: Manage closure dates and optimize card usage
- 🔔 **Smart Alerts**: Payment reminders and card recommendations
- 🎨 **Customizable Themes**: Easily change colors via configuration

## Project Structure

```
finan-track/
├── IMPLEMENTATION_PLAN.md    # Detailed implementation roadmap
├── theme.config.json          # Theme customization config
├── theme.schema.json          # JSON schema for theme validation
├── workers/                   # Cloudflare Workers
│   ├── webhook/              # Kapso webhook handler
│   ├── api/                  # API endpoints
│   ├── ocr-processor/        # Queue consumer for OCR
│   └── cron/                 # Scheduled jobs
├── frontend/                  # Cloudflare Pages app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── styles/
│   └── public/
├── shared/                    # Shared types and utilities
│   ├── types/
│   ├── validators/
│   └── utils/
└── migrations/                # D1 database migrations
```

## Theme Customization

The application uses a configurable theme system powered by Tailwind CSS. All colors can be customized by editing `theme.config.json`.

### Changing Colors

1. Open `theme.config.json`
2. Modify the color scales for your desired palette:

```json
{
  "colors": {
    "primary": {
      "500": "#3b82f6",  // Main brand color
      "600": "#2563eb",  // Darker variant
      ...
    }
  }
}
```

### Color Scales

Each color family (primary, secondary, accent, etc.) follows Tailwind's scale convention:
- **50-100**: Very light shades (backgrounds, subtle highlights)
- **200-400**: Light-medium shades (borders, muted states)
- **500-600**: Base colors (primary actions, headings)
- **700-800**: Dark shades (hover states, emphasis)
- **900-950**: Very dark shades (text, strong contrast)

### Available Color Families

- `primary`: Main brand color (buttons, links, highlights)
- `secondary`: Secondary UI elements (secondary buttons, badges)
- `accent`: Accent elements (special highlights, CTAs)
- `success`: Success states (confirmations, positive feedback)
- `warning`: Warning states (alerts, cautions)
- `error`: Error states (errors, validation messages)
- `neutral`: Text and neutral UI elements

### Applying Theme Changes

The theme is loaded at build time and generates CSS custom properties. After modifying `theme.config.json`:

1. Rebuild the frontend: `npm run build` (or equivalent)
2. The new colors will be applied throughout the application

## Implementation Plan

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the complete breakdown of implementation tasks organized into phases:

1. **Phase 1**: Project Foundation & Configuration
2. **Phase 2**: Database Schema & Data Models
3. **Phase 3**: R2 Media Storage
4. **Phase 4**: WhatsApp Integration (Kapso)
5. **Phase 5**: OCR & Invoice Processing
6. **Phase 6**: API Layer
7. **Phase 7**: Dashboard Frontend
8. **Phase 8**: Credit Card Tracking Logic
9. **Phase 9**: Alerts & Notifications
10. **Phase 10**: Testing & Quality Assurance
11. **Phase 11**: Documentation & Deployment

Each phase contains individual checkpoints that serve as verifiable milestones.

## Development Workflow

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Cloudflare account
- Wrangler CLI installed globally
- Kapso.ai account (for WhatsApp integration)

### Setup (Coming Soon)

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start local development
npm run dev
```

### Environment Variables

Create a `.dev.vars` file for local development:

```
# Kapso
KAPSO_API_KEY=your_kapso_api_key
KAPSO_WEBHOOK_SECRET=your_webhook_secret

# OCR Service (if external)
OCR_API_KEY=your_ocr_api_key

# Optional
DEBUG=true
```

## License

[Choose appropriate license]

## Contributors

[Your name/team]

---

**Note**: This project is currently in development. Infrastructure setup (D1 databases, R2 buckets, Workers, etc.) is handled separately. This repository contains only the application code.
