import OpenAI from 'openai';
import { getOrderDetails } from '@/lib/orders';
import { MODEL, ORDER_TOOL, SYSTEM_INSTRUCTIONS } from '@/lib/policy';

export const runtime = 'nodejs';

const openai = new OpenAI();

export async function POST(request) {
  try {
    const { messages = [] } = await request.json();
    const input = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-30)
      .map((m) => ({ role: m.role, content: String(m.content) }));

    const toolCalls = [];
    let response = await openai.responses.create({
      model: MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input,
      tools: [ORDER_TOOL],
    });

    // Resolve tool calls until the model produces a final answer.
    for (let i = 0; i < 4; i++) {
      const calls = response.output.filter((item) => item.type === 'function_call');
      if (calls.length === 0) break;

      input.push(...response.output);
      for (const call of calls) {
        let args = {};
        try {
          args = JSON.parse(call.arguments || '{}');
        } catch {}
        const result = call.name === 'get_order_details' ? getOrderDetails(args.order_id) : { error: 'Unknown tool' };
        toolCalls.push({ name: call.name, arguments: args, result });
        input.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
      }

      response = await openai.responses.create({
        model: MODEL,
        instructions: SYSTEM_INSTRUCTIONS,
        input,
        tools: [ORDER_TOOL],
      });
    }

    const reply = response.output_text?.trim() || "Sorry, I didn't catch that. Could you say it again?";
    return Response.json({ reply, toolCalls });
  } catch (error) {
    console.error('chat error', error);
    return Response.json(
      { reply: "I'm having trouble connecting right now. Please try again in a moment.", error: 'chat_failed' },
      { status: 500 }
    );
  }
}
