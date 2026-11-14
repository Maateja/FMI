export type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking';

export type InterviewRound = 'warmup' | 'hr' | 'technical' | 'closing';

export type InterviewStatus =
  | 'setup'
  | 'warmup'
  | 'hr'
  | 'technical'
  | 'closing'
  | 'processing'
  | 'completed'
  | 'abandoned'
  | 'error';

export type DifficultyLevel = 'fresher' | 'junior' | 'intermediate' | 'senior';

export type QuestionDomain = 'hr' | 'frontend' | 'backend' | 'data_ml' | 'general_communication';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  targetRole: string;
  targetExperienceLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleRecord {
  id: string;
  userId: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface QuestionBankItem {
  id: string;
  domain: QuestionDomain;
  difficulty: DifficultyLevel;
  category: string;
  questionText: string;
  expectedKeyPoints: string[];
  probingFollowUps: string[];
  modelAnswer?: string;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TurnMetrics {
  wordsCount?: number;
  wpm?: number;
  fillersCount?: number;
  pauseCount?: number;
  longestPauseSeconds?: number;
}

export interface InterviewTurn {
  id: string;
  interviewId: string;
  questionId?: string;
  turnNumber: number;
  round: InterviewRound;
  interviewerQuestion: string;
  userTranscript?: string;
  wordTimestamps: WordTimestamp[];
  durationSeconds: number;
  turnMetrics: TurnMetrics;
  createdAt: string;
}

export interface BodyMetricSnapshot {
  timestampOffsetSeconds: number;
  eyeContactScore: number;
  headPoseStability: number;
  postureScore: number;
  expressivenessScore: number;
}

export interface SpeechAnalytics {
  wpm: number;
  fillerRate: number;
  fillerWordsFound: Record<string, number>;
  pauseCount: number;
  longestPauseSeconds: number;
  talkTimeRatio: number;
  averageAnswerLengthSeconds: number;
}

export interface BodyAnalytics {
  avgEyeContact: number;
  avgPosture: number;
  headPoseStability: number;
  expressiveness: number;
}

export interface PerQuestionScore {
  questionNumber: number;
  questionText: string;
  userAnswerSummary: string;
  relevanceScore: number;
  technicalAccuracyScore: number;
  depthScore: number;
  clarityScore: number;
  structureScore: number;
  missedConcepts: string[];
  strengths: string[];
  weaknesses: string[];
  modelAnswer: string;
}

export interface InterviewReport {
  id: string;
  interviewId: string;
  userId: string;
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  bodyLanguageScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  speechAnalytics: SpeechAnalytics;
  bodyAnalytics: BodyAnalytics;
  perQuestionFeedback: PerQuestionScore[];
  pdfUrl?: string;
  createdAt: string;
}

export interface CuratedResource {
  id: string;
  title: string;
  description: string;
  url: string;
  resourceType: 'article' | 'video' | 'documentation' | 'practice';
  skillGapTag: string;
  domain: QuestionDomain;
}

export interface UserConsents {
  microphoneConsent: boolean;
  cameraConsent: boolean;
  audioRecordingConsent: boolean;
  aiTrainingNoticeAcknowledged: boolean;
}

export interface LiveKitTokenResponse {
  token: string;
  serverUrl: string;
  roomName: string;
  participantName: string;
}

