import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const ENV = { ...process.env };

function writeTarget(path: string): string {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "", "utf8");
  return path;
}

async function withHome<T>(home: string, fn: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.doMock("node:os", async (importOriginal) => ({
    ...(await importOriginal<typeof import("node:os")>()),
    homedir: () => home,
  }));
  return fn();
}

afterEach(() => {
  process.env = { ...ENV };
  vi.resetModules();
  vi.doUnmock("node:os");
});

describe("local VS Code Insiders target discovery", () => {
  it("finds Claude Code under ~/.vscode-insiders/extensions", async () => {
    delete process.env.KICKBACKS_CC_TARGET;
    delete process.env.VIBE_ADS_CC_TARGET;
    const home = mkdtempSync(join(tmpdir(), "kb-insiders-home-"));
    const target = writeTarget(join(home, ".vscode-insiders", "extensions",
      "anthropic.claude-code-2.1.143", "webview", "index.js"));

    await withHome(home, async () => {
      const { locateClaudeCode } = await import("../src/locate");
      expect(locateClaudeCode()).toBe(target);
    });
  });

  it("finds Codex under ~/.vscode-insiders/extensions", async () => {
    delete process.env.KICKBACKS_CODEX_TARGET;
    delete process.env.VIBE_ADS_CODEX_TARGET;
    const home = mkdtempSync(join(tmpdir(), "kb-insiders-home-"));
    const target = writeTarget(join(home, ".vscode-insiders", "extensions",
      "openai.chatgpt-26.0.0", "webview", "assets",
      "thinking-shimmer-x.js"));

    await withHome(home, async () => {
      const { locateCodexTarget } = await import("../src/adapters/registry");
      expect(locateCodexTarget()).toBe(target);
    });
  });
});
