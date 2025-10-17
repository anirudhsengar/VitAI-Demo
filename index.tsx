import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

// --- DATA & INTERFACES ---

const REPOSITORIES = [
  { owner: 'adoptium', repo: 'aqa-tests', description: 'The central project for AQAvit (Adoptium Quality Assurance).' },
  { owner: 'adoptium', repo: 'TKG', description: 'A lightweight test harness for running a diverse set of tests or commands.' },
  { owner: 'adoptium', repo: 'aqa-systemtest', description: 'System verification tests.' },
  { owner: 'adoptium', repo: 'aqa-test-tools', description: 'Various test tools that improve workflow.' },
  { owner: 'adoptium', repo: 'STF', description: 'System Test Framework for running system tests.' },
  { owner: 'adoptium', repo: 'bumblebench', description: 'A microbenchmarking test framework.' },
  { owner: 'adoptium', repo: 'run-aqa', description: 'A GitHub action for running AQA tests.' },
  { owner: 'adoptium', repo: 'openj9-systemtest', description: 'System verification tests for OpenJ9.' },
  { owner: 'eclipse-openj9', repo: 'openj9', description: 'The Eclipse OpenJ9 JVM project.' }
];

interface ThinkingStep {
  thought: string;
  action: { tool: string; args: any };
  observation: string;
}
interface AgentTurnType {
  type: 'agent';
  thinkingSteps: ThinkingStep[];
  finalAnswer: string | null;
  status: 'thinking' | 'done' | 'error';
  error?: string;
  id: number;
}
interface UserTurnType {
  type: 'user';
  content: string;
  id: number;
}
type Turn = UserTurnType | AgentTurnType;


// --- UI COMPONENTS ---

