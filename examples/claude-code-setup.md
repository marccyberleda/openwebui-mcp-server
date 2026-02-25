# Claude Code Setup Guide

## Step 1: Get your Open WebUI API key

1. Open your Open WebUI instance
2. Go to **Settings → Account**
3. Scroll to **API Keys** and create a new key
4. Copy the key — you won't see it again

## Step 2: Add the MCP server

```bash
claude mcp add openwebui \
  -e OPENWEBUI_URL=http://localhost:3000 \
  -e OPENWEBUI_API_KEY=sk-your-key-here \
  -- npx -y openwebui-mcp-server
```

Replace `http://localhost:3000` with your Open WebUI URL if it's hosted remotely.

## Step 3: Verify the connection

In Claude Code, run:

```
/mcp
```

You should see `openwebui` listed as a connected server with all tools available.

Or ask Claude directly:

> "Use openwebui_get_status to check my Open WebUI instance"

## Step 4: Start using it

```
# List your recent chats
"Show me my recent Open WebUI chats"

# Search for a conversation
"Search my Open WebUI chats for anything about Kubernetes"

# Work with knowledge bases
"List my Open WebUI knowledge bases"
"Create a knowledge base called 'Company Docs' for internal documentation"

# Upload a file and add it to a knowledge base
"Upload this markdown file to Open WebUI and add it to the Company Docs knowledge base"

# Manage prompts
"Create an Open WebUI prompt /summarize that summarizes {{input}} in 3 bullet points"

# Check what models are available
"List all models available in my Open WebUI instance"
```

## Remote instance setup

If your Open WebUI is behind authentication (Cloudflare, basic auth, etc.), ensure:
- The API key endpoint (`/api/v1/...`) is accessible from where Claude Code runs
- HTTPS is used for remote instances

```bash
claude mcp add openwebui \
  -e OPENWEBUI_URL=https://chat.yourcompany.com \
  -e OPENWEBUI_API_KEY=sk-your-key-here \
  -- npx -y openwebui-mcp-server
```

## Debug mode

If something isn't working, enable debug logging:

```bash
claude mcp add openwebui \
  -e OPENWEBUI_URL=http://localhost:3000 \
  -e OPENWEBUI_API_KEY=sk-your-key-here \
  -e DEBUG=openwebui-mcp \
  -- npx -y openwebui-mcp-server
```

This logs all HTTP requests and responses to stderr.

## Updating

```bash
npx -y openwebui-mcp-server@latest
```

Or if installed globally:

```bash
npm update -g openwebui-mcp-server
```
