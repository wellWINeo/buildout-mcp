import type { RichTextItem, PropertyValueTitle } from "buildin-api-sdk";
import type { BlockNode, PageContent } from "../../common/types.js";

/**
 * Converts rich text array to markdown string with annotations
 */
const renderRichText = (richText: RichTextItem[] | undefined): string => {
  if (!richText) return "";

  return richText
    .map((item) => {
      let text = item.plain_text ?? "";

      if (!text) return "";

      const annotations = item.annotations;
      if (annotations) {
        if (annotations.code) {
          text = `\`${text}\``;
        }
        if (annotations.bold) {
          text = `**${text}**`;
        }
        if (annotations.italic) {
          text = `*${text}*`;
        }
        if (annotations.strikethrough) {
          text = `~~${text}~~`;
        }
      }

      if (item.href) {
        text = `[${text}](${item.href})`;
      }

      return text;
    })
    .join("");
};

/**
 * Gets icon as text (emoji or placeholder)
 */
const renderIcon = (
  icon: { type?: string; emoji?: string } | undefined,
): string => {
  if (!icon) return "";
  if (icon.type === "emoji" && icon.emoji) {
    return icon.emoji;
  }
  return "";
};

/**
 * Renders a single block to markdown, recursively handling children
 */
const renderBlock = (block: BlockNode, depth: number = 0): string => {
  const indent = "  ".repeat(depth);
  const data = block.data;
  const text = renderRichText(data?.rich_text);

  switch (block.type) {
    case "paragraph":
      return text ? `${text}\n\n` : "\n";

    case "heading_1":
      return `# ${text}\n\n`;

    case "heading_2":
      return `## ${text}\n\n`;

    case "heading_3":
      return `### ${text}\n\n`;

    case "bulleted_list_item": {
      let result = `${indent}- ${text}\n`;
      if (block.children.length > 0) {
        result += renderBlocks(block.children, depth + 1);
      }
      return result;
    }

    case "numbered_list_item": {
      let result = `${indent}1. ${text}\n`;
      if (block.children.length > 0) {
        result += renderBlocks(block.children, depth + 1);
      }
      return result;
    }

    case "to_do": {
      const checked = data?.checked ? "x" : " ";
      let result = `${indent}- [${checked}] ${text}\n`;
      if (block.children.length > 0) {
        result += renderBlocks(block.children, depth + 1);
      }
      return result;
    }

    case "quote": {
      const lines = text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      let result = `${lines}\n\n`;
      if (block.children.length > 0) {
        const childContent = renderBlocks(block.children, 0)
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
        result = `${lines}\n${childContent}\n\n`;
      }
      return result;
    }

    case "code": {
      const language = data?.language ?? "";
      const codeText = renderRichText(data?.rich_text);
      return `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
    }

    case "divider":
      return "---\n\n";

    case "image": {
      const url = data?.url ?? data?.file?.url ?? data?.external?.url ?? "";
      const caption = renderRichText(data?.caption);
      return `![${caption}](${url})\n\n`;
    }

    case "file": {
      const url = data?.url ?? data?.file?.url ?? data?.external?.url ?? "";
      const caption = renderRichText(data?.caption) || "File";
      return `[${caption}](${url})\n\n`;
    }

    case "bookmark": {
      const url = data?.url ?? "";
      const caption = renderRichText(data?.caption) || url;
      return `[${caption}](${url})\n\n`;
    }

    case "embed": {
      const url = data?.url ?? "";
      const caption = renderRichText(data?.caption) || url;
      return `[${caption}](${url})\n\n`;
    }

    case "callout": {
      const icon = renderIcon(data?.icon);
      const prefix = icon ? `${icon} ` : "";
      return `> ${prefix}${text}\n\n`;
    }

    case "equation": {
      const expression = data?.expression ?? "";
      return `$$\n${expression}\n$$\n\n`;
    }

    case "toggle": {
      let result = `<details>\n<summary>${text}</summary>\n\n`;
      if (block.children.length > 0) {
        result += renderBlocks(block.children, 0);
      }
      result += "</details>\n\n";
      return result;
    }

    case "table": {
      return renderTable(block);
    }

    case "table_row": {
      // Handled by renderTable
      return "";
    }

    case "column_list": {
      // Render columns inline
      return renderBlocks(block.children, depth);
    }

    case "column": {
      return renderBlocks(block.children, depth);
    }

    case "child_page": {
      const title = data?.title ?? "Untitled";
      return `📄 **${title}**\n\n`;
    }

    case "child_database": {
      const title = data?.title ?? "Untitled Database";
      return `🗃️ **${title}**\n\n`;
    }

    case "link_to_page": {
      const pageId = data?.page_id ?? "";
      return `🔗 [Page Link](${pageId})\n\n`;
    }

    case "synced_block": {
      // Render synced content transparently
      return renderBlocks(block.children, depth);
    }

    case "template": {
      // Render template content transparently
      return renderBlocks(block.children, depth);
    }

    default:
      // Unknown block type - try to render as text
      return text ? `${text}\n\n` : "";
  }
};

/**
 * Renders a table block to markdown
 */
const renderTable = (block: BlockNode): string => {
  if (block.children.length === 0) return "";

  const rows: string[][] = [];

  for (const row of block.children) {
    if (row.type === "table_row" && row.data?.cells) {
      const cells = row.data.cells.map((cell) => renderRichText(cell));
      rows.push(cells);
    }
  }

  if (rows.length === 0) return "";

  const columnCount = Math.max(...rows.map((r) => r.length));

  // Normalize rows to have same number of columns
  const normalizedRows = rows.map((row) => {
    while (row.length < columnCount) {
      row.push("");
    }
    return row;
  });

  let result = "";

  // Header row
  const hasHeader = block.data?.has_column_header;
  const headerRow = normalizedRows[0] ?? [];
  result += `| ${headerRow.join(" | ")} |\n`;
  result += `| ${headerRow.map(() => "---").join(" | ")} |\n`;

  // Data rows
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;
  if (!hasHeader) {
    // If no header, we already printed first row, skip re-printing
    for (const row of normalizedRows.slice(1)) {
      result += `| ${row.join(" | ")} |\n`;
    }
  } else {
    for (const row of dataRows) {
      result += `| ${row.join(" | ")} |\n`;
    }
  }

  return result + "\n";
};

/**
 * Renders an array of blocks to markdown
 */
const renderBlocks = (blocks: BlockNode[], depth: number = 0): string => {
  return blocks.map((block) => renderBlock(block, depth)).join("");
};

/**
 * Renders complete page content to markdown
 */
export const renderPageToMarkdown = (pageContent: PageContent): string => {
  const { page, blocks } = pageContent;

  let markdown = "";

  // Add page title if available from properties
  const titleProp = page.properties?.title ?? page.properties?.Title;
  if (titleProp && titleProp.type === "title") {
    const titleValue = titleProp as PropertyValueTitle;
    const title = titleValue.title.map((t) => t.plain_text ?? "").join("");
    if (title) {
      markdown += `# ${title}\n\n`;
    }
  }

  // Render all blocks
  markdown += renderBlocks(blocks);

  return markdown.trim();
};
