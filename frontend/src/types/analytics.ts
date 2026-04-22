export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyTrendPoint {
  paper: string;
  easy: number;
  medium: number;
  hard: number;
}

export interface TopicDistributionItem {
  topic: string;
  count: number;
  percentage: number;
}

export interface UnitDistributionItem {
  unit: string;
  unitNumber: number;
  count: number;
  percentage: number;
}

export interface DifficultyDistributionItem {
  difficulty: Difficulty;
  count: number;
  percentage: number;
}

export interface RepeatedQuestion {
  id: string;
  question: string;
  topic: string;
  unit: number;
  difficulty: Difficulty;
  occurrences: number;
  subjectId: string;
}

export interface AnalyticsSummary {
  total_questions?: number;
  easy?: number;
  medium?: number;
  hard?: number;
  totalQuestions: number;
  totalMaterials: number;
  mostRepeatedTopic: string;
  avgDifficulty: Difficulty;
  predictionConfidence: number;
}
