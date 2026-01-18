'use server';

// A simple, unauthenticated GitHub API client.
// NOTE: This has very low rate limits. For a production app, you'd use a token.

export interface GitHubRepo {
    id: number;
    name: string;
    description: string;
    language: string;
    stargazers_count: number;
    forks_count: number;
    html_url: string; 
    pushed_at: string;
    languages: Record<string, number>;
    fork: boolean;
}

export interface GitHubUser {
    name: string;
    bio: string;
    followers: number;
    public_repos: number;
    avatar_url: string;
    html_url: string;
}

export interface GitHubData {
    profile: GitHubUser;
    repos: GitHubRepo[];
}

const GITHUB_API_BASE = "https://api.github.com";

async function fetchGitHub(endpoint: string) {
    const res = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 } 
    });

    if (!res.ok) {
        if (res.status === 404) {
            throw new Error(`GitHub user not found.`);
        }
        const errorBody = await res.json();
        throw new Error(`GitHub API Error: ${errorBody.message || 'Failed to fetch data'}`);
    }
    return res.json();
}

export async function getGitHubData(username: string): Promise<GitHubData> {
    const [profile, reposUntyped] = await Promise.all([
        fetchGitHub(`/users/${username}`) as Promise<GitHubUser>,
        fetchGitHub(`/users/${username}/repos?type=owner&sort=pushed&per_page=100`) as Promise<any[]>
    ]);

    // Filter out forked repositories
    const repos = (reposUntyped as GitHubRepo[]).filter(repo => !repo.fork);

    const languagePromises = repos.map(repo => 
        fetchGitHub(`/repos/${username}/${repo.name}/languages`).catch(() => ({})) as Promise<Record<string, number>>
    );
    const repoLanguagesArray = await Promise.all(languagePromises);

    repos.forEach((repo, index) => {
        repo.languages = repoLanguagesArray[index] || {};
    });

    return {
        profile,
        repos,
    };
}
