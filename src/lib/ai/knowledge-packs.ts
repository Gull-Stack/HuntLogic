import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface KnowledgePackMatch {
  title: string;
  path: string;
  score: number;
  content: string;
}

interface KnowledgePack {
  title: string;
  path: string;
  states: string[];
  species: string[];
  keywords: string[];
  content: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), "docs", "knowledge");
let cachePromise: Promise<KnowledgePack[]> | null = null;

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFrontmatter(raw: string): Omit<KnowledgePack, "path"> {
  const normalized = raw.replace(/\r\n/g, "\n");
  const trimmed = normalized.trimStart();
  if (!trimmed.startsWith("---\n")) {
    return {
      title: "Untitled Knowledge Pack",
      states: [],
      species: [],
      keywords: [],
      content: raw.trim(),
    };
  }

  const end = trimmed.indexOf("\n---\n", 4);
  if (end === -1) {
    return {
      title: "Untitled Knowledge Pack",
      states: [],
      species: [],
      keywords: [],
      content: raw.trim(),
    };
  }

  const header = trimmed.slice(4, end).split("\n");
  const body = trimmed.slice(end + 5).trim();
  const meta: Record<string, string> = {};

  for (const line of header) {
    if (line.startsWith(" ") || line.startsWith("\t")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!value || value === "|" || value === ">") continue;
    meta[key] = value;
  }

  return {
    title: meta.title ?? "Untitled Knowledge Pack",
    states: parseList(meta.states),
    species: parseList(meta.species),
    keywords: parseList(meta.keywords),
    content: body,
  };
}

async function loadKnowledgePacks(): Promise<KnowledgePack[]> {
  if (!cachePromise) {
    cachePromise = loadKnowledgePacksUncached();
  }

  return cachePromise;
}

async function loadKnowledgePacksUncached(): Promise<KnowledgePack[]> {
  let entries: string[] = [];
  try {
    entries = await readdir(KNOWLEDGE_DIR);
  } catch {
    return [];
  }

  return Promise.all(
    entries
      .filter((entry) => entry.endsWith(".md"))
      .map(async (entry) => {
        const fullPath = path.join(KNOWLEDGE_DIR, entry);
        const raw = await readFile(fullPath, "utf8");
        const parsed = parseFrontmatter(raw);
        return {
          ...parsed,
          path: path.relative(process.cwd(), fullPath),
        } satisfies KnowledgePack;
      })
  );
}

function scorePack(pack: KnowledgePack, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  for (const state of pack.states) {
    const token = state.toLowerCase();
    if (!token) continue;
    const matched =
      token.length <= 3
        ? new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(q)
        : q.includes(token);
    if (matched) score += token.length <= 3 ? 5 : 8;
  }

  for (const species of pack.species) {
    const token = species.toLowerCase();
    if (!token) continue;
    const matched =
      token.length <= 3
        ? new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(q)
        : q.includes(token);
    if (matched) score += 6;
  }

  for (const keyword of pack.keywords) {
    const token = keyword.toLowerCase();
    if (!token) continue;
    if (q.includes(token)) score += 2;
  }

  if (score > 0 && q.includes("apply")) score += 1;
  if (score > 0 && q.includes("best")) score += 1;
  if (score > 0 && q.includes("rank")) score += 1;

  return score;
}

export async function findRelevantKnowledgePacks(
  query: string,
  limit: number = 2
): Promise<KnowledgePackMatch[]> {
  const packs = await loadKnowledgePacks();

  return packs
    .map((pack) => ({
      title: pack.title,
      path: pack.path,
      content: pack.content,
      score: scorePack(pack, query),
    }))
    .filter((pack) => pack.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function buildKnowledgeContext(
  query: string,
  limit: number = 2
): Promise<string> {
  const packs = await findRelevantKnowledgePacks(query, limit);
  if (packs.length === 0) return "";

  return packs
    .map(
      (pack, index) =>
        `<knowledge_pack index="${index + 1}" title="${escapeXml(pack.title)}" path="${escapeXml(pack.path)}" score="${pack.score}">\n${pack.content}\n</knowledge_pack>`
    )
    .join("\n\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
