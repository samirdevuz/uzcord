import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Transcriptni .txt fayl sifatida beradi — faqat shu serverni boshqara oladiganlarga. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ guildId: string; ticketId: string }> }
): Promise<NextResponse> {
  const { guildId, ticketId } = await params;
  const session = await getSession();
  if (!session) return new NextResponse('Tizimga kiring', { status: 401 });
  if (!session.guilds.some((guild) => guild.id === guildId)) return new NextResponse('Ruxsat yo‘q', { status: 403 });

  const id = Number.parseInt(ticketId, 10);
  if (!Number.isFinite(id)) return new NextResponse('Topilmadi', { status: 404 });

  const { data } = await db
    .from('tickets')
    .select('ticket_number, transcript')
    .eq('guild_id', guildId)
    .eq('id', id)
    .maybeSingle();
  if (!data?.transcript) return new NextResponse('Topilmadi', { status: 404 });

  return new NextResponse(data.transcript as string, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="ticket-${String(data.ticket_number).padStart(4, '0')}.txt"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
