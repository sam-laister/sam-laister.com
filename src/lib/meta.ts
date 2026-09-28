import { profile } from '../data/profile';
import { getPost } from './posts';

export interface Meta {
  title: string;
  description: string;
  type: 'website' | 'article';
}

/** Page title + description for a path. Used by the prerenderer and on client navigation. */
export function metaFor(pathname: string): Meta {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') {
    return { title: `${profile.name} · ${profile.role}`, description: profile.intro, type: 'website' };
  }
  if (path === '/blog') {
    return {
      title: `Blog · ${profile.name}`,
      description: 'Write-ups, projects and personal posts by Sam Laister.',
      type: 'website',
    };
  }
  const post = path.startsWith('/blog/') && getPost(path.slice('/blog/'.length));
  if (post) return { title: `${post.title} · ${profile.name}`, description: post.summary, type: 'article' };
  return { title: `Not found · ${profile.name}`, description: 'This page doesn’t exist.', type: 'website' };
}
