import { Link } from 'react-router';
import { education, experience, profile, projects, toolbox } from '../data/profile';
import { posts } from '../lib/posts';
import PostList from '../components/PostList';

export default function Home() {
  const latest = posts.slice(0, 3);
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">
          <span className="status-dot" aria-hidden="true" />
          {profile.role} · {profile.location}
        </p>
        <h1>Hi, I’m Sam.</h1>
        <p className="lede">{profile.intro}</p>
        <div className="hero-links">
          <Link to="/blog/" className="button">Read the blog →</Link>
          {profile.links.map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="button ghost">{l.label} ↗</a>
          ))}
        </div>
      </section>

      <section aria-labelledby="about">
        <h2 id="about" className="label">About</h2>
        {profile.about.map(p => <p key={p} className="prose-text">{p}</p>)}
      </section>

      <section aria-labelledby="writing">
        <div className="section-head">
          <h2 id="writing" className="label">Latest writing</h2>
          {latest.length > 0 && <Link to="/blog/" className="more">All posts →</Link>}
        </div>
        {latest.length ? <PostList posts={latest} /> : <p className="muted">First post coming soon.</p>}
      </section>

      <section aria-labelledby="experience">
        <h2 id="experience" className="label">Experience</h2>
        <ol className="timeline">
          {experience.map(job => (
            <li key={job.company} className="timeline-item">
              <p className="timeline-date">{job.start} — {job.end}</p>
              <div>
                <h3>{job.role} <span className="at">· {job.company}</span></h3>
                <ul className="points">
                  {job.points.map(p => <li key={p}>{p}</li>)}
                </ul>
                <ul className="pills" aria-label="Technologies">
                  {job.tech.map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="projects">
        <div className="section-head">
          <h2 id="projects" className="label">Projects</h2>
          <a href="https://github.com/sam-laister" target="_blank" rel="noreferrer" className="more">GitHub ↗</a>
        </div>
        <div className="cards">
          {projects.map(p => (
            <article key={p.name} className="card">
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <ul className="pills" aria-label="Technologies">
                {p.tech.map(t => <li key={t}>{t}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="education">
        <h2 id="education" className="label">Education</h2>
        <ol className="timeline">
          {education.map(e => (
            <li key={e.place} className="timeline-item">
              <p className="timeline-date">{e.start} — {e.end}</p>
              <div>
                <h3>{e.place}</h3>
                <p className="muted">{e.detail}</p>
                {e.note && <p className="muted small">{e.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="toolbox">
        <h2 id="toolbox" className="label">Toolbox</h2>
        <ul className="pills large">
          {toolbox.map(t => <li key={t}>{t}</li>)}
        </ul>
      </section>
    </div>
  );
}
