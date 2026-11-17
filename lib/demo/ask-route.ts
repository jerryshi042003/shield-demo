import 'server-only';
import { NextResponse } from 'next/server';
import { ReportUnavailable } from '@/lib/server/databricks';
import {
  demoGenieStatus,
  readDemoQuestion,
  startDemoQuestion,
  type DemoGenieReport
} from '@/lib/demo/genie';

const headers = { 'Cache-Control': 'private, no-store' };

/**
 * Shared POST/GET handlers for the scripted Ask routes. They keep the
 * production request contract (question body, status probe, ticket polling)
 * so the unchanged Ask UI drives them exactly as it drove Genie.
 */
export async function askPost(request: Request, report: DemoGenieReport, month = '') {
  let question = '';
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 4096) throw new Error();
    const body = JSON.parse(raw) as Record<string, unknown>;
    question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question || question.length > 800 || Object.keys(body).some((key) => key !== 'question'))
      throw new Error();
  } catch {
    return NextResponse.json(
      { error: 'Enter one question of 1–800 characters.' },
      { status: 400, headers }
    );
  }
  return NextResponse.json(startDemoQuestion(report, question, month), { headers });
}

export async function askGet(request: Request, report: DemoGenieReport, month = '') {
  const params = new URL(request.url).searchParams;
  params.delete('month');
  if (params.get('status') === 'true' && params.size === 1)
    return NextResponse.json(demoGenieStatus(), { headers });
  if (params.size !== 1 || !params.get('ticket'))
    return NextResponse.json({ error: 'Missing conversation ticket.' }, { status: 400, headers });
  try {
    return NextResponse.json(readDemoQuestion(report, params.get('ticket')!, month), { headers });
  } catch (error) {
    const reason = error instanceof ReportUnavailable ? error.reason : 'source_request_failed';
    return NextResponse.json(
      { error: 'This demo answer is unavailable.', reason },
      { status: reason === 'conversation_not_owned' ? 404 : 503, headers }
    );
  }
}
