export interface InterviewerCharacter {
  id: 'arjun' | 'rohan' | 'priya' | 'ananya' | 'kavita';
  name: string;
  gender: 'male' | 'female';
  age: number;
  title: string;
  avatar_model: string;
  voice_id_kokoro: string;
  voice_id_edge: string;
  personality_trait: string;
  specialization: string;
  primary_color: string;
  avatar_seed: string;
  bio: string;
}

export const INTERVIEWER_CHARACTERS: Record<string, InterviewerCharacter> = {
  arjun: {
    id: 'arjun',
    name: 'Arjun Mehta',
    gender: 'male',
    age: 28,
    title: 'Senior Backend & Systems Architect',
    avatar_model: '/avatars/arjun.glb',
    voice_id_kokoro: 'am_adam',
    voice_id_edge: 'en-US-GuyNeural',
    personality_trait: 'Analytical, rigorous, systems-focused',
    specialization: 'Backend Architecture, DB Scaling, Distributed Systems',
    primary_color: '#3B82F6',
    avatar_seed: 'arjun_m_28',
    bio: '8+ years designing high-throughput distributed microservices. Digs deep into concurrency, database indexing, and architecture bottlenecks.',
  },
  rohan: {
    id: 'rohan',
    name: 'Rohan Verma',
    gender: 'male',
    age: 24,
    title: 'Frontend Lead & UI Performance Architect',
    avatar_model: '/avatars/rohan.glb',
    voice_id_kokoro: 'am_michael',
    voice_id_edge: 'en-US-ChristopherNeural',
    personality_trait: 'Energetic, practical, code-focused',
    specialization: 'React, TypeScript, Web Vitals, Responsive UX',
    primary_color: '#6366F1',
    avatar_seed: 'rohan_m_24',
    bio: 'Frontend specialist passionate about clean component hierarchies, custom hooks, and squeezing maximum FPS out of web rendering pipelines.',
  },
  priya: {
    id: 'priya',
    name: 'Priya Sharma',
    gender: 'female',
    age: 27,
    title: 'HR Lead & Behavioral Specialist',
    avatar_model: '/avatars/priya.glb',
    voice_id_kokoro: 'af_heart',
    voice_id_edge: 'en-US-JennyNeural',
    personality_trait: 'Warm, empathetic, culture & values-focused',
    specialization: 'Behavioral STAR Method, Conflict Resolution, Team Culture',
    primary_color: '#EC4899',
    avatar_seed: 'priya_f_27',
    bio: 'People partner and campus talent lead. Evaluates candidate resilience, communication clarity, teamwork, and cultural alignment with empathy.',
  },
  ananya: {
    id: 'ananya',
    name: 'Ananya Patel',
    gender: 'female',
    age: 25,
    title: 'Fullstack Cloud & DevOps Engineer',
    avatar_model: '/avatars/ananya.glb',
    voice_id_kokoro: 'af_sarah',
    voice_id_edge: 'en-US-MichelleNeural',
    personality_trait: 'Curious, detail-oriented, pragmatic',
    specialization: 'Cloud Infrastructure, Docker, CI/CD, Fullstack Integration',
    primary_color: '#10B981',
    avatar_seed: 'ananya_f_25',
    bio: 'Fullstack developer turned cloud architect. Focuses on pragmatic implementation: containerization, CI/CD automation, and secure API gateways.',
  },
  kavita: {
    id: 'kavita',
    name: 'Kavita Rao',
    gender: 'female',
    age: 33,
    title: 'Director of Engineering & Bar Raiser',
    avatar_model: '/avatars/kavita.glb',
    voice_id_kokoro: 'af_bella',
    voice_id_edge: 'en-US-AriaNeural',
    personality_trait: 'Strategic, high-bar, encouraging mentor',
    specialization: 'System Design, Tech Leadership, Production Reliability',
    primary_color: '#8B5CF6',
    avatar_seed: 'kavita_f_33',
    bio: '12+ years leading engineering organizations. Assesses technical leadership, strategic decision-making, and fundamental engineering ownership.',
  },
};

export const CHARACTERS_LIST = Object.values(INTERVIEWER_CHARACTERS);
