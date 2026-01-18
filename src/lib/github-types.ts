import { z } from 'zod';

// --- Type Definitions for Rule-Based Analysis ---

export const ProjectAnalysisSchema = z.object({
  projectType: z.string(),
  primarySkills: z.array(z.string()),
  supportingSkills: z.array(z.string()),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  strengths: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
});
export type ProjectAnalysis = z.infer<typeof ProjectAnalysisSchema>;

export const AnalyzedRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  url: z.string(),
  pushed_at: z.string(),
  languages: z.record(z.string(), z.number()),
  analysis: ProjectAnalysisSchema,
});
export type AnalyzedRepo = z.infer<typeof AnalyzedRepoSchema>;

export const AggregatedSkillsSchema = z.object({
    name: z.string(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    repoCount: z.number(),
    frequency: z.number(),
    recency: z.number(),
});
export type AggregatedSkill = z.infer<typeof AggregatedSkillsSchema>;

export const CareerInsightsSchema = z.object({
    experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    primaryRole: z.string(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    nextActions: z.array(z.string()),
    careerReadinessScore: z.number(),
});
export type CareerInsights = z.infer<typeof CareerInsightsSchema>;

export const GitHubAnalysisResultSchema = z.object({
  profile: z.any(), // Using any() because GitHubUser type is complex
  analyzedRepos: z.array(AnalyzedRepoSchema),
  aggregatedSkills: z.array(AggregatedSkillsSchema),
  careerInsights: CareerInsightsSchema,
});
export type GitHubAnalysisResult = z.infer<typeof GitHubAnalysisResultSchema>;
