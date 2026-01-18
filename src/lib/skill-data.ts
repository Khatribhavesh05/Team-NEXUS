// Predefined skill categories and role requirements
export const skillTaxonomy: Record<string, string> = {
    'html': 'frontend',
    'css': 'frontend',
    'javascript': 'frontend',
    'react': 'frontend',
    'next.js': 'frontend',
    'vue': 'frontend',
    'angular': 'frontend',
    'node.js': 'backend',
    'express': 'backend',
    'python': 'backend',
    'django': 'backend',
    'java': 'backend',
    'sql': 'backend',
    'mongodb': 'backend',
    'data structures': 'csFundamentals',
    'algorithms': 'csFundamentals',
    'git': 'tools',
    'docker': 'tools',
    'npm': 'tools',
    'yarn': 'tools',
    'jest': 'tools',
    'rtl': 'tools',
};

export const roleRequirements: Record<string, { strong: string[], optional: string[] }> = {
    'frontend developer': {
        strong: ['html', 'css', 'javascript', 'react', 'git'],
        optional: ['typescript', 'next.js', 'jest', 'rtl', 'npm', 'yarn'],
    },
    // Can add more templates for other roles like 'backend developer', etc.
};
