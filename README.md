# Buildout MCP

## Why?
Better MCP server for Buildin.ai. The official mcp server simply replicates the
API, which leads to a large number of calls, an inconvenient response format
(json response for each block), and bloated context as a result.

## Goal

Provide a more efficient and AI-friendly MCP server for Buildin.ai. Currently
focused on readonly access and supports only search and page full text retrieval.

## Usage

### Obtain access token

To use Buildout MCP you need Buildin.ai API key:
- Go to [developer center](https://buildin.ai/dev/integrations)
- Create integration app -> App plugins -> Next
- In the opened form select space and grant `Read content` permission
- `BUILDIN_API_KEY` is the Authorization token
- Also grant integration access to desired pages in `Access permissions` tab

### NPM

```json
{
  "mcpServers": {
    "buildin": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "buildout-mcp"
      ],
      "env": {
        "BUILDIN_API_KEY": "<BUILD_ACCESS_TOKEN>"
      }
    }
  }
}
```

### Clone and build:

```shell
git clone https://github.com/wellwineo/buildout-mcp
cd buildout-mcp
npm ci
npm run build
```

Configure mcp server:
```json
{
  "mcpServers": {
    "buildin": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/path/to/buildout-mcp/dist/app.js"
      ],
      "env": {
        "BUILDIN_API_KEY": "<BUILD_ACCESS_TOKEN>"
      }
    } 
  }
}
```



## License

[MIT License](./LICENSE)
