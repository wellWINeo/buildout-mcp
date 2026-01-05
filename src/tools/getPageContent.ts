import type { DefaultApi } from "buildin-api-sdk";
import { fetchPageContent } from "../common/blockFetcher.js";
import { renderPageToMarkdown } from "../common/markdownRenderer.js";

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
