export const SITE_URL = 'https://sam-laister.com';

export const profile = {
  name: 'Sam Laister',
  /** Used for the homepage meta description */
  description: 'Software developer in Bristol, building internal systems at Wren Kitchens.',
  links: [
    { label: 'GitHub', href: 'https://github.com/sam-laister' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sam-laister/' },
  ],
};

/** "Things I’ve made" on the homepage */
export const projects = [
  { name: 'Model Maker', description: 'Turns a set of phone photos into a textured 3D model. It started as my dissertation.' },
  { name: 'OpenMVGO', description: 'The photogrammetry pipeline behind it, written in Go and shipped as a Docker CLI.' },
  { name: 'Cerebrally', description: 'A revision app where you teach a topic out loud and get quizzed on it in 60-second rounds.' },
  { name: 'LAN meetups', description: 'A hackathon build for organising LAN parties, made with Next.js, Clerk and Neon.' },
];
