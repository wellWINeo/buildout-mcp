import type { Block, Page } from "buildin-api-sdk";

/**
 * Block with pre-fetched children for tree traversal
 */
export type BlockNode = Block & {
  children: BlockNode[];
};

/**
 * Complete page content with metadata and all blocks
 */
export type PageContent = {
  page: Page;
  blocks: BlockNode[];
};
