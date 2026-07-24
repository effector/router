# Paths

The `@effector/router-paths` package provides powerful path parsing and building utilities with full TypeScript type inference.

## Overview

`@effector/router-paths` is a standalone library for working with URL paths. It compiles path patterns into parser and builder functions with automatic parameter type extraction.

**Key features:**

- **Type-Safe** - Full TypeScript inference of path parameters
- **Flexible** - Support for strings, numbers, unions, and arrays
- **Modifiers** - Optional (`?`), repeating (`+`, `*`), and range (`{min,max}`) parameters
- **Validation** - Runtime validation of path parameters
- **Standalone** - Can be used independently or with `@effector/router`

## Installation

```bash
npm install @effector/router-paths
```

## Quick Start

```ts
import { compile } from '@effector/router-paths';

// Compile a path pattern
const { parse, build } = compile('/user/:id<number>');

// Parse a path
const result = parse('/user/123');
// { path: '/user/123', params: { id: 123 } }

// Build a path
const path = build({ id: 456 });
// '/user/456'
```

## Full reference

Parameter types, modifiers, TypeScript integration, path conversion, and the
complete API are documented in the [Paths reference](/reference/paths).
