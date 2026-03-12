import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Get chat history for authenticated user
  return NextResponse.json({
    messages: [],
    message: "Chat endpoint — AI concierge conversation history",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Send message to AI concierge, stream response
  // Will use Anthropic Claude SDK with RAG context
  return NextResponse.json(
    { error: "Not implemented — will use streaming" },
    { status: 501 }
  );
}
