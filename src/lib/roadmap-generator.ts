import { skillTaxonomy, roleRequirements } from './skill-data';

export interface RoadmapStep {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Recommended' | 'Completed';
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  steps: RoadmapStep[];
  status: 'In Progress' | 'Completed';
}

export interface SkillAnalysisOutput {
  categorizedSkills: {
    frontend: string[];
    backend: string[];
    csFundamentals: string[];
    tools: string[];
    other: string[];
  };
  skillGaps: {
    strong: string[];
    missing: string[];
    optional: string[];
  };
  roadmap: RoadmapPhase[];
}

// Predefined roadmap templates
const roadmapTemplates: Record<string, Omit<RoadmapPhase, 'status'>[]> = {
  'frontend developer': [
    {
      phase: 'Phase 1',
      title: 'Mastering the Fundamentals',
      steps: [
        { title: 'HTML', description: 'The backbone of all web pages.', priority: 'High' },
        { title: 'CSS', description: 'Essential for styling and visual presentation.', priority: 'High' },
        { title: 'JavaScript', description: 'The core language for web interactivity.', priority: 'High' },
      ],
    },
    {
      phase: 'Phase 2',
      title: 'Core Role Competencies',
      steps: [
        { title: 'React', description: 'A powerful library for building user interfaces.', priority: 'High' },
        { title: 'Git', description: 'Version control is crucial for collaboration.', priority: 'High' },
        { title: 'Package Managers (npm/yarn)', description: 'Manage project dependencies effectively.', priority: 'Medium' },
      ],
    },
    {
      phase: 'Phase 3',
      title: 'Advanced & Specialization',
      steps: [
        { title: 'TypeScript', description: 'Adds static typing to JavaScript for larger projects.', priority: 'Medium' },
        { title: 'Next.js', description: 'A popular React framework for production apps.', priority: 'Low' },
        { title: 'Testing (Jest/RTL)', description: 'Ensure your code is reliable and bug-free.', priority: 'Low' },
      ],
    },
  ],
  // Can add more templates for other roles like 'backend developer', etc.
};

export function generateRuleBasedRoadmap(
  targetRole: string,
  currentSkills: string[]
): SkillAnalysisOutput {
    const roleKey = targetRole.toLowerCase();
    const roadmapTemplate = roadmapTemplates[roleKey];
    const requirements = roleRequirements[roleKey];

    if (!roadmapTemplate || !requirements) {
        throw new Error(`Roadmap for "${targetRole}" is not available yet.`);
    }

    // Deep copy to avoid mutating the original template
    const roadmap: RoadmapPhase[] = JSON.parse(JSON.stringify(roadmapTemplate));
    
    const lowerCaseSkills = currentSkills.map(s => s.toLowerCase());

    // Process roadmap to add status based on user's current skills
    roadmap.forEach(phase => {
        let allStepsCompleted = true;
        phase.steps.forEach(step => {
            if (lowerCaseSkills.includes(step.title.toLowerCase())) {
                step.status = 'Completed';
            } else {
                step.status = 'Recommended';
                allStepsCompleted = false;
            }
        });
        phase.status = allStepsCompleted ? 'Completed' : 'In Progress';
    });


    // 1. Categorize Skills
    const categorizedSkills: SkillAnalysisOutput['categorizedSkills'] = {
        frontend: [],
        backend: [],
        csFundamentals: [],
        tools: [],
        other: [],
    };

    const addedSkills = new Set<string>();
    currentSkills.forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        const category = skillTaxonomy[lowerSkill] || 'other';

        if (!addedSkills.has(lowerSkill)) {
           if (category !== 'other') {
                (categorizedSkills as any)[category].push(skill);
            } else {
                categorizedSkills.other.push(skill);
            }
            addedSkills.add(lowerSkill);
        }
    });

    // 2. Perform Skill Gap Analysis
    const skillGaps: SkillAnalysisOutput['skillGaps'] = {
        strong: [],
        missing: [],
        optional: [],
    };

    requirements.strong.forEach(req => {
        if (lowerCaseSkills.includes(req)) {
            skillGaps.strong.push(req);
        } else {
            skillGaps.missing.push(req);
        }
    });

    requirements.optional.forEach(req => {
        if (lowerCaseSkills.includes(req)) {
            skillGaps.optional.push(req);
        }
    });

    // 3. Return the full output including the processed roadmap
    return {
        categorizedSkills,
        skillGaps,
        roadmap: roadmap,
    };
}
