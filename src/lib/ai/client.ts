import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";

// Singleton Claude client
let clientInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = config.ai.apiKey();
    clientInstance = new Anthropic({ apiKey });
  }
  return clientInstance;
}

export const DEFAULT_MODEL = config.ai.model;
export const ADVANCED_MODEL = config.ai.advancedModel;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a message to Claude with optional system prompt and conversation history.
 */
export async function sendMessage({
  messages,
  systemPrompt,
  model = DEFAULT_MODEL,
  maxTokens = 4096,
  temperature = 0.7,
}: {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages,
  });

  return response;
}

/**
 * Stream a message from Claude for real-time response rendering.
 */
export async function streamMessage({
  messages,
  systemPrompt,
  model = DEFAULT_MODEL,
  maxTokens = 4096,
  temperature = 0.7,
}: {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const client = getAnthropicClient();

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages,
  });

  return stream;
}
