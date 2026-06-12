import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { RSS_SOURCES } from '@/app/molis-tora/services/rssFeeds';

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Portify.gr Bot 1.0' }
});

export const revalidate = 60;

export async function GET() {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (source) => {
      try {
        const feedParser = source.encoding
          ? new Parser({ timeout: 8000, headers: { 'User-Agent': 'Portify.gr Bot 1.0' }, defaultEncoding: source.encoding })
          : parser;
        const feed = await feedParser.parseURL(source.url);
        const item = feed.items[0];
        if (!item) return null;
        return {
          title: item.title?.trim() || 'Χωρίς τίτλο',
          link: item.link || '#',
          source: source.name,
          pubDate: item.pubDate || item.isoDate || null,
        };
      } catch {
        return null;
      }
    })
  );

  const news = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  return NextResponse.json(news, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
  });
}