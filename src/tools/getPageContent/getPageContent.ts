import type { DefaultApi } from "buildin-api-sdk";
import { fetchPageContent } from "./blockFetcher.js";
import { renderPageToMarkdown } from "./markdownRenderer.js";

/**
 * Retrieves a Buildin.ai page and converts it to markdown
 */
export const getPageContent = async (
  api: DefaultApi,
  pageId: string,
): Promise<string> => {
  const pageContent = await fetchPageContent(api, pageId);
  return renderPageToMarkdown(pageContent);
};
