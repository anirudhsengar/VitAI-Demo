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

## Agent Architecture

The diagram below illustrates the flow of context in VitAI:

<p align="center">
   <img src="VitAI_ReAct_architecture.png" alt="VitAI ReAct Architecture" style="max-width:100%;height:auto;">
</p>


### How it works:

1.  **User Interaction**: The user asks a question about a GitHub repository through the React-based user interface.
2.  **Backend Processing**: The Node.js backend receives the request.
3.  **Data Retrieval (GitHub API)**: If the question requires specific information from the repository (e.g., file contents or directory structure), the backend calls the **GitHub API**.
4.  **AI-Powered Analysis (Gemini API)**: The backend sends the user's query—along with any data retrieved from GitHub—to the **Google Gemini API**. Gemini analyzes the information and generates a comprehensive answer.
5.  **Streaming Response**: The response from Gemini is streamed back to the UI, often including a step-by-step reasoning process.

### API Usage Examples:

#### When is the GitHub API called?

The GitHub API is used to fetch raw data and metadata directly from the repository. For example:

-   **"What are the main folders in this project?"**: The backend lists the contents of the root directory.
-   **"What dependencies does this project use?"**: The backend fetches the contents of `package.json` (or a similar file).

#### When is the Gemini API used?

The Gemini API is used for analysis, summarization, and generating human-like explanations. For example:

-   **"What is the purpose of this repository?"**: The backend fetches the `README.md` file via the GitHub API and asks Gemini to provide a summary.
-   **"How do I get started with this project?"**: The backend retrieves the `README.md` and other setup files, then asks Gemini to create a step-by-step guide.
-   **"Explain the `vite.config.ts` file"**: The backend fetches the file's content and asks Gemini to explain what the configuration does.

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