const SimpleMarkdown = ({ text }: { text: string }) => {
  if (!text) return null;

  const toHtml = (markdown: string) => {
    let html = markdown
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Escape HTML
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/`([^`\n]+)`/g, '<code>$1</code>') // Inline code
      .replace(/```([\s\S]*?)```/g, (_match, code) => `<pre><code>${code.trim()}</code></pre>`); // Code blocks

    // Process lists
    const lines = html.split('\n');
    let inList = null; // null | 'ol' | 'ul'
    let listHtml = '';
    
    lines.forEach((line, index) => {
      const olMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
      const ulMatch = line.match(/^\s*[\-\*]\s+(.*)/);

      let currentListType = olMatch ? 'ol' : (ulMatch ? 'ul' : null);

      if (inList && currentListType !== inList) {
        listHtml += `</${inList}>`;
        inList = null;
      }

      if (currentListType && !inList) {
        inList = currentListType;
        listHtml += `<${inList}>`;
      }
      
      if (olMatch) {
        listHtml += `<li>${olMatch[2]}</li>`;
      } else if (ulMatch) {
        listHtml += `<li>${ulMatch[1]}</li>`;
      } else if (!line.startsWith('<pre>')) {
        listHtml += line ? `<p>${line}</p>` : '';
      } else {
        listHtml += line;
      }

      if (inList && index === lines.length - 1) {
        listHtml += `</${inList}>`;
      }
    });
    
    return listHtml.replace(/<p><\/p>/g, '');
  };

  return <div className="final-answer" dangerouslySetInnerHTML={{ __html: toHtml(text) }} />;
};

const AgentTurn = ({ turn, isActivelyThinking, currentActionText }: { turn: AgentTurnType, isActivelyThinking: boolean, currentActionText: string }) => {
  const [isThinkingVisible, setIsThinkingVisible] = useState(false);

  const hasThinkingProcess = turn.thinkingSteps.length > 0 || turn.status === 'thinking';

  return (
    <div className="agent-turn">
      <div className="agent-avatar">🤖</div>
      <div className="turn-content">
        {hasThinkingProcess && (
          <div className="show-thinking-bar" data-expanded={isThinkingVisible} onClick={() => setIsThinkingVisible(!isThinkingVisible)}>
            {isActivelyThinking ? <LoadingSpinner /> : <BuildIcon />}
            <span>{isActivelyThinking ? currentActionText || 'Thinking...' : 'Thinking Process'}</span>
            <svg className="dropdown-arrow" focusable="false" width="24" height="24" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"></path></svg>
          </div>
        )}

        {isThinkingVisible && hasThinkingProcess && (
          <div className="workpad-item">
            <div className="workpad-details">
              {turn.thinkingSteps.map((step, i) => (
                <div key={i}>
                  <p><strong>Thought:</strong> {step.thought}</p>
                  <div>
                    <strong>Action:</strong> {step.action.tool}
                    <pre>{`${JSON.stringify(step.action.args, null, 2)}`}</pre>
                  </div>
                  <div>
                    <strong>Observation:</strong>
                    <pre>{step.observation}</pre>
                  </div>
                </div>
              ))}
              {isActivelyThinking && (
                <div className="thinking-in-progress">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>
        )}

        {turn.finalAnswer && <SimpleMarkdown text={turn.finalAnswer} />}
        {turn.status === 'error' && <p className="error">Error: {turn.error}</p>}
      </div>
    </div>
  );
};


// --- ICONS ---

const SendIcon = () => ( <svg focusable="false" width="24" height="24" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg> );
const LoadingSpinner = () => ( <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> );
const BuildIcon = () => ( <svg focusable="false" width="20" height="20" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"></path></svg> );
const WelcomeScreen = () => ( <div className="welcome-container"><h1 className="welcome-logo">VitAI</h1><h2 className="welcome-title">How can I help you today?</h2></div> );

// --- MAIN APP COMPONENT ---

const App = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentActionText, setCurrentActionText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const prevHeight = textarea.style.height;
      textarea.style.height = 'auto';
      const newHeight = `${textarea.scrollHeight}px`;
      // Prevent shrinking when empty, which causes placeholder to jump
      if (parseInt(newHeight) > parseInt(prevHeight)) {
        textarea.style.height = newHeight;
      } else if (!question) { // Reset on clear
        textarea.style.height = 'auto';
      } else {
        textarea.style.height = prevHeight;
      }
    }
  }, [question]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const updateLastAgentTurn = (updater: (turn: AgentTurnType) => void) => {
    setTurns(prev => {
      const newTurns = [...prev];
      const lastTurn = newTurns[newTurns.length - 1];
      if (lastTurn?.type === 'agent') {
        updater(lastTurn as AgentTurnType);
      }
      return newTurns;
    });
  };

  // --- API & TOOLS ---

  // Fix: Implemented tool functions directly in the component scope.
  const search_code = async ({ repository, query }: { repository: string, query: string }) => {
    if (!GITHUB_TOKEN) return `Observation: Your GITHUB_TOKEN is not configured. Please set it as an environment variable to use the GitHub search functionality.`;
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) return `Observation: Invalid repository format. Please use "owner/repo".`;
    try {
      const response = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:${owner}/${repo}`, {
        headers: { 'Accept': 'application/vnd.github.v3.text-match+json', 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (!response.ok) throw new Error(`API error: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      const results = data.items.slice(0, 5).map(item => ({ path: item.path, score: item.score, snippets: item.text_matches?.map(tm => tm.fragment).join('\n...\n') || 'No snippets available.' }));
      if (results.length === 0) return `Observation: No results found for query "${query}" in repository ${repository}. Try a broader query or a different repository.`;
      return `Observation: Found ${results.length} files. The most relevant files and code snippets are:\n${JSON.stringify(results, null, 2)}`;
    } catch (error) {
      return `Observation: Error searching GitHub for query "${query}" in ${repository}. Reason: ${(error as Error).message}`;
    }
  };

  const read_file = async ({ repository, path }: { repository: string, path: string }) => {
    if (!GITHUB_TOKEN) return `Observation: Your GITHUB_TOKEN is not configured. Please set it as an environment variable to use the GitHub search functionality.`;
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) return `Observation: Invalid repository format. Please use "owner/repo".`;
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 'Accept': 'application/vnd.github.v3.raw', 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (!response.ok) throw new Error(`API error: ${response.status} - ${await response.text()}`);
      const content = await response.text();
      return `Observation: Content of file "${path}" from repository ${repository}:\n\n\`\`\`\n${content.slice(0, 4000)}\n\`\`\``;
    } catch (error) {
      return `Observation: Error reading file "${path}" from repository ${repository}. Reason: ${(error as Error).message}`;
    }
  };
  
  const list_directory_contents = async ({ repository, path }: { repository: string, path: string }) => {
    if (!GITHUB_TOKEN) return `Observation: Your GITHUB_TOKEN is not configured. Please set it as an environment variable to use this functionality.`;
    const [owner, repo] = repository.split('/');
    if (!owner || !repo) return `Observation: Invalid repository format. Please use "owner/repo".`;
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      });
      if (!response.ok) throw new Error(`API error: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      if (!Array.isArray(data)) return `Observation: The path "${path}" in repository ${repository} is a file, not a directory. Use read_file to see its content.`;
      const contents = data.map(item => `[${item.type === 'dir' ? 'd' : 'f'}] ${item.name}`).join('\n');
      return `Observation: Contents of "${path}" in repository ${repository}:\n${contents}`;
    } catch (error) {
      return `Observation: Error listing directory "${path}" from repository ${repository}. Reason: ${(error as Error).message}`;
    }
  };

  // Fix: Defined tools directly in the component scope.
  const tools: FunctionDeclaration[] = [
      { name: 'search_code', description: 'Searches for code within a specific GitHub repository.', parameters: { type: Type.OBJECT, properties: { repository: { type: Type.STRING, description: 'The repository to search, formatted as "owner/repo".' }, query: { type: Type.STRING, description: 'The search query.' } }, required: ['repository', 'query'] } },
      { name: 'read_file', description: 'Reads the content of a specific file from a GitHub repository.', parameters: { type: Type.OBJECT, properties: { repository: { type: Type.STRING, description: 'The repository the file belongs to, formatted as "owner/repo".' }, path: { type: Type.STRING, description: 'The full path to the file within the repository.' } }, required: ['repository', 'path'] } },
      { name: 'list_directory_contents', description: 'Lists the contents (files and directories) of a specific directory within a GitHub repository.', parameters: { type: Type.OBJECT, properties: { repository: { type: Type.STRING, description: 'The repository to inspect, formatted as "owner/repo".' }, path: { type: Type.STRING, description: 'The path to the directory to list. Use "." or "/" for the root directory.' } }, required: ['repository', 'path'] } },
      { name: 'finish_answer', description: 'Call this function when you have enough information to answer the user\'s question.', parameters: { type: Type.OBJECT, properties: { answer: { type: Type.STRING, description: 'The final, comprehensive answer to the user\'s question in Markdown format.' } }, required: ['answer'] } }
  ];

  // Fix: Replaced incomplete handleSubmit with the full, correct agent logic.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || isLoading) return;

    setIsLoading(true);
    setQuestion('');
    setCurrentActionText('Thinking...');

    const userTurn: UserTurnType = { type: 'user', content: currentQuestion, id: Date.now() };
    const agentTurn: AgentTurnType = { type: 'agent', thinkingSteps: [], finalAnswer: null, status: 'thinking', id: Date.now() + 1 };
    setTurns([userTurn, agentTurn]);

    const maxIterations = 100;
    let iteration = 0;
    let history: string[] = [];
    const repoListForPrompt = REPOSITORIES.map(r => `- ${r.owner}/${r.repo}: ${r.description}`).join('\n');

    while (iteration < maxIterations) {
      iteration++;
      const context = history.join('\n\n');
      const prompt = `You are VitAI, an expert AI developer assistant. Your goal is to answer the user's question by navigating and understanding code in a specific set of GitHub repositories.

**Core Mission:** Autonomously use the tools at your disposal to gather information and formulate a complete, accurate answer to the user's question.

**Operational Cycle (ReAct Pattern):**
You operate in a loop of Thought, Action, and Observation.
1.  **Thought:** Analyze the user's question and the conversation history. Formulate a plan. This might involve exploring the file system with \`list_directory_contents\`, searching with \`search_code\`, or reading a specific file with \`read_file\`. Your thought process should be clear and justify your next action.
2.  **Action:** Based on your thought, you **MUST** call exactly one of the available tools.
3.  **Observation:** After you take an action, the system will provide an observation, which is the result of that action. Use this new information to inform your next Thought.

**Critical Rules for Tool Calling:**
- You **MUST** always provide a "Thought" before calling a tool.
- You **MUST** call exactly one tool per turn.
- To explore the repository, use \`list_directory_contents\` to avoid guessing file paths.
- To complete your mission and provide the final answer to the user, you **MUST** call the 'finish_answer' tool. This is the only way to end the process.
- If you are not sure about file content or codebase structure, use your tools to read files and gather the relevant information: do NOT guess or make up an answer.

**Available Repositories:**
This is the exclusive list of repositories you can interact with.
${repoListForPrompt}

---

# Tool Reference

## functions.search_code
- **Description:** Performs a lexical (keyword-based) search for code within a single specified repository.
- **When to Use:**
    - To get a broad overview of where a term or feature is mentioned.
    - To find file paths that seem relevant to the user's query when you don't know where to start exploring.
- **Parameters:**
    - \`repository\`: string - The repository to search, formatted as "owner/repo". MUST be one of the available repositories.
    - \`query\`: string - The keywords to search for. Be specific for better results.
- **Example:**
    - **Thought:** The user is asking about system tests. I should start by searching for "system test" in the 'adoptium/aqa-systemtest' repository to find relevant entry points.
    - **Action:** \`search_code({ repository: 'adoptium/aqa-systemtest', query: 'system test execution' })\`

## functions.read_file
- **Description:** Reads the content of a single, specific file from a repository.
- **When to Use:**
    - After using \`search_code\` or \`list_directory_contents\` and identifying a promising file path.
    - To understand the implementation details within a specific file.
- **Parameters:**
    - \`repository\`: string - The repository the file belongs to, formatted as "owner/repo".
    - \`path\`: string - The full path to the file within the repository (e.g., 'STF/scripts/runSystemTests.sh').
- **Example:**
    - **Thought:** The search results showed that 'STF/scripts/runSystemTests.sh' is highly relevant. I need to read this file to understand how the tests are actually run.
    - **Action:** \`read_file({ repository: 'adoptium/aqa-systemtest', path: 'STF/scripts/runSystemTests.sh' })\`

## functions.list_directory_contents
- **Description:** Lists the contents (files and directories) of a single directory from a repository.
- **When to Use:**
    - To explore the file structure of a repository when you are unsure where to look.
    - To find the names of files in a directory before attempting to read one. This helps avoid errors from trying to read a file that does not exist.
    - **ALWAYS** prefer using this to explore before using \`read_file\` on a path you haven't seen before.
- **Parameters:**
    - \`repository\`: string - The repository the directory belongs to, formatted as "owner/repo".
    - \`path\`: string - The path to the directory to list (e.g., 'STF/scripts' or '.').
- **Example:**
    - **Thought:** I need to find the main test execution script, but I'm not sure where it is. I'll start by listing the contents of the 'STF' directory which seems like a good place to start.
    - **Action:** \`list_directory_contents({ repository: 'adoptium/aqa-systemtest', path: 'STF' })\`

## functions.finish_answer
- **Description:** Concludes the mission and provides the final, comprehensive answer to the user.
- **When to Use:**
    - When you are confident you have gathered all necessary information from searching and reading files.
    - This is the **FINAL** step. Do not use any other tools after this.
- **Parameters:**
    - \`answer\`: string - The final answer in well-formatted Markdown. The answer should be detailed, accurate, and directly address the user's original question.
- **Example:**
    - **Thought:** I have read the main script for running tests and examined the configuration files. I now have a complete understanding of the process. I can formulate the final answer.
    - **Action:** \`finish_answer({ answer: 'To run system tests in aqa-systemtest, you need to execute the \`runSystemTests.sh\` script located in the \`STF/scripts\` directory. Here are the steps:\\n\\n1. **Prerequisite**: ...\\n2. **Execution**: ...\\n\\nHere is a relevant code snippet from the script:\\n\\n\`\`\`bash\\n# ... code snippet ...\\n\`\`\`' })\`

---

**User Question:** "${currentQuestion}"

**History:**
${context}

Based on the user question and the history, what is your next Thought and Action?`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: { tools: [{ functionDeclarations: tools }] },
        });

        const functionCall = response.functionCalls?.[0];
        const thought = response.text || '(No thought generated)';
        
        if (!functionCall) {
            throw new Error(`The agent got stuck. Last thought: ${thought}`);
        }

        history.push(`Thought: ${thought}`);

        if (functionCall.name === 'finish_answer') {
          updateLastAgentTurn(turn => {
            turn.finalAnswer = functionCall.args.answer as string;
            turn.status = 'done';
          });
          break;
        }
        
        const action = { tool: functionCall.name, args: functionCall.args };
        history.push(`Action: Calling tool ${action.tool} with arguments ${JSON.stringify(action.args)}`);

        let observation = '';
        if (action.tool === 'search_code') {
            setCurrentActionText(`Searching code for "${action.args.query}"...`);
            observation = await search_code(action.args as any);
        } else if (action.tool === 'read_file') {
            setCurrentActionText(`Reading file: ${action.args.path}...`);
            observation = await read_file(action.args as any);
        } else if (action.tool === 'list_directory_contents') {
            setCurrentActionText(`Listing contents of: ${action.args.path}...`);
            observation = await list_directory_contents(action.args as any);
        } else {
            observation = `Observation: Unknown tool "${action.tool}" was called.`;
        }
        
        history.push(observation);
        
        const newStep: ThinkingStep = { thought, action, observation };
        updateLastAgentTurn(turn => {
            turn.thinkingSteps.push(newStep);
        });

      } catch (error) {
        const errorMessage = (error as Error).message;
        updateLastAgentTurn(turn => {
            turn.status = 'error';
            turn.error = errorMessage;
        });
        console.error(error);
        break;
      }
      
      if (iteration === maxIterations) {
        updateLastAgentTurn(turn => {
            turn.status = 'error';
            turn.error = 'The agent reached the maximum number of iterations without finding an answer.';
        });
      }
    }
    setIsLoading(false);
    setCurrentActionText('');
  };
  
  return (
    <div className="app-container">
      <main className="main-content">
        <div className="main-content-inner">
          {turns.length === 0 && !isLoading ? (
            <WelcomeScreen />
          ) : (
            <div className="turn-container">
              {turns.map((turn, index) => {
                if (turn.type === 'user') {
                  return (
                    <div key={turn.id} className="user-turn-wrapper">
                      <div className="user-turn"><p>{turn.content}</p></div>
                    </div>
                  );
                }
                const isActivelyThinking = isLoading && index === turns.length - 1;
                return <AgentTurn key={turn.id} turn={turn} isActivelyThinking={isActivelyThinking} currentActionText={currentActionText} />;
              })}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </main>
      <footer className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <textarea id="question" ref={textareaRef} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask VitAI" disabled={isLoading} required aria-label="Your Question"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLFormElement).form.requestSubmit();
              }
            }}
          />
          <button type="submit" disabled={isLoading || !question.trim()} className="submit-button" aria-label="Send message">
            {isLoading ? <LoadingSpinner /> : <SendIcon />}
          </button>
        </form>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);