import { CATEGORIES, type Category } from '../lib/posts';

export default function CategoryBadge({ category }: { category: Category }) {
  const c = CATEGORIES[category];
  return (
    <span className="badge" style={{ '--c': c.color } as React.CSSProperties}>
      <span className="badge-dot" aria-hidden="true" />
      {c.label}
    </span>
  );
}
