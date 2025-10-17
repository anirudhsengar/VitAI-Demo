<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VitAI - AI-Powered GitHub Repository Assistant

An intelligent agent that leverages the Google Gemini AI API to answer questions about GitHub repositories. VitAI features a modern, responsive UI inspired by Google's Gemini interface and provides seamless interaction with your codebase.

## Features

- **AI-Powered Analysis**: Uses Google's Generative AI (Gemini) to intelligently analyze and answer questions about repositories
- **GitHub Integration**: Seamlessly integrates with GitHub API for repository data retrieval
- **Real-time Reasoning**: Displays the AI's thinking process with step-by-step reasoning chains
- **Modern UI**: Clean, responsive interface inspired by Gemini Chat
- **Markdown Support**: Rich text formatting with markdown and code syntax highlighting
- **Multiple Repository Support**: Query various Adoptium and Eclipse OpenJ9 repositories

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **AI/ML**: Google GenAI SDK (Gemini API)
- **Styling**: CSS with modern layout techniques
- **Runtime**: Node.js with ES modules

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VitAI-Demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   GITHUB_TOKEN=your_github_pat_here
   ```

### Run Locally

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
VitAI-Demo/
├── index.tsx          # Main React application component
├── index.html         # HTML entry point
├── index.css          # Global styles
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project dependencies
└── README.md          # This file
```

## Supported Repositories

VitAI can analyze questions about the following repositories:

- **adoptium/aqa-tests** - The central project for AQAvit (Adoptium Quality Assurance)
- **adoptium/TKG** - A lightweight test harness for running tests
- **adoptium/aqa-systemtest** - System verification tests
- **adoptium/aqa-test-tools** - Various test tools and utilities
- **adoptium/STF** - System Test Framework
- **adoptium/bumblebench** - Microbenchmarking test framework
- **adoptium/run-aqa** - GitHub action for running AQA tests
- **adoptium/openj9-systemtest** - OpenJ9 system verification tests
- **eclipse-openj9/openj9** - Eclipse OpenJ9 JVM project

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required for AI functionality)
- `GITHUB_TOKEN` - Your GitHub Personal Access Token (higher API rate limits)
