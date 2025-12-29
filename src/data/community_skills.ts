
export interface CommunityItem {
    id: string;
    name: string;
    description: string;
    author: string;
    type: 'plugin' | 'skill';
    installCommand?: string; // For Copy (MCP args)
    setupCommand?: string;   // For Prerequisites (e.g. npm install -g lsp)
    args?: string[];
    env_vars?: string[];
    installConfig?: {       // For One-Click MCP Add
        command: string;
        args: string[];
        env?: Record<string, string>;
    };
}

export const OFFICIAL_PLUGINS: CommunityItem[] = [
    {
        id: 'typescript',
        name: 'TypeScript',
        description: 'Advanced TypeScript support via vtsls. Requires Node.js.',
        author: 'Anthropic',
        type: 'plugin',
        setupCommand: 'npm install -g @vtsls/language-server typescript'
    },
    {
        id: 'python',
        name: 'Python',
        description: 'Python language server via Pyright. Requires Node.js or Pip.',
        author: 'Anthropic',
        type: 'plugin',
        setupCommand: 'npm install -g pyright'
    },
    {
        id: 'rust',
        name: 'Rust',
        description: 'Rust language support. Requires rustup.',
        author: 'Anthropic',
        type: 'plugin',
        setupCommand: 'rustup component add rust-analyzer'
    },
    {
        id: 'go',
        name: 'Go',
        description: 'Go language support. Requires Go.',
        author: 'Anthropic',
        type: 'plugin',
        setupCommand: 'go install golang.org/x/tools/gopls@latest'
    }
];

export const COMMUNITY_SKILLS: CommunityItem[] = [
    {
        id: 'filesystem',
        name: 'Filesystem',
        description: 'Read and write files on your local machine.',
        author: 'ModelContextProtocol',
        type: 'skill',
        installCommand: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
        installConfig: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '.']
        }
    },
    {
        id: 'git',
        name: 'Git',
        description: 'Git repository management.',
        author: 'ModelContextProtocol',
        type: 'skill',
        installCommand: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git', '.'],
        installConfig: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-git', '.']
        }
    },
    {
        id: 'github',
        name: 'GitHub',
        description: 'Interact with GitHub API (Issues, PRs).',
        author: 'ModelContextProtocol',
        type: 'skill',
        installCommand: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env_vars: ['GITHUB_PERSONAL_ACCESS_TOKEN']
    },
    {
        id: 'memory',
        name: 'Memory',
        description: 'Persistent memory for Claude.',
        author: 'ModelContextProtocol',
        type: 'skill',
        installCommand: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        installConfig: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-memory']
        }
    },
    {
        id: 'sqlite',
        name: 'SQLite',
        description: 'SQLite database interaction.',
        author: 'ModelContextProtocol',
        type: 'skill',
        installCommand: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', 'test.db']
    }
];
