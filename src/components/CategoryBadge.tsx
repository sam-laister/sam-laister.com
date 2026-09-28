import { CATEGORIES, type Category } from '../lib/posts';

export default function CategoryBadge({ category }: { category: Category }) {
  return <span className="badge">{CATEGORIES[category].label}</span>;
}
