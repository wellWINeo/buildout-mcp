#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Configuration, DefaultApi } from "buildin-api-sdk";
import { z } from "zod";
import { getPageContent } from "./tools/getPageContent/getPageContent.js";
import { search, type SearchOptions } from "./tools/search/search.js";
import { BUILDIN_INSTRUCTIONS } from "./prompts/instructions.js";

const server = new McpServer({
  name: "Buildout MCP",
  version: "0.0.1",
});

const buildinApiKey = process.env["BUILDIN_API_KEY"];

if (!buildinApiKey) {
  throw new Error("BUILDIN_API_KEY environment variable is not set");
}

const buildin = new DefaultApi(
  new Configuration({
    basePath: "https://api.buildin.ai",
    headers: {
      Authorization: `Bearer ${buildinApiKey}`,
    },
  }),
);

server.registerResource(
  "page",
  new ResourceTemplate("buildin:///pages/{pageId}", { list: undefined }),
  {
    title: "Buildin.ai Page",
    description: "Page content from Buildin.ai",
    mimeType: "text/markdown",
  },
  async (uri, { pageId }) => {
    const markdown = await getPageContent(buildin, pageId as string);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: markdown,
        },
      ],
    };
  },
);

server.registerTool(
  "search",
  {
    title: "Searches for pages in Buildin.ai",
    inputSchema: {
      query: z.string().describe("Search query"),
      startCursor: z
        .string()
        .optional()
        .describe("Pagination cursor for next page of results"),
      pageSize: z
        .number()
        .optional()
        .describe("Number of results per page (default: 20)"),
    },
  },
  async ({ query, startCursor, pageSize }) => {
    const { results, nextCursor, hasMore } = await search(buildin, {
      query,
      startCursor,
      pageSize,
    });

    const content: Array<
      | {
          type: "resource_link";
          uri: string;
          name: string;
          description?: string;
          mimeType: string;
        }
      | { type: "text"; text: string }
    > = [...results];

    if (hasMore && nextCursor) {
      content.push({
        type: "text",
        text: `More results available. Next cursor: ${nextCursor}`,
      });
    }

    return { content };
  },
);

// Prompts
server.registerPrompt(
  "buildin-instructions",
  {
    title: "Buildin.ai Instructions",
    description:
      "System instructions for working with Buildin.ai knowledge base",
  },
  () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: BUILDIN_INSTRUCTIONS,
        },
      },
    ],
  }),
);

const main = async () => {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Buildout MCP server started");
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
