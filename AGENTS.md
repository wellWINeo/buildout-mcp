# Buildout MCP - AI Agent Documentation

## Project Overview

Buildout MCP is a Model Context Protocol (MCP) server that provides AI agents with access to Buildin.ai - a Notion-like knowledge base platform. The server exposes search capabilities and page content retrieval through standardized MCP interfaces.

**Key Technologies:**
- TypeScript with ES modules
- Node.js 24.x
- MCP SDK (`@modelcontextprotocol/sdk`)
- Buildin API SDK (`buildin-api-sdk`)
- Zod for schema validation

## Project Structure

```
buildout-mcp/
├── src/
│   ├── app.ts                      # Main entry point, MCP server setup
│   ├── common/                     # Shared utilities and types
│   │   ├── types.ts                # Core type definitions
│   │   ├── blockFetcher.ts         # API data retrieval logic
│   │   ├── markdownRenderer.ts     # Block-to-markdown conversion
│   │   └── searchFormatter.ts      # Search result formatting
│   ├── tools/                      # MCP tool implementations
│   │   ├── getPageContent.ts       # Page content retrieval
│   │   └── search.ts               # Search functionality
│   └── prompts/                    # MCP prompt templates
│       └── instructions.ts         # LLM instruction prompts
├── dist/                           # Compiled output
├── package.json
├── tsconfig.json
└── AGENTS.md                       # This file
```

## Architecture

### Two-Phase Data Processing

The codebase follows a consistent two-phase pattern for data handling:

1. **Phase 1 - Data Retrieval**: Fetch and accumulate data from Buildin API
2. **Phase 2 - Data Transformation**: Convert accumulated data to output format

Example flow for page content:
```
pageId → fetchPageContent() → PageContent → renderPageToMarkdown() → string
         (blockFetcher.ts)                   (markdownRenderer.ts)
```

### MCP Capabilities

#### Resource: `buildin:///pages/{pageId}`

Provides page content as markdown.

- **URI Template**: `buildin:///pages/{pageId}`
- **MIME Type**: `text/markdown`
- **Handler**: `src/tools/getPageContent.ts`

Data flow:
```
pageId → getPage() → Page metadata
       → getBlockChildren() → Block[] (with pagination)
       → recursive fetch for nested blocks
       → BlockNode[] tree structure
       → renderPageToMarkdown() → markdown string
```

#### Tool: `search`

Searches for pages and returns resource links.

- **Parameters**:
  - `query` (string, required): Search terms
  - `startCursor` (string, optional): Pagination cursor
  - `pageSize` (number, optional): Results per page
- **Returns**: Array of `resource_link` content items

Data flow:
```
SearchOptions → v1Search() → V1SearchResponse → formatSearchResponse() → SearchResult
                                                 (searchFormatter.ts)
```

#### Prompts

| Prompt | Purpose |
|--------|---------|
| `buildin-instructions` | System instructions for LLMs on how to use the server |
| `search-buildin` | Guided prompt for searching content |
| `read-page` | Guided prompt for reading a specific page |

### Block Type Support

The markdown renderer supports all Buildin block types:

| Category | Block Types |
|----------|-------------|
| Text | `paragraph`, `heading_1`, `heading_2`, `heading_3`, `quote`, `callout` |
| Lists | `bulleted_list_item`, `numbered_list_item`, `to_do` |
| Media | `image`, `file`, `bookmark`, `embed` |
| Code | `code`, `equation` |
| Structure | `divider`, `toggle`, `table`, `table_row`, `column_list`, `column` |
| References | `child_page`, `child_database`, `link_to_page` |
| Special | `synced_block`, `template` |

## Code Style Guidelines

### Type Definitions

**Prefer `type` over `interface`** for type aliases:

```typescript
// Preferred
type SearchOptions = {
  query: string;
  startCursor?: string;
  pageSize?: number;
};

// Avoid (unless extending SDK types)
interface SearchOptions {
  query: string;
  startCursor?: string;
  pageSize?: number;
}
```

**Exception**: Use `interface` only when extending external SDK types:

```typescript
// Acceptable - extending external type
import type { Block } from "buildin-api-sdk";

export interface BlockNode extends Block {
  children: BlockNode[];
}
```

### Function Definitions

**Prefer arrow functions** over `function` declarations:

```typescript
// Preferred
const fetchAllBlockChildren = async (
  api: DefaultApi,
  blockId: string,
): Promise<Block[]> => {
  // implementation
};

// Avoid
async function fetchAllBlockChildren(
  api: DefaultApi,
  blockId: string,
): Promise<Block[]> {
  // implementation
}
```

**Export style** - use `export const` for arrow functions:

