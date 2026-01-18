'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Github, Wand2, Star, Users, Book, CheckCircle, Lightbulb, RefreshCw, AlertTriangle, Target, CheckSquare } from 'lucide-react';
import { syncAndAnalyzeGitHub } from '@/ai/flows/github-analyzer-flow';
import type { AnalyzedRepo, CareerInsights } from '@/lib/github-types';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

export default function GithubAnalyzerPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isUserLoading } = useDoc(userDocRef);
    
    const projectsColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'projects') : null, [firestore, user]);
    const { data: projects, isLoading: areProjectsLoading } = useCollection(projectsColRef);

    const githubProjects = projects?.filter((p: any) => p.source === 'github') as (AnalyzedRepo & { id: string, source: 'github' })[] | undefined;

    const isGithubLinked = userProfile?.authProviders?.includes('github.com');

    const handleAnalyze = useCallback(async (usernameToAnalyze: string, showToast: boolean) => {
        if (!usernameToAnalyze) {
            toast({ variant: 'destructive', title: 'Username required', description: 'Cannot analyze without a GitHub username.' });
            return;
        }

        if (!user || !firestore || !userDocRef) {
            toast({ variant: 'destructive', title: 'Not logged in', description: 'You must be logged in to perform an analysis.' });
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const result = await syncAndAnalyzeGitHub({ githubUsername: usernameToAnalyze });
            
            const batch = writeBatch(firestore);

            // This is a partial update, so we need to construct the object carefully
            const userUpdateData: any = {
                github: {
                    ...(userProfile?.github || {}), // Preserve existing github data
                    username: result.profile.login,
                    avatarUrl: result.profile.avatar_url,
                    profileUrl: result.profile.html_url,
                    publicRepoCount: result.profile.public_repos,
                    followers: result.profile.followers,
                    following: result.profile.following,
                    name: result.profile.name,
                    bio: result.profile.bio,
                    lastSyncedAt: serverTimestamp(),
                    careerInsights: result.careerInsights,
                },
                // Overwrite skills with the latest analysis
                skills: result.aggregatedSkills.map(s => s.name),
            };

            batch.set(userDocRef, userUpdateData, { merge: true });

            const projectsCollectionRef = collection(firestore, 'users', user.uid, 'projects');
            result.analyzedRepos.forEach(repo => {
                const repoDocRef = doc(projectsCollectionRef, `github-${repo.id}`);
                const projectData = {
                    id: `github-${repo.id}`,
                    name: repo.name,
                    description: repo.description,
                    url: repo.url,
                    skills: [...repo.analysis.primarySkills, ...repo.analysis.supportingSkills],
                    stars: repo.stars,
                    pushed_at: repo.pushed_at,
                    analysis: repo.analysis,
                    source: 'github' as const,
                    status: 'Completed',
                };
                batch.set(repoDocRef, projectData, { merge: true });
            });

            await batch.commit();

            if (showToast) {
              toast({ title: 'GitHub Sync Complete', description: `Analyzed and saved profile for ${usernameToAnalyze}.` });
            }
        } catch (error: any) {
            console.error("Analysis failed:", error);
            const friendlyError = error.message.toLowerCase().includes('not found')
                ? `GitHub user "${usernameToAnalyze}" not found. Please check the username.`
                : `An unexpected error occurred: ${error.message}`;
            setError(friendlyError);
        } finally {
            setIsLoading(false);
        }
    }, [user, firestore, userDocRef, toast, userProfile]);

    useEffect(() => {
        const needsSync = isGithubLinked && userProfile?.github?.username && !userProfile.github?.lastSyncedAt;
        
        if (needsSync && !isLoading && !isUserLoading && !autoSyncTriggered) {
            setAutoSyncTriggered(true);
            handleAnalyze(userProfile.github.username, true);
        }
    }, [isGithubLinked, userProfile, isLoading, isUserLoading, autoSyncTriggered, handleAnalyze]);

    const triggerResync = () => {
        if (userProfile?.github?.username) {
            handleAnalyze(userProfile.github.username, true);
        }
    }

    const pageIsLoading = isLoading || isUserLoading || areProjectsLoading;
    const profileData = userProfile?.github;
    const insights: CareerInsights | undefined = profileData?.careerInsights;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Github /> GitHub Profile Analyzer</CardTitle>
                            <CardDescription>
                                {isGithubLinked
                                    ? "Your GitHub profile is automatically analyzed. Re-sync to get the latest data."
                                    : "Connect your GitHub account on the Profile page for automatic analysis."
                                }
                            </CardDescription>
                        </div>
                        {isGithubLinked && (
                             <Button onClick={triggerResync} disabled={isLoading} variant="outline" size="sm">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Re-sync
                            </Button>
                        )}
                    </div>
                </CardHeader>
                {!isGithubLinked && (
                     <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Link your GitHub account in your <Link href="/dashboard/profile" className="underline text-primary">profile settings</Link> to enable this feature.
                        </p>
                    </CardContent>
                )}
            </Card>

            {pageIsLoading && !profileData && (
                <div className="text-center p-10">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">
                        {isGithubLinked ? "Performing initial GitHub analysis..." : "Waiting for GitHub connection..."}
                    </p>
                </div>
            )}
            
            {error && (
                 <Alert variant="destructive">
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {profileData && (
                <div className="space-y-6">
                    {insights && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Wand2 /> Career Insights from GitHub</CardTitle>
                                <CardDescription>An automated analysis of your GitHub profile to identify strengths, gaps, and actionable next steps.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label>Career Readiness Score</Label>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-4xl font-bold">{insights.careerReadinessScore}</span>
                                        <Progress value={insights.careerReadinessScore} className="w-full" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Primary Role Suggestion</Label>
                                        <p className="font-semibold text-lg">{insights.primaryRole}</p>
                                    </div>
                                    <div>
                                        <Label>Estimated Experience Level</Label>
                                        <p className="font-semibold text-lg">{insights.experienceLevel}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Strengths</h4>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            {insights.strengths.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                     <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Gaps &amp; Opportunities</h4>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            {insights.gaps.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-blue-500" /> Recommended Next Actions</h4>
                                    <ul className="space-y-2 mt-2">
                                        {insights.nextActions.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 p-2 rounded-md bg-card-nested border">
                                                <CheckSquare className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                                <span className="text-sm text-foreground">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                             <Avatar className="h-20 w-20">
                                <AvatarImage src={profileData.avatarUrl} alt={profileData.name ?? profileData.username} />
                                <AvatarFallback>{profileData.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <CardTitle>{profileData.name || profileData.username}</CardTitle>
                                <CardDescription>{profileData.bio}</CardDescription>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {profileData.followers} followers</span>
                                    <span className="flex items-center gap-1"><Book className="h-4 w-4" /> {profileData.publicRepoCount} public repos</span>
                                    <Button variant="link" asChild className="p-0 h-auto">
                                        <Link href={profileData.profileUrl} target="_blank" rel="noopener noreferrer">
                                            View on GitHub <Github className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Analyzed Repositories</CardTitle>
                            <CardDescription>Rule-based analysis of your most recently pushed repositories.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {githubProjects && githubProjects.length > 0 ? githubProjects.map(repo => (
                                <div key={repo.id} className="p-4 border rounded-lg bg-card-nested">
                                    <div className="flex justify-between items-start">
                                        <Link href={repo.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{repo.name}</Link>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><Star className="h-4 w-4" /> {repo.stars}</span>
                                            {repo.analysis.primarySkills[0] && <Badge variant="outline">{repo.analysis.primarySkills[0]}</Badge>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{repo.description}</p>
                                    
                                    <Accordion type="single" collapsible className="w-full mt-2">
                                        <AccordionItem value="analysis" className="border-b-0">
                                            <AccordionTrigger className="text-sm py-2 hover:no-underline">View Analysis</AccordionTrigger>
                                            <AccordionContent className="pt-2 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                    <div><span className="font-semibold">Project Type:</span><br /><Badge variant="secondary">{repo.analysis.projectType}</Badge></div>
                                                    <div><span className="font-semibold">Experience Level:</span><br /><Badge variant="secondary">{repo.analysis.experienceLevel}</Badge></div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Primary Skills:</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {repo.analysis.primarySkills.map(skill => <Badge key={skill}>{skill}</Badge>)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Supporting Skills:</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {repo.analysis.supportingSkills.length > 0 ? repo.analysis.supportingSkills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>) : <span className="text-muted-foreground">None detected</span>}
                                                    </div>
                                                </div>
                                                 <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Strengths</h4>
                                                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                                        {repo.analysis.strengths.map((item, i) => <li key={i}>{item}</li>)}
                                                    </ul>
                                                </div>
                                                 <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" /> Improvement Suggestions</h4>
                                                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                                        {repo.analysis.improvementSuggestions.map((item, i) => <li key={i}>{item}</li>)}
                                                    </ul>
                                                </div>

                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center">No repositories have been analyzed yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
