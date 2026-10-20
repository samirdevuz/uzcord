import { describe, expect, it } from 'vitest';
import type { GuildMember } from 'discord.js';
import { pickWinners } from '../src/modules/giveaways';
import { resultBar, tallyVotes } from '../src/modules/polls';
import { formatTranscript, ticketChannelName } from '../src/modules/tickets';
import { formatClock, parseAudioUrl, titleFromUrl } from '../src/modules/music/player';
import { emojiMatches, starIcon } from '../src/modules/starboard';
import { progressBar, renderLevelUp } from '../src/modules/leveling';
import { normalizeTagName, parseMessageReference } from '../src/utils/validation';
import { containsWord, normalize } from '../src/modules/automod/normalize';

describe('giveaway g\'oliblari', () => {
  it('takrorlanmaydi va soni oshmaydi', () => {
    const winners = pickWinners(['a', 'b', 'c', 'd'], 3);
    expect(winners).toHaveLength(3);
    expect(new Set(winners).size).toBe(3);
  });

  it('ishtirokchilar kam bo\'lsa hammasini qaytaradi', () => {
    expect(pickWinners(['a', 'b'], 5).sort()).toEqual(['a', 'b']);
  });

  it('reroll avvalgi g\'oliblarni chiqarib tashlaydi', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(pickWinners(['a', 'b', 'c'], 1, ['a', 'b'])).toEqual(['c']);
    }
    expect(pickWinners(['a'], 1, ['a'])).toEqual([]);
  });

  it('takroriy yozuvlar ehtimolni oshirmaydi', () => {
    expect(pickWinners(['a', 'a', 'a'], 2)).toEqual(['a']);
  });
});

describe('so\'rovnoma natijalari', () => {
  const options = [
    { key: 'opt_1', label: 'Ha' },
    { key: 'opt_2', label: 'Yo\'q' },
  ];

  it('ovoz va foizlarni hisoblaydi', () => {
    const { results, voters } = tallyVotes(options, [
      { option_key: 'opt_1', user_id: 'u1' },
      { option_key: 'opt_1', user_id: 'u2' },
      { option_key: 'opt_2', user_id: 'u3' },
      { option_key: 'opt_1', user_id: 'u3' }, // multi-choice: bitta odam ikki variant
    ]);
    expect(results.map((result) => result.votes)).toEqual([3, 1]);
    expect(results.map((result) => result.percent)).toEqual([75, 25]);
    expect(voters).toBe(3);
  });

  it('ovoz bo\'lmasa nol foiz', () => {
    expect(tallyVotes(options, []).results.every((result) => result.percent === 0)).toBe(true);
  });

  it('chiziq uzunligi doim bir xil', () => {
    expect(resultBar(0)).toHaveLength(14);
    expect(resultBar(100)).toBe('█'.repeat(14));
  });
});

describe('ticketlar', () => {
  it('kanal nomi to\'rt xonali', () => {
    expect(ticketChannelName(7)).toBe('ticket-0007');
    expect(ticketChannelName(12345)).toBe('ticket-12345');
  });

  it('transcript sarlavha, xabarlar va ilovalarni o\'z ichiga oladi', () => {
    const text = formatTranscript(['Server — #1'], [
      { at: new Date('2026-10-20T10:00:00Z'), author: 'ali', content: 'salom', attachments: [] },
      { at: new Date('2026-10-20T10:01:00Z'), author: 'mod', content: '', attachments: ['https://cdn/x.png'] },
    ]);
    expect(text).toContain('Server — #1');
    expect(text).toContain('[2026-10-20 10:00:00 UTC] ali: salom');
    expect(text).toContain('📎 https://cdn/x.png');
  });
});

describe('musiqa havolalari', () => {
  it('ochiq http(s) havolalarni qabul qiladi', () => {
    expect(parseAudioUrl('https://example.com/song.mp3')?.hostname).toBe('example.com');
    expect(parseAudioUrl('http://radio.example.uz:8000/stream')).not.toBeNull();
  });

  it('boshqa protokollar va ichki tarmoqni rad etadi (SSRF)', () => {
    for (const bad of [
      'file:///etc/passwd',
      'ftp://example.com/a.mp3',
      'http://localhost/a.mp3',
      'http://127.0.0.1:8080/a',
      'http://10.0.0.5/a',
      'http://192.168.1.1/a',
      'http://172.20.0.1/a',
      'http://169.254.169.254/latest/meta-data',
      'http://[::1]/a',
      'https://user:pass@example.com/a.mp3',
      'not a url',
    ]) {
      expect(parseAudioUrl(bad), bad).toBeNull();
    }
  });

  it('nomni fayldan yoki domendan oladi', () => {
    expect(titleFromUrl(new URL('https://x.uz/music/Yulduz_Usmonova.mp3'))).toBe('Yulduz Usmonova');
    expect(titleFromUrl(new URL('https://radio.uz/'))).toBe('radio.uz');
  });

  it('vaqtni soat ko\'rinishida chiqaradi', () => {
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(3_725_000)).toBe('1:02:05');
  });
});

describe('starboard', () => {
  it('unicode va maxsus emojini taniydi', () => {
    expect(emojiMatches('⭐', { id: null, name: '⭐' })).toBe(true);
    expect(emojiMatches('⭐', { id: null, name: '🔥' })).toBe(false);
    expect(emojiMatches('<:uz:123456>', { id: '123456', name: 'uz' })).toBe(true);
  });

  it('yulduz darajalari', () => {
    expect(starIcon(3)).toBe('⭐');
    expect(starIcon(12)).toBe('💫');
    expect(starIcon(30)).toBe('✨');
  });
});

describe('leveling', () => {
  it('progress chizig\'i', () => {
    expect(progressBar(50, 10)).toBe('▰▰▰▰▰▱▱▱▱▱');
    expect(progressBar(150, 4)).toBe('▰▰▰▰');
  });

  it('daraja xabaridagi o\'zgaruvchilarni almashtiradi', () => {
    const member = { id: '42', displayName: 'Ali', guild: { name: 'UzCord' } } as unknown as GuildMember;
    expect(renderLevelUp('{user} ({user.name}) {level} @ {server}', member, 5)).toBe('<@42> (Ali) 5 @ UzCord');
  });
});

describe('validatsiya', () => {
  it('tag nomlari', () => {
    expect(normalizeTagName('  Qoidalar ')).toBe('qoidalar');
    expect(normalizeTagName('o_z-bek')).toBe('o_z-bek');
    expect(normalizeTagName('100%')).toBeNull();
    expect(normalizeTagName('a b')).toBeNull();
    expect(normalizeTagName('x'.repeat(33))).toBeNull();
  });

  it('xabar havolasi va ID', () => {
    expect(parseMessageReference('https://discord.com/channels/111111111111111111/222222222222222222/333333333333333333')).toEqual({
      channelId: '222222222222222222',
      messageId: '333333333333333333',
    });
    expect(parseMessageReference('333333333333333333')).toEqual({ channelId: null, messageId: '333333333333333333' });
    expect(parseMessageReference('salom')).toBeNull();
  });
});

describe('AutoMod normalizatsiyasi (landing sahifadagi misollar)', () => {
  it.each(['R3KLAMA', 'р е к л а м а', 'r.e.k.l.a.m.a', 'RЕКЛАМА'])('"%s" ushlanadi', (attempt) => {
    expect(containsWord(normalize(attempt), ['reklama'])).toBe('reklama');
  });
});
