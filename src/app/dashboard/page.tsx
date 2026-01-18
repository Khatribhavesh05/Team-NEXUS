'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { 
    AlertCircle,
    ArrowRight, 
    Target, 
    Briefcase, 
    CheckCircle, 
    ListTodo, 
    TrendingUp,
    Check,
    Zap
} from "lucide-react";
import { roleRequirements } from '@/lib/skill-data';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const projectsColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'projects') : null, [firestore, user]);

  const { data: userProfile, isLoading: isUserLoading } = useDoc(userDocRef);
  const { data: projects, isLoading: areProjectsLoading } = useCollection(projectsColRef);

  const hasRoadmap = userProfile?.roadmap && userProfile.roadmap.length > 0;

  const metrics = useMemo(() => {
    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter((p: any) => p.status === 'Completed').length || 0;
    const projectsInProgress = projects?.filter((p: any) => p.status === 'In Progress').length || 0;

    let roadmapProgressPercentage = 0;
    let currentRoadmapPhase = "Not Started";
    let phasesCompleted = 0;
    let phasesRemaining = 0;
    
    let totalRequiredSkills = 0;
    let completedRequiredSkills = 0;
    let missingCriticalSkills = 0;
    let careerReadinessPercentage = 0;
    let missingProjects = 0;
    let readinessExplanation = "";

    if (hasRoadmap) {
      const allSteps = userProfile.roadmap.flatMap((phase: any) => phase.steps);
      const completedSteps = allSteps.filter((step: any) => step.status === 'Completed').length;
      const totalSteps = allSteps.length;
      if (totalSteps > 0) roadmapProgressPercentage = Math.round((completedSteps / totalSteps) * 100);
      
      const firstInProgressPhase = userProfile.roadmap.find((phase: any) => phase.status !== 'Completed');
      if(firstInProgressPhase) {
          currentRoadmapPhase = `${firstInProgressPhase.phase}: ${firstInProgressPhase.title}`;
      } else if (userProfile.roadmap.length > 0) {
          currentRoadmapPhase = "All phases completed!";
      }

      phasesCompleted = userProfile.roadmap.filter((phase: any) => phase.status === 'Completed').length;
      phasesRemaining = userProfile.roadmap.length - phasesCompleted;

      const roleKey = userProfile.targetRole?.toLowerCase();
      const requirements = roleKey ? roleRequirements[roleKey] : undefined;

      if (requirements) {
        const baseSkills = new Set(Array.isArray(userProfile.skills) ? userProfile.skills.map((s: string) => s.toLowerCase()) : []);
        const completedProjectSkills = new Set<string>();
        projects?.forEach((p: any) => {
            if (p.status === 'Completed' && Array.isArray(p.skills)) {
                p.skills.forEach((skill: string) => completedProjectSkills.add(skill.toLowerCase()));
            }
        });
        const effectiveSkills = new Set([...baseSkills, ...completedProjectSkills]);
        
        const strongSkillsLearned = requirements.strong.filter(skill => effectiveSkills.has(skill));
        
        completedRequiredSkills = strongSkillsLearned.length;
        totalRequiredSkills = requirements.strong.length;
        missingCriticalSkills = totalRequiredSkills - completedRequiredSkills;
      }
      
      const REQUIRED_PROJECT_COUNT = 3;
      missingProjects = Math.max(0, REQUIRED_PROJECT_COUNT - completedProjects);

      const skillCoverage = totalRequiredSkills > 0 ? (completedRequiredSkills / totalRequiredSkills) : 0;
      const totalPhases = userProfile.roadmap.length;
      const roadmapCoverage = totalPhases > 0 ? (phasesCompleted / totalPhases) : 0;
      const projectCoverage = REQUIRED_PROJECT_COUNT > 0 ? Math.min(1, completedProjects / REQUIRED_PROJECT_COUNT) : 0;
      
      const weightedScore = (skillCoverage * 0.5) + (roadmapCoverage * 0.3) + (projectCoverage * 0.2);
      careerReadinessPercentage = Math.round(weightedScore * 100);

      const readinessFactors = [];
      if (missingCriticalSkills > 0) readinessFactors.push(`${missingCriticalSkills} missing critical skill${missingCriticalSkills > 1 ? 's' : ''}`);
      if (missingProjects > 0) readinessFactors.push(`${missingProjects} more project${missingProjects > 1 ? 's' : ''} needed`);
      
      if (careerReadinessPercentage < 100 && readinessFactors.length === 0) readinessExplanation = "Keep completing your roadmap to reach 100%!";
      else if (readinessFactors.length > 0) readinessExplanation = `Limited by ${readinessFactors.join(' and ')}.`;
      else readinessExplanation = "You've met all readiness requirements!";
    }

    return { totalProjects, completedProjects, projectsInProgress, roadmapProgressPercentage, careerReadinessPercentage, currentRoadmapPhase, totalRequiredSkills, completedRequiredSkills, missingCriticalSkills, phasesCompleted, phasesRemaining, missingProjects, readinessExplanation };
  }, [userProfile, projects, hasRoadmap]);

  const isLoading = isUserLoading || areProjectsLoading;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (isLoading) {
      return (
          <div>
            <Skeleton className="h-9 w-72 mb-8" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
            </div>
          </div>
      )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Welcome, {userProfile?.firstName || user?.email}</h1>
      
      {hasRoadmap && (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div variants={itemVariants}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl">Career Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-y-6 gap-x-6 md:grid-cols-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Target Role</p>
                            <p className="text-2xl font-semibold">{userProfile.targetRole || 'Not Set'}</p>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-help">
                                    <p className="text-sm font-medium text-muted-foreground">Career Readiness</p>
                                    <p className="text-2xl font-semibold">{metrics.careerReadinessPercentage}%</p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{metrics.readinessExplanation}</p></TooltipContent>
                        </Tooltip>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Roadmap Phase</p>
                            <p className="text-lg font-semibold truncate" title={metrics.currentRoadmapPhase}>{metrics.currentRoadmapPhase}</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Target className="h-5 w-5 text-primary"/> Focus Areas & Blockers
                        </CardTitle>
                        <CardDescription>Your key insights to accelerate progress toward your goal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* ... Focus Areas content ... */}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        
        {hasRoadmap ? (
            <motion.div variants={itemVariants}><Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Skills Progress</CardTitle>
                    <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{metrics.completedRequiredSkills} / {metrics.totalRequiredSkills}</div>
                    <p className="text-xs text-muted-foreground pt-1">{metrics.missingCriticalSkills} critical skills remaining</p>
                </CardContent>
            </Card></motion.div>
        ) : (
             <motion.div variants={itemVariants}><Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
                    <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{userProfile?.skills?.length || 0}</div>
                    <p className="text-xs text-muted-foreground pt-1"><Link href="/dashboard/skills" className="hover:underline flex items-center">Manage Skills <ArrowRight className="ml-1 h-3 w-3" /></Link></p>
                </CardContent>
            </Card></motion.div>
        )}

        {hasRoadmap && (
             <motion.div variants={itemVariants}><Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Roadmap Progress</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{metrics.roadmapProgressPercentage}%</div>
                    <p className="text-xs text-muted-foreground pt-1">{metrics.phasesCompleted} of {metrics.phasesCompleted + metrics.phasesRemaining} phases completed</p>
                </CardContent>
            </Card></motion.div>
        )}

        {!hasRoadmap && (
             <motion.div variants={itemVariants}><Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Career Goal</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {userProfile?.targetRole ? <div className="text-2xl font-semibold truncate" title={userProfile.targetRole}>{userProfile.targetRole}</div> : <div className="text-2xl font-semibold">Not set</div>}
                    <p className="text-xs text-muted-foreground pt-1"><Link href="/dashboard/profile" className="hover:underline flex items-center">Update Profile <ArrowRight className="ml-1 h-3 w-3" /></Link></p>
                </CardContent>
            </Card></motion.div>
        )}

        <motion.div variants={itemVariants}><Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground pt-1"><Link href="/dashboard/projects" className="hover:underline flex items-center">View Projects <ArrowRight className="ml-1 h-3 w-3" /></Link></p>
          </CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants}><Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects In Progress</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">{metrics.projectsInProgress}</div>
             <p className="text-xs text-muted-foreground pt-1">&nbsp;</p>
          </CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants}><Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">{metrics.completedProjects}</div>
             <p className="text-xs text-muted-foreground pt-1">{metrics.totalProjects > 0 ? `${Math.round((metrics.completedProjects/metrics.totalProjects)*100)}% complete` : 'No projects yet'}</p>
          </CardContent>
        </Card></motion.div>
        
      </motion.div>

       {!hasRoadmap && !isLoading && (
        <motion.div variants={itemVariants}>
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="h-6 w-6 text-primary" /> Let's build your path</CardTitle>
                    <CardDescription>You haven't generated a roadmap yet. Go to the roadmap page to analyze your skills and create a step-by-step plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard/roadmap">Generate My Roadmap <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
      )}
    </div>
  );
}
