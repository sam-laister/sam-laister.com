import { Link } from 'react-router';
import { profile, projects } from '../data/profile';
import { formatDate, posts } from '../lib/posts';

export default function Home() {
  const [github, linkedin] = profile.links;
  return (
    <div className="page home">
      <h1>{profile.name}</h1>

      <div className="bio">
        <p>
          I’m a software developer in Bristol. I build internal systems at Wren Kitchens, mostly in PHP, Symfony
          and React, and I’ve been helping the team bring AI tools into how we work.
        </p>
        <p>
          Before that I co-founded Everbit Software, where we launched three mobile apps, and spent a year and a half
          building the Wellmatch apps part-time. I started out at Lyke, building Symfony apps and WordPress themes,
          and studied Computer Science at the University of Sheffield.
        </p>
        <p>
          I’m most interested in computer vision and developer tooling. You can find me
          on <a href={github.href}>{github.label}</a> and <a href={linkedin.href}>{linkedin.label}</a>.
        </p>
      </div>

      <section aria-labelledby="writing">
        <h2 id="writing" className="label">Writing</h2>
        {posts.length ? (
          <ul className="entries">
            {posts.slice(0, 5).map(p => (
              <li key={p.slug}>
                <Link to={`/blog/${p.slug}/`}>{p.title}</Link>
                <time dateTime={p.date}>{formatDate(p.date)}</time>
              </li>
            ))}
          </ul>
        ) : <p className="quiet">Nothing published yet.</p>}
        {posts.length > 5 && <p className="quiet"><Link to="/blog/">Everything I’ve written</Link></p>}
      </section>

      <section aria-labelledby="made">
        <h2 id="made" className="label">Things I’ve made</h2>
        <dl className="made">
          {projects.map(p => (
            <div key={p.name}><dt>{p.name}</dt><dd>{p.description}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  );
}
