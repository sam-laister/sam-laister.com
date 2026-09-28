import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="page not-found">
      <p className="label">404</p>
      <h1>Nothing here.</h1>
      <p className="lede">That page doesn’t exist, or it moved.</p>
      <div className="hero-links">
        <Link to="/" className="button">Home</Link>
        <Link to="/blog/" className="button ghost">Blog</Link>
      </div>
    </div>
  );
}
