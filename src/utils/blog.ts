import type { CollectionEntry } from 'astro:content';
import { siteConfig } from '../data/site';

export function sortPosts(posts: CollectionEntry<'blog'>[]) {
  return posts
    .filter(({ data }) => !data.draft)
    .sort(
      (left, right) =>
        right.data.publishDate.getTime() - left.data.publishDate.getTime(),
    );
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    dateStyle: 'long',
  }).format(date);
}
