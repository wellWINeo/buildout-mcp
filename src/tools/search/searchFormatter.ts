import type { V1SearchPageResult, V1SearchResponse } from "buildin-api-sdk";

/**
 * Resource link structure for MCP tool response
 */
export type ResourceLink = {
  type: "resource_link";
  uri: string;
  name: string;
  description?: string;
  mimeType: string;
};

/**
 * Search result with resource links and pagination info
 */
export type SearchResult = {
  results: ResourceLink[];
  nextCursor?: string;
  hasMore: boolean;
};

/**
 * Extracts page title from search result properties
 */
const getPageTitle = (result: V1SearchPageResult): string => {
  const titleProp = result.properties?.title;
  if (!titleProp?.title) return "Untitled";

  return titleProp.title.map((t) => t.text?.content ?? "").join("");
};

/**
 * Gets description from parent info
 */
const getDescription = (result: V1SearchPageResult): string | undefined => {
  if (!result.parent) return undefined;

  if (result.parent.type === "database_id") {
    return `From database: ${result.parent.database_id}`;
  }
  if (result.parent.type === "page_id") {
    return `Child of page: ${result.parent.page_id}`;
  }
  return undefined;
};

/**
 * Converts a search result to a resource link
 */
const toResourceLink = (result: V1SearchPageResult): ResourceLink => {
  const id = result.id ?? "unknown";
  const name = getPageTitle(result);
  const description = getDescription(result);

  return {
    type: "resource_link",
    uri: `buildin:///pages/${id}`,
    name,
    ...(description && { description }),
    mimeType: "text/markdown",
  };
};

/**
 * Formats search response into structured result with resource links
 */
export const formatSearchResponse = (
  response: V1SearchResponse,
): SearchResult => {
  const results = response.results ?? [];

  const result: SearchResult = {
    results: results.map(toResourceLink),
    hasMore: response.has_more ?? false,
  };

  if (response.next_cursor) {
    result.nextCursor = response.next_cursor;
  }

  return result;
};
