import type { Block, DefaultApi } from "buildin-api-sdk";
import type { BlockNode, PageContent } from "../../common/types.js";

/**
 * Fetches all children of a block, handling pagination
 */
const fetchAllBlockChildren = async (
  api: DefaultApi,
  blockId: string,
): Promise<Block[]> => {
  const allBlocks: Block[] = [];
  let cursor: string | undefined;

  do {
    const response = await api.getBlockChildren(
      cursor ? { blockId, startCursor: cursor } : { blockId },
    );

    if (response.results) {
      allBlocks.push(...response.results);
    }

    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return allBlocks;
};

/**
 * Recursively fetches a block's children and converts to BlockNode tree
 */
const fetchBlockTree = async (
  api: DefaultApi,
  blocks: Block[],
): Promise<BlockNode[]> => {
  const nodes: BlockNode[] = [];

  for (const block of blocks) {
    const node: BlockNode = {
      ...block,
      children: [],
    };

    if (block.has_children && block.id) {
      const childBlocks = await fetchAllBlockChildren(api, block.id);
      node.children = await fetchBlockTree(api, childBlocks);
    }

    nodes.push(node);
  }

  return nodes;
};

/**
 * Fetches complete page content including all nested blocks
 */
export const fetchPageContent = async (
  api: DefaultApi,
  pageId: string,
): Promise<PageContent> => {
  const page = await api.getPage({ pageId });
  const topLevelBlocks = await fetchAllBlockChildren(api, pageId);
  const blocks = await fetchBlockTree(api, topLevelBlocks);

  return { page, blocks };
};
