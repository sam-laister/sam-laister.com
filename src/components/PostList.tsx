import { Link } from 'react-router';
import { formatDate, type Post } from '../lib/posts';
import CategoryBadge from './CategoryBadge';
import Highlight from './Highlight';

export default function PostList({ posts, terms = [] }: { posts: Post[]; terms?: string[] }) {
  return (
    <ul className="post-list">
      {posts.map(post => (
        <li key={post.slug}>
          <Link to={`/blog/${post.slug}`} className="post-item">
            <div className="post-item-meta">
              <time dateTime={post.date}>{formatDate(post.date, 'short')}</time>
              <CategoryBadge category={post.category} />
              {post.draft && <span className="draft">draft</span>}
            </div>
            <h3><Highlight text={post.title} terms={terms} /></h3>
            <p><Highlight text={post.summary} terms={terms} /></p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
