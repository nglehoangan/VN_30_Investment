// @vitest-environment node
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkBoundaries } from '../../scripts/check-boundaries.mjs';
const roots = [];
function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'vn30-boundaries-')); roots.push(root);
  const all = { 'tsconfig.json': JSON.stringify({ compilerOptions: { moduleResolution: 'bundler', module: 'esnext', paths: { '@/*': ['./src/*'] } } }), ...files };
  for (const [name, source] of Object.entries(all)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), source);
  }
  return checkBoundaries(root);
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true }); });
describe('dependency boundaries', () => {
  it('accepts the real nonempty source graph', () => {
    const result = checkBoundaries(process.cwd());
    expect(result.files).toBeGreaterThan(8); expect(result.errors).toEqual([]);
  });
  it('accepts pure ports/application and server composition', () => {
    expect(fixture({
      'src/shared/id.ts': 'export type Id = string;',
      'src/domain/a.ts': 'export type { Id } from "@/shared/id";',
      'src/ports/a.ts': 'export type { Id } from "@/domain/a";',
      'src/application/a.ts': 'export type { Id } from "@/ports/a";',
      'src/infrastructure/a.ts': 'import "node:crypto";',
      'app/server/a.ts': 'import "server-only"; import "@/infrastructure/a";',
    }).errors).toEqual([]);
  });
  it.each([
    'import { secret } from "@/infrastructure/db";',
    'import type { secret } from "../infrastructure/db";',
    'export { secret } from "@/infrastructure/db";',
    'export * from "../infrastructure/db";',
    'const x = import("@/infrastructure/db");',
    'type X = import("@/infrastructure/db").secret;',
    'import x = require("@/infrastructure/db");',
    'const x = require("@/infrastructure/db");',
  ])('rejects forbidden edge syntax: %s', source => {
    expect(fixture({ 'src/domain/a.ts': source, 'src/infrastructure/db.ts': 'export const secret = 1;' }).errors.join('\n')).toContain('Forbidden dependency');
  });
  it.each(['react', 'next', '@prisma/client', 'node:fs', 'fs', 'unknown-sdk'])('rejects domain external %s', spec => {
    expect(fixture({ 'src/domain/a.ts': `import "${spec}";` }).errors.length).toBeGreaterThan(0);
  });
  it('rejects shared as an infrastructure backdoor', () => {
    expect(fixture({ 'src/shared/a.ts': 'export * from "@/infrastructure/db";', 'src/infrastructure/db.ts': 'export const x=1;' }).errors.length).toBeGreaterThan(0);
  });
  it('rejects UI direct infrastructure access', () => {
    expect(fixture({ 'src/ui/a.ts': 'import "@/infrastructure/db";', 'src/infrastructure/db.ts': '' }).errors.length).toBeGreaterThan(0);
  });
  it('follows indirect client barrel imports into server composition', () => {
    const result = fixture({ 'app/client.ts': '"use client"; import "./barrel";', 'app/barrel.ts': 'export * from "./server/runtime";', 'app/server/runtime.ts': 'import "server-only"; export const x=1;' });
    expect(result.errors.join('\n')).toContain('Client graph reaches');
  });
  it('rejects client access to server APIs through an app barrel', () => {
    expect(fixture({ 'app/client.ts': '"use client"; import "./barrel";', 'app/barrel.ts': 'export { headers } from "next/headers";' }).errors.join('\n')).toContain('Client graph reaches');
  });
  it('rejects an aliased require loader', () => {
    expect(fixture({ 'src/domain/a.ts': 'const load = require; load("node:fs");' }).errors.join('\n')).toContain('Aliased module loaders');
  });
  it('allows Zod only inside declared trust-boundary/config paths', () => {
    expect(fixture({ 'src/shared/validation/schema.ts': 'import { z } from "zod";', 'src/infrastructure/config/env.ts': 'import { z } from "zod";' }).errors).toEqual([]);
    expect(fixture({ 'src/shared/other.ts': 'import { z } from "zod";' }).errors.length).toBeGreaterThan(0);
    expect(fixture({ 'src/domain/a.ts': 'import { z } from "zod";' }).errors.length).toBeGreaterThan(0);
  });
  it('prevents indirect validation imports into pure core', () => {
    const result = fixture({
      'src/domain/a.ts': 'import "@/shared/barrel";',
      'src/shared/barrel.ts': 'export * from "@/shared/validation/schema";',
      'src/shared/validation/schema.ts': 'import { z } from "zod"; export const x=1;',
    });
    expect(result.errors.join('\n')).toContain('Pure core cannot reach');
  });
  it('includes the Next startup entrypoint and requires a server marker', () => {
    expect(fixture({ 'instrumentation.ts': 'import "server-only"; import "./app/server/runtime";', 'app/server/runtime.ts': 'import "server-only";' }).errors).toEqual([]);
    expect(fixture({ 'instrumentation.ts': 'export function register() {}' }).errors.join('\n')).toContain('server-only marker');
  });
  it('blocks client imports of the startup entrypoint', () => {
    expect(fixture({ 'app/client.ts': '\"use client\"; import "../instrumentation";', 'instrumentation.ts': 'import "server-only";' }).errors.join('\n')).toContain('Client graph reaches');
  });
  it('allows the concrete DB adapter but not Prisma imports in core/UI', () => {
    expect(fixture({ 'src/infrastructure/db/client.ts': 'import "@prisma/adapter-better-sqlite3";' }).errors).toEqual([]);
    expect(fixture({ 'src/ui/a.ts': 'import "@prisma/client";' }).errors.length).toBeGreaterThan(0);
    expect(fixture({ 'src/domain/a.ts': 'import "@prisma/client";' }).errors.length).toBeGreaterThan(0);
  });
  it('does not let generated-client imports bypass infrastructure boundaries', () => {
    expect(fixture({ 'src/domain/a.ts': 'export type { X } from "@/infrastructure/db/generated/client";', 'src/infrastructure/db/generated/client.ts': 'export type X=string;' }).errors.join('\n')).toContain('Forbidden dependency');
  });
  it('rejects a computed import rather than silently skipping it', () => {
    expect(fixture({ 'src/domain/a.ts': 'const x="module"; import(x);' }).errors.join('\n')).toContain('Computed');
  });
  it.each(['Date.now()', 'new Date()', 'Math.random()', 'fetch("url")', 'process.env.KEY'])('rejects ambient impurity %s', expression => {
    expect(fixture({ 'src/shared/a.ts': `const x=${expression};` }).errors.length).toBeGreaterThan(0);
  });
});
