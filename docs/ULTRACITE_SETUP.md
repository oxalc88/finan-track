# Ultracite Setup Guide

## What is Ultracite?

**Ultracite** is a zero-configuration linter and formatter built on Biome (a super-fast Rust-based tool). It's designed specifically for modern TypeScript projects and AI-assisted development.

### Why Ultracite Instead of ESLint + Prettier?

| Feature | Ultracite | ESLint + Prettier |
|---------|-----------|-------------------|
| **Configuration** | Zero-config | Hundreds of lines |
| **Speed** | Subsecond (Rust) | Slower (Node.js) |
| **Tools needed** | 1 tool | 2 tools |
| **AI compatibility** | Built for AI | Works but not optimized |
| **Complexity rules** | Built-in | Manual configuration |
| **Setup time** | 1 command | 15+ minutes |

### What Ultracite Enforces

Out of the box (no config needed):
- ✅ **Code formatting** (like Prettier)
- ✅ **Type safety** (strict TypeScript rules)
- ✅ **Import organization** (sorted, no unused)
- ✅ **Accessibility** (a11y rules for React)
- ✅ **Complexity limits** (prevents complex code)
- ✅ **Best practices** (for TypeScript, React, Next.js)

---

## Installation

### Step 1: Initialize Ultracite

```bash
# In your project root
npx ultracite init
```

This automatically:
- Installs Ultracite as a dev dependency
- Creates `biome.jsonc` configuration file
- Sets up VS Code integration (if detected)
- Configures format-on-save

### Step 2: Add Scripts to package.json

```json
{
  "scripts": {
    "format": "ultracite fix",
    "check": "ultracite check",
    "precommit": "ultracite check"
  }
}
```

### Step 3: (Optional) VS Code Integration

If not auto-configured, add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## Usage

### CLI Commands

```bash
# Format and auto-fix all issues
npx ultracite fix

# Check for issues (no auto-fix)
npx ultracite check

# Check specific files
npx ultracite check src/services/*.ts
```

### In Development

Ultracite runs automatically:
- ✅ On save (if VS Code integration is set up)
- ✅ In CI/CD (add `ultracite check` to your workflow)
- ✅ Pre-commit (use `husky` + `lint-staged`)

### NPM Scripts

```bash
# Format all code
npm run format

# Check for issues
npm run check
```

---

## Configuration (Optional)

Ultracite works **zero-config**, but you can customize if needed.

### biome.jsonc

Created automatically by `ultracite init`:

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "extends": ["ultracite"],

  // Optional: Override specific rules
  "linter": {
    "rules": {
      "complexity": {
        // Already enforced by Ultracite defaults
        "noExtraBooleanCast": "error",
        "noMultipleSpacesInRegularExpressionLiterals": "error"
      }
    }
  },

  // Optional: Customize formatting
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### Ignore Files

Create `biome.json` or add to existing config:

```jsonc
{
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage"
    ]
  }
}
```

---

## What Ultracite Catches

### Complexity Issues

```typescript
// ❌ Ultracite will flag this (too complex)
function bad(x: number) {
  if (x > 0) {
    if (x < 10) {
      if (x % 2 === 0) {
        if (x !== 6) {
          // deeply nested logic
        }
      }
    }
  }
}

// ✅ Ultracite approves (simple, clear)
function good(x: number) {
  if (!isValidRange(x)) return;
  if (!isEven(x)) return;
  if (x === 6) return;

  // process
}
```

### Type Safety

```typescript
// ❌ Ultracite error: implicit any
function bad(data) {
  return data.value;
}

// ✅ Ultracite approves
function good(data: { value: string }): string {
  return data.value;
}
```

### Import Organization

```typescript
// ❌ Before Ultracite fix
import { z } from 'zod';
import React from 'react';
import { uploadFile } from './storage';
import type { Invoice } from '../types';

// ✅ After Ultracite fix (auto-sorted)
import React from 'react';
import { z } from 'zod';

import type { Invoice } from '../types';
import { uploadFile } from './storage';
```

