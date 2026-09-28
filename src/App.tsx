import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import Blog from './pages/Blog';
import PostPage from './pages/Post';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