```typescript
// Preferred
export const getPageContent = async (
  api: DefaultApi,
  pageId: string,
): Promise<string> => {
  const pageContent = await fetchPageContent(api, pageId);
  return renderPageToMarkdown(pageContent);
};
```

### Import Style

**Use `import type` for type-only imports**:

```typescript
import type { Block, DefaultApi } from "buildin-api-sdk";
import type { BlockNode, PageContent } from "./types.js";
```

**Always include `.js` extension** for local imports (ES modules requirement):

```typescript
import { fetchPageContent } from "../common/blockFetcher.js";
import type { SearchResult } from "../common/searchFormatter.js";
```

### TypeScript Strictness

The project uses strict TypeScript settings:

- `strict: true`
- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`

**Handle optional properties carefully** - avoid passing `undefined` to optional params:

```typescript
// Correct - conditionally add properties
const request: V1SearchRequest = { query: options.query };
if (options.startCursor) {
  request.start_cursor = options.startCursor;
}

// Incorrect - may fail with exactOptionalPropertyTypes
const request: V1SearchRequest = {
  query: options.query,
  start_cursor: options.startCursor, // Error if undefined
};
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Types | PascalCase | `BlockNode`, `SearchResult` |
| Constants | SCREAMING_SNAKE_CASE | `BUILDIN_INSTRUCTIONS` |
| Functions | camelCase | `fetchPageContent`, `renderBlock` |
| Files | camelCase | `blockFetcher.ts`, `markdownRenderer.ts` |

### Module Organization

**Keep modules focused** - each file should have a single responsibility:

| Module | Responsibility |
|--------|----------------|
| `types.ts` | Type definitions only |
| `blockFetcher.ts` | API data fetching logic |
| `markdownRenderer.ts` | Markdown conversion logic |
| `searchFormatter.ts` | Search result formatting |

**Export only public API** - keep helper functions private:

```typescript
// Private helper - not exported
const renderRichText = (richText: RichTextItem[] | undefined): string => {
  // ...
};

// Public API - exported
export const renderPageToMarkdown = (pageContent: PageContent): string => {
  // uses renderRichText internally
};
```

### Error Handling

**Use optional chaining and nullish coalescing** for defensive coding:

```typescript
const title = data?.title ?? "Untitled";
const url = data?.url ?? data?.file?.url ?? data?.external?.url ?? "";
```

### JSDoc Comments

**Document exported functions** with brief descriptions:

```typescript
/**
 * Fetches complete page content including all nested blocks
 */
export const fetchPageContent = async (
  api: DefaultApi,
  pageId: string,
): Promise<PageContent> => {
  // ...
};
```

## Environment Configuration

The server loads environment variables from `.env` and `.env.dev` files:

```typescript
import "dotenv/config.js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.dev" });
```

**Required environment variables:**
- `BUILDIN_API_KEY`: API key for Buildin.ai authentication

## Build and Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run server
npm start

# Clean build artifacts
npm run clean
```

## Adding New Features

### Adding a New Tool

1. Create handler in `src/tools/<toolName>.ts`:
```typescript
import type { DefaultApi } from "buildin-api-sdk";

export type ToolOptions = {
  // define options
};

export const toolHandler = async (
  api: DefaultApi,
  options: ToolOptions,
): Promise<ResultType> => {
  // implementation
};
```

2. Register in `src/app.ts`:
```typescript
import { toolHandler } from "./tools/<toolName>.js";

server.registerTool(
  "toolName",
  {
    title: "Tool Title",
    inputSchema: {
      param: z.string().describe("Parameter description"),
    },
  },
  async ({ param }) => {
    const result = await toolHandler(buildin, { param });
    return { content: [{ type: "text", text: result }] };
  },
);
```

### Adding a New Resource

1. Implement data fetching in `src/common/`
2. Register with `ResourceTemplate` in `src/app.ts`:
```typescript
server.registerResource(
  "resourceName",
  new ResourceTemplate("scheme:///path/{param}", { list: undefined }),
  {
    title: "Resource Title",
    description: "Resource description",
    mimeType: "text/plain",
  },
  async (uri, { param }) => {
    const content = await fetchContent(param as string);
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: content }],
    };
  },
);
```

### Adding a New Prompt

1. Define prompt template in `src/prompts/instructions.ts`:
```typescript
export const NEW_PROMPT_TEMPLATE = `Prompt text here`;
```

2. Register in `src/app.ts`:
```typescript
server.registerPrompt(
  "prompt-name",
  {
    title: "Prompt Title",
    description: "Prompt description",
  },
  () => ({
    messages: [
      {
        role: "user",
        content: { type: "text", text: NEW_PROMPT_TEMPLATE },
      },
    ],
  }),
);
```