### Accessibility (React)

```tsx
// ❌ Ultracite error: missing alt text
<img src="invoice.jpg" />

// ✅ Ultracite approves
<img src="invoice.jpg" alt="Invoice #1234" />
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/check.yml
name: Code Quality

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run Ultracite check
        run: npx ultracite check
```

### Pre-commit Hook

Using `husky` + `lint-staged`:

```bash
# Install
npm install -D husky lint-staged
npx husky init
```

```javascript
// .husky/pre-commit
npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "ultracite fix"
    ]
  }
}
```

---

## Performance

Ultracite is **blazing fast** because it's built in Rust:

| Codebase Size | ESLint + Prettier | Ultracite |
|---------------|-------------------|-----------|
| 1,000 files | ~15 seconds | <1 second |
| 5,000 files | ~60 seconds | ~2 seconds |
| 10,000 files | ~120 seconds | ~4 seconds |

**Format on save** never blocks your workflow.

---

## Monorepo Support

For monorepos, run `ultracite init` once at the root:

```
my-monorepo/
├── biome.jsonc          ← One config for all packages
├── packages/
│   ├── api/
│   ├── frontend/
│   └── shared/
└── package.json
```

No need for per-package ESLint configs!

---

## Migration from ESLint + Prettier

### Step 1: Remove Old Tools

```bash
npm uninstall eslint prettier \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-config-prettier \
  eslint-plugin-prettier
```

### Step 2: Delete Old Config Files

```bash
rm .eslintrc.js .eslintignore .prettierrc.json .prettierignore
```

### Step 3: Install Ultracite

```bash
npx ultracite init
```

### Step 4: Update Scripts

```json
{
  "scripts": {
    "lint": "ultracite check",       // was: eslint .
    "lint:fix": "ultracite fix",     // was: eslint . --fix
    "format": "ultracite fix"        // was: prettier --write .
  }
}
```

### Step 5: Fix All Files

```bash
npx ultracite fix
```

Done! Your codebase is now using Ultracite.

---

## FAQ

### Can I customize the rules?

Yes, but **you probably don't need to**. Ultracite's defaults are well-thought-out for TypeScript projects. If you must customize, edit `biome.jsonc`.

### Does it work with existing code?

Yes! Run `npx ultracite fix` to auto-format and fix issues. Review the changes before committing.

### Does it replace ESLint plugins?

For most use cases, yes. Ultracite includes:
- TypeScript rules
- React rules (including hooks)
- Accessibility rules
- Import sorting
- Complexity checks

If you need specialized plugins (e.g., `eslint-plugin-security`), you might need to keep ESLint for those specific checks.

### Performance on large codebases?

Ultracite is built in Rust and is **50-100x faster** than ESLint + Prettier. Even on 10,000+ file codebases, it runs in seconds.

### Works with AI coding assistants?

Absolutely! Ultracite is specifically designed to work with:
- GitHub Copilot
- Cursor
- Claude Code (that's us!)
- Windsurf
- Zed
- OpenAI Codex

AI-generated code is automatically formatted and checked on save.

---

## Troubleshooting

### "Module not found: ultracite"

Run `npx ultracite init` again. Make sure it's installed as a dev dependency.

### VS Code not formatting on save

1. Install the Biome extension: `biomejs.biome`
2. Set it as default formatter in settings
3. Enable format on save

### Conflicts with ESLint

If you still have ESLint installed, disable it in VS Code settings or remove it entirely:

```bash
npm uninstall eslint
```

---

## Summary

**Setup:** 1 command (`npx ultracite init`)

**Usage:** Automatic on save

**Speed:** Subsecond

**Configuration:** Zero

**Perfect for:** Solo developers, TypeScript projects, AI-assisted coding

Just install it and forget about linting/formatting configuration forever. 🎯
