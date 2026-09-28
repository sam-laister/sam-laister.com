import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="page not-found">
      <h1>Nothing here.</h1>
      <p className="lede">
        That page doesn’t exist, or it moved. Try the <Link to="/blog/">writing</Link>, or head back <Link to="/">home</Link>.
      </p>
    </div>
  );
}
