# Axon

Upload UI design screenshots → Extract design tokens → Generate AI prompts for code generation.

## Features

- 🎨 **Design Token Extraction** - Colors, typography, spacing, animations, shadows, border radius
- 📝 **AI Prompt Generation** - Detailed prompts for recreating designs with React + Tailwind
- 📋 **Copy to Clipboard** - One-click copy of generated prompts
- ⬇️ **JSON Export** - Download tokens and prompts as JSON
- 🖼️ **Drag & Drop Upload** - Easy image upload with preview
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Perplexity Sonar API (Vision)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ravixalgorithm/axon.git
cd axon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and add your Perplexity API key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key:

```
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
```

Get your API key from: https://www.perplexity.ai/settings/api

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload** - Drag and drop or click to upload a UI screenshot (PNG, JPG, WEBP, GIF up to 50MB)
2. **Analyze** - Click "Analyze Design" to extract tokens
3. **View Results** - See extracted colors, typography, spacing, and more
4. **Copy/Download** - Copy the prompt or download everything as JSON

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable: `PERPLEXITY_API_KEY`
5. Deploy

## License

MIT