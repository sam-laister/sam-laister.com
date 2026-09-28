export const SITE_URL = 'https://sam-laister.com';

export const profile = {
  name: 'Sam Laister',
  role: 'Full-stack developer',
  location: 'Bristol, UK',
  intro:
    'I build things end-to-end: web and mobile products, backend architecture, cloud infrastructure and the pipelines that ship them.',
  about: [
    'I have five years of commercial experience shipping production web and mobile apps, from the first commit to the first user. These days I work on internal systems at Wren Kitchens, where I also help bring AI tooling into how the team builds software.',
    'I’m particularly interested in AI, computer vision and the tooling that makes engineering teams faster. Outside work that usually means a side project in Go, something self-hosted, or a write-up on this blog.',
  ],
  links: [
    { label: 'GitHub', href: 'https://github.com/sam-laister' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sam-laister/' },
  ],
};

export interface Job {
  company: string;
  role: string;
  start: string;
  end: string;
  points: string[];
  tech: string[];
}

export const experience: Job[] = [
  {
    company: 'Wren Kitchens',
    role: 'Full-Stack Developer',
    start: 'Aug 2025',
    end: 'Present',
    points: [
      'Build and maintain full-stack internal systems with PHP, Symfony (including UX and Live Components), React and MySQL.',
      'Integrate external APIs to extend internal tooling.',
      'Play a leading role in introducing AI tooling into the team’s engineering workflows.',
      'Scope projects with Business Analysts, and unit test what we deliver.',
    ],
    tech: ['PHP', 'Symfony', 'React', 'MySQL'],
  },
  {
    company: 'Everbit Software',
    role: 'Co-Founder & Lead Developer',
    start: 'Jul 2023',
    end: 'Aug 2025',
    points: [
      'Led mobile development, backend maintainability and scaling, and testing strategy.',
      'Launched 3 production mobile apps, building full-stack with Symfony, Go, Svelte 5, Flutter and React Native.',
      'Managed Firebase, Cloudflare and AWS infrastructure.',
    ],
    tech: ['Flutter', 'React Native', 'Go', 'Symfony', 'Svelte', 'AWS'],
  },
  {
    company: 'Wellmatch',
    role: 'Mobile App Developer · Part-time',
    start: 'Jan 2024',
    end: 'Jun 2025',
    points: [
      'Launched the Wellmatch and WellCorp mobile apps, built with Flutter and React Native.',
      'Maintained the Symfony API and managed the company website.',
      'Automated release pipelines for App Store Connect and Google Play Console.',
    ],
    tech: ['Flutter', 'React Native', 'Symfony', 'CI/CD'],
  },
  {
    company: 'Lyke',
    role: 'Junior Developer',
    start: 'Feb 2022',
    end: 'Jun 2023',
    points: [
      'Developed full-stack Symfony applications.',
      'Built and maintained WordPress themes.',
      'Gained system design and architecture experience.',
    ],
    tech: ['PHP', 'Symfony', 'WordPress'],
  },
];

export const projects = [
  {
    name: 'Model Maker',
    description:
      'Full-stack photogrammetry platform: take photos on your phone, get a textured 3D model back. My dissertation, graded 80%.',
    tech: ['Go', 'Flutter', 'OpenMVG', 'OpenMVS', 'Cloud'],
  },
  {
    name: 'OpenMVGO',
    description:
      'A Go photogrammetry suite bundled as a Docker image, with a CLI for generating 3D models and textures from a set of static images.',
    tech: ['Go', 'Docker', 'CLI'],
  },
  {
    name: 'Cerebrally',
    description:
      'AI-assisted audible revision. Record yourself teaching a topic, then get quizzed in 60-second “Blitz” rounds by Gemini using tool calls.',
    tech: ['Go', 'Next.js', 'Gemini'],
  },
  {
    name: 'AWS V0 Hackathon',
    description: 'A LAN-meetup social platform built during a hackathon.',
    tech: ['Next.js', 'Vercel', 'Clerk', 'Neon', 'Sentry'],
  },
];

export const education = [
  {
    place: 'The University of Sheffield',
    detail: 'BSc Computer Science · 2:1 with honours',
    note: 'Dissertation (80%): Model Maker',
    start: '2022',
    end: '2025',
  },
  {
    place: 'Franklin College',
    detail: 'A-levels: Computer Science (A), Maths (B), IT (Distinction)',
    start: '2019',
    end: '2021',
  },
];

export const toolbox = [
  'PHP', 'Symfony', 'API Platform', 'Go', 'TypeScript', 'React', 'Next.js', 'Flutter', 'React Native', 'Svelte',
  'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Google Cloud', 'Cloudflare', 'Docker', 'CI/CD', 'Stripe', 'Self-hosting',
];
