import OpenAI from 'openai';
import { MODEL } from '@/lib/policy';

export const runtime = 'nodejs';

const openai = new OpenAI();

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    customer_intent: { type: 'string', description: 'Primary reason for the call' },
    order_ids: { type: 'array', items: { type: 'string' } },
    topics: {
      type: 'array',
      items: { type: 'string', enum: ['order_status', 'shipping', 'return', 'refund', 'cancellation', 'cod', 'product', 'out_of_scope', 'other'] },
    },
    resolution_status: { type: 'string', enum: ['resolved', 'unresolved', 'escalated', 'out_of_scope'] },
    actions_taken: { type: 'array', items: { type: 'string' } },
    follow_up_required: { type: 'boolean' },
    customer_sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
    summary: { type: 'string', description: '2–3 sentence summary of the call' },
  },
  required: ['customer_intent', 'order_ids', 'topics', 'resolution_status', 'actions_taken', 'follow_up_required', 'customer_sentiment', 'summary'],
  additionalProperties: false,
};

export async function POST(request) {
  try {
    const { messages = [] } = await request.json();
    const transcript = messages
      .filter((m) => m && m.content)
      .map((m) => `${m.role === 'assistant' ? 'Aria' : 'Customer'}: ${m.content}`)
      .join('\n');

    if (!transcript) {
      return Response.json({ outcome: null, error: 'empty_transcript' }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: MODEL,
      instructions: 'You analyse Aura Skincare customer-support call transcripts and return a structured post-call outcome. Base everything strictly on the transcript.',
      input: transcript,
      text: { format: { type: 'json_schema', name: 'call_outcome', schema: SUMMARY_SCHEMA, strict: true } },
    });

    return Response.json({ outcome: JSON.parse(response.output_text) });
  } catch (error) {
    console.error('summary error', error);
    return Response.json({ outcome: null, error: 'summary_failed' }, { status: 500 });
  }
}
