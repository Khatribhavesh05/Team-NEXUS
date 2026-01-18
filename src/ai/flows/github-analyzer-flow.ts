'use server';

import { getGitHubData, GitHubRepo, GitHubUser } from '@/services/github-service';
import { 
    ProjectAnalysis,
    AnalyzedRepo,
    AggregatedSkill,
    GitHubAnalysisResult,
    CareerInsights,
} from '@/lib/github-types';


// --- Keyword Definitions for Rule-Based Logic ---

const projectTypeKeywords: { [key: string]: string[] } = {
  Frontend: ['frontend', 'ui', 'user interface', 'website', 'design system', 'css', 'html', 'react', 'vue', 'angular', 'svelte', 'next.js', 'gatsby'],
  Backend: ['backend', 'api', 'server', 'database', 'microservice', 'django', 'flask', 'express', 'spring', 'ruby on rails'],
  'Full Stack': ['full stack', 'full-stack'],
  Mobile: ['mobile', 'android', 'ios', 'swift', 'kotlin', 'react native', 'flutter', 'xamarin'],
  'Game Dev': ['game', 'gamedev', 'unity', 'unreal', 'game engine', 'bevy', 'godot'],
  'Data/ML': ['data science', 'machine learning', 'ai', 'neural network', 'analysis', 'visualization', 'ml', 'deep learning', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch'],
  Systems: ['os', 'kernel', 'compiler', 'embedded', 'systems', 'network', 'blockchain'],
  Tooling: ['cli', 'tool', 'library', 'framework', 'plugin', 'devtool'],
};

const skillDetection: { [key: string]: string[] } = {
  'React': ['react', 'reactjs'],
  'Next.js': ['nextjs', 'next.js'],
  'Vue.js': ['vue', 'vuejs'],
  'Angular': ['angular'],
  'Svelte': ['svelte'],
  'Node.js': ['node.js', 'nodejs'],
  'Express': ['express', 'express.js'],
  'Django': ['django'],
  'Flask': ['flask'],
  'Spring Boot': ['spring boot'],
  'Docker': ['docker'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'AWS': ['aws', 'amazon web services'],
  'Azure': ['azure'],
  'Google Cloud': ['gcp', 'google cloud'],
  'SQL': ['sql'],
  'NoSQL': ['nosql', 'mongodb', 'firestore', 'dynamodb'],
  'GraphQL': ['graphql'],
  'Jest': ['jest'],
  'Testing Library': ['testing library', 'rtl'],
  'Webpack': ['webpack'],
  'Vite': ['vite'],
};

// --- Helper Functions for Analysis ---

function analyzeText(text: string | null): string[] {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const foundSkills: string[] = [];
  for (const [skill, keywords] of Object.entries(skillDetection)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      foundSkills.push(skill);
    }
  }
  return foundSkills;
}

function determineProjectType(repo: GitHubRepo): string {
  const searchText = `${repo.name.toLowerCase()} ${repo.description?.toLowerCase() || ''}`;
  const language = repo.language?.toLowerCase() || '';

  const scores: { [key: string]: number } = {};

  for (const [type, keywords] of Object.entries(projectTypeKeywords)) {
    scores[type] = 0;
    if (keywords.some(kw => searchText.includes(kw))) {
      scores[type] += 2;
    }
  }

  if (language.includes('javascript') || language.includes('typescript') || language.includes('html') || language.includes('css')) scores['Frontend'] = (scores['Frontend'] || 0) + 1;
  if (language.includes('python') || language.includes('java') || language.includes('go') || language.includes('ruby') || language.includes('php') || language.includes('c#')) scores['Backend'] = (scores['Backend'] || 0) + 1;
  if (language.includes('jupyter')) scores['Data/ML'] = (scores['Data/ML'] || 0) + 2;

  const highestScore = Math.max(...Object.values(scores));
  if (highestScore > 0) {
    const bestMatch = Object.keys(scores).find(key => scores[key] === highestScore);
    return bestMatch || 'General';
  }

  return 'General';
}

function determineExperienceLevel(repo: GitHubRepo, skills: string[]): 'Beginner' | 'Intermediate' | 'Advanced' {
  let score = 0;
  if (repo.stargazers_count > 50) score += 2;
  else if (repo.stargazers_count > 10) score += 1;

  if (skills.length > 3) score += 2;
  else if (skills.length > 1) score += 1;

  if (repo.description && repo.description.length > 100) score += 1;
  if (!repo.description || repo.description.length < 20) score -= 1;

  if (score >= 4) return 'Advanced';
  if (score >= 2) return 'Intermediate';
  return 'Beginner';
}


function generateStrengths(repo: GitHubRepo, analysis: Omit<ProjectAnalysis, 'strengths'>): string[] {
    const strengths: string[] = [];
    if (repo.language) {
        strengths.push(`Demonstrates proficiency in ${repo.language}.`);
    }
    const majorSkills = analysis.primarySkills.filter(s => s !== repo.language);
    if (majorSkills.length > 0) {
        strengths.push(`Applies key technologies like ${majorSkills.join(', ')}.`);
    }
    if (repo.stargazers_count > 20) {
        strengths.push(`Project has gained some community traction with ${repo.stargazers_count} stars.`);
    }
    if (repo.description && repo.description.length > 50) {
        strengths.push("Includes a clear project description.");
    }
    return strengths.slice(0, 3);
}

function generateSuggestions(repo: GitHubRepo): string[] {
    const suggestions: string[] = [];
     if (!repo.description || repo.description.length < 50) {
        suggestions.push("Consider adding a more detailed description or a README to explain the project's purpose, setup, and usage.");
    }
    suggestions.push("Add a link to a live demo (if applicable) to showcase the project in action.");
    suggestions.push("Incorporate unit or integration tests to ensure code quality and long-term maintainability.");
    
    return suggestions;
}


// --- Individual Repo Analysis Function ---

function performRuleBasedAnalysis(repo: GitHubRepo): ProjectAnalysis {
  const allSkills = new Set<string>();
  if (repo.language) {
    allSkills.add(repo.language);
  }
  Object.keys(repo.languages || {}).forEach(lang => allSkills.add(lang));
  analyzeText(`${repo.name} ${repo.description}`).forEach(skill => allSkills.add(skill));

  const primarySkills = [repo.language, ...analyzeText(repo.description)].filter(Boolean) as string[];
  const supportingSkills = Array.from(allSkills).filter(s => !primarySkills.includes(s));

  const analysis: Omit<ProjectAnalysis, 'strengths' | 'improvementSuggestions'> = {
    projectType: determineProjectType(repo),
    primarySkills: [...new Set(primarySkills)],
    supportingSkills: [...new Set(supportingSkills)],
    experienceLevel: determineExperienceLevel(repo, Array.from(allSkills)),
  };

  const strengths = generateStrengths(repo, analysis);
  const improvementSuggestions = generateSuggestions(repo);

  return { ...analysis, strengths, improvementSuggestions };
}


function aggregateAndRankSkills(repos: GitHubRepo[]): AggregatedSkill[] {
  const skillStats: { [key: string]: { repoCount: number; frequency: number; recency: number[] } } = {};
  const now = new Date().getTime();

  repos.forEach(repo => {
    const repoTimestamp = new Date(repo.pushed_at).getTime();
    const daysSincePush = (now - repoTimestamp) / (1000 * 3600 * 24);

    const skillsInRepo = new Set<string>();
    if (repo.language) {
      skillsInRepo.add(repo.language);
    }
    Object.keys(repo.languages).forEach(lang => skillsInRepo.add(lang));

    skillsInRepo.forEach(skill => {
      if (!skillStats[skill]) {
        skillStats[skill] = { repoCount: 0, frequency: 0, recency: [] };
      }
      skillStats[skill].repoCount += 1;
      skillStats[skill].frequency += repo.languages[skill] || 0;
      skillStats[skill].recency.push(daysSincePush);
    });
  });

  const rankedSkills = Object.entries(skillStats).map(([name, stats]) => {
    const avgRecency = stats.recency.reduce((a, b) => a + b, 0) / stats.recency.length;
    let level: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';

    if ((stats.repoCount >= 3 && stats.frequency > 50000) || avgRecency < 90) {
      level = 'Advanced';
    } else if (stats.repoCount >= 2 || stats.frequency > 10000) {
      level = 'Intermediate';
    }
    
    return {
      name,
      level,
      repoCount: stats.repoCount,
      frequency: stats.frequency,
      recency: avgRecency,
    };
  });

  return rankedSkills.sort((a, b) => b.frequency - a.frequency);
}


// --- Career Intelligence Layer ---

function generateCareerInsights(
    profile: GitHubUser,
    analyzedRepos: AnalyzedRepo[],
    aggregatedSkills: AggregatedSkill[]
): CareerInsights {
    let score = 0;
    const strengths: string[] = [];
    const gaps: string[] = [];
    const nextActions: string[] = [];

    if (analyzedRepos.length === 0) {
        return {
            experienceLevel: 'Beginner',
            primaryRole: 'Generalist',
            strengths: [],
            gaps: ['No public repositories found to analyze.'],
            nextActions: ['Create a public repository on GitHub to showcase your skills.'],
            careerReadinessScore: 0,
        };
    }

    // 1. Determine Overall Experience Level
    const advancedReposCount = analyzedRepos.filter(r => r.analysis.experienceLevel === 'Advanced').length;
    const intermediateReposCount = analyzedRepos.filter(r => r.analysis.experienceLevel === 'Intermediate').length;
    let experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';

    if (advancedReposCount >= 2 || (advancedReposCount >= 1 && intermediateReposCount >= 2)) {
        experienceLevel = 'Advanced';
        score += 40;
    } else if (intermediateReposCount >= 2 || advancedReposCount >= 1 || analyzedRepos.length >= 5) {
        experienceLevel = 'Intermediate';
        score += 20;
    } else {
        experienceLevel = 'Beginner';
        score += 5;
    }

    // 2. Determine Primary Role
    const roleCounts: { [key: string]: number } = {};
    analyzedRepos.forEach(repo => {
        const type = repo.analysis.projectType;
        if (type !== 'General') {
            roleCounts[type] = (roleCounts[type] || 0) + 1;
        }
    });
    let primaryRole = 'Generalist';
    if (Object.keys(roleCounts).length > 0) {
        primaryRole = Object.keys(roleCounts).reduce((a, b) => (roleCounts[a] > roleCounts[b] ? a : b));
    }
     if (roleCounts['Frontend'] > 0 && roleCounts['Backend'] > 0) {
        primaryRole = 'Full Stack';
    }

    // 3. Analyze Strengths and Gaps
    const totalRepos = analyzedRepos.length;
    const avgStars = analyzedRepos.reduce((sum, repo) => sum + repo.stars, 0) / totalRepos;
    if (avgStars > 10 || profile.followers > 50) {
        score += 15;
        strengths.push('Building a community presence with starred projects and followers.');
    }

    const reposWithGoodDesc = analyzedRepos.filter(r => r.description && r.description.length > 50).length;
    if (reposWithGoodDesc / totalRepos > 0.7) {
        score += 15;
        strengths.push('Writes clear and effective project descriptions.');
    } else {
        gaps.push('Many projects lack a detailed README or description.');
        nextActions.push('Improve project descriptions and add detailed README.md files.');
    }

    const advancedSkillsCount = aggregatedSkills.filter(s => s.level === 'Advanced').length;
    if (advancedSkillsCount > 1) {
        score += 15;
        const topSkills = aggregatedSkills.filter(s => s.level === 'Advanced').slice(0, 2).map(s => s.name);
        strengths.push(`Demonstrates deep expertise in key technologies like ${topSkills.join(' and ')}.`);
    }

    const recentPushes = analyzedRepos.filter(r => new Date(r.pushed_at).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000).length;
    if (recentPushes / totalRepos > 0.5) {
        score += 10;
        strengths.push('Maintains consistent and recent activity on projects.');
    } else {
        gaps.push('Project activity has been low in the last 3 months.');
        nextActions.push('Contribute to a project or start a new one to show recent activity.');
    }

    // Weak check for testing - can be improved if file structure is available
    const testKeywords = ['test', 'spec', 'jest', 'mocha', 'chai', 'pytest', 'junit'];
    const reposWithTests = analyzedRepos.filter(r => 
        testKeywords.some(kw => (r.description || '').toLowerCase().includes(kw))
    ).length;

    if (reposWithTests / totalRepos < 0.2) {
        gaps.push('Lacks demonstrated testing practices in projects.');
        nextActions.push('Incorporate a testing framework (like Jest or Pytest) into a key project.');
    } else {
        score += 5;
        strengths.push('Includes testing in some projects, showing a commitment to code quality.');
    }
    
    if (gaps.length === 0) {
      gaps.push("Profile is strong, consider contributing to open source to further stand out.");
      nextActions.push("Find an open-source project aligned with your skills and make a contribution.");
    }


    const careerReadinessScore = Math.min(100, Math.max(0, Math.round(score)));

    return {
        experienceLevel,
        primaryRole,
        strengths,
        gaps,
        nextActions,
        careerReadinessScore,
    };
}


// This is the main function that will be called from the UI
export async function syncAndAnalyzeGitHub({ githubUsername }: { githubUsername: string }): Promise<GitHubAnalysisResult> {
  // 1. Fetch data from GitHub API
  const githubData = await getGitHubData(githubUsername);

  // 2. Process and analyze each repo
  const analyzedRepos: AnalyzedRepo[] = githubData.repos.map(repo => ({
    id: repo.id,
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    url: repo.html_url,
    pushed_at: repo.pushed_at,
    languages: repo.languages,
    analysis: performRuleBasedAnalysis(repo),
  }));
  
  // 3. Aggregate skills from all repos
  const aggregatedSkills = aggregateAndRankSkills(githubData.repos);
  
  // 4. Generate overall career insights
  const careerInsights = generateCareerInsights(githubData.profile, analyzedRepos, aggregatedSkills);

  // 5. Return the combined result
  const analysisResult: GitHubAnalysisResult = {
    profile: githubData.profile,
    analyzedRepos: analyzedRepos,
    aggregatedSkills: aggregatedSkills,
    careerInsights: careerInsights,
  };

  return analysisResult;
}
