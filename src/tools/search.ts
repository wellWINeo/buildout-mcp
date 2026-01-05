import type { DefaultApi, V1SearchRequest } from "buildin-api-sdk";
import {
  formatSearchResponse,
  type SearchResult,
} from "../common/searchFormatter.js";

export type SearchOptions = {
  query: string;
  startCursor?: string;
  pageSize?: number;
};

/**
 * Searches for pages in Buildin.ai and returns resource links
 */
export const search = async (
  api: DefaultApi,
  options: SearchOptions,
): Promise<SearchResult> => {
  const request: V1SearchRequest = { query: options.query };

  if (options.startCursor) {
    request.start_cursor = options.startCursor;
  }
  if (options.pageSize) {
    request.page_size = options.pageSize;
  }

  const response = await api.v1Search({ v1SearchRequest: request });

  return formatSearchResponse(response);
};
