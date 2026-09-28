import { Link, useParams } from 'react-router';
import { formatDate, getPost, posts } from '../lib/posts';
import CategoryBadge from '../components/CategoryBadge';
import NotFound from './NotFound';

export default function PostPage() {
  const { slug = '' } = useParams();
  const post = getPost(slug);
  if (!post) return <NotFound />;

  // posts are newest first, so "newer" is the one before
  const i = posts.indexOf(post);
  const newer = posts[i - 1], older = posts[i + 1];

  return (
    <article className="page post">
      <Link to="/blog" className="back">← All posts</Link>
      <header className="post-head">
        <div className="post-meta">
          <CategoryBadge category={post.category} />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>{post.readingTime} min read</span>
          {post.draft && <span className="draft">draft</span>}
        </div>
        <h1>{post.title}</h1>
        <p className="lede">{post.summary}</p>
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />

      {post.tags.length > 0 && (
        <ul className="pills tags" aria-label="Tags">
          {post.tags.map(t => (
            <li key={t}><Link to={`/blog?tag=${encodeURIComponent(t)}`}>#{t}</Link></li>
          ))}
        </ul>
      )}

      <nav className="post-nav" aria-label="More posts">
        {older ? (
          <Link to={`/blog/${older.slug}`}>
            <span className="label">← Older</span>
            {older.title}
          </Link>
        ) : <span />}
        {newer && (
          <Link to={`/blog/${newer.slug}`} className="right">
            <span className="label">Newer →</span>
            {newer.title}
          </Link>
        )}
      </nav>
    </article>
  );
}
