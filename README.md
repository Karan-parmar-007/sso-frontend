# SSO Frontend

Vite + React + TypeScript auth SPA for `auth.karanparmar.in`.

## Stack
- Tailwind CSS v4, shadcn/ui (new-york), motion, TanStack Query, axios (cookie + CSRF)

## Design
Navy `#0a192f` + teal `#64ffda` to match the portfolio. Fast CSS aurora — no WebGL/Spline.

## Optional 21st.dev Magic MCP (IDE only)
Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "21st-magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/cli@latest", "mcp"]
    }
  }
}
```

## Dev
```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` should point at the SSO API root including `/api` (e.g. `http://localhost:8000/api`). Client calls go to `{VITE_API_URL}/v1/...`.
