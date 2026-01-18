'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generateRuleBasedRoadmap } from '@/lib/roadmap-generator';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Bot, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function RoadmapPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading } = useDoc(userDocRef);

  const handleGenerateRoadmap = async () => {
    if (!userProfile || !userDocRef) {
      toast({ variant: "destructive", title: "Error", description: "User profile not found." });
      return;
    }
    if (!userProfile.targetRole) {
       toast({ variant: "destructive", title: "Missing Information", description: "Please set your target role in your profile before generating a roadmap." });
       return;
    }
    setIsGenerating(true);
    try {
      const result = generateRuleBasedRoadmap(userProfile.targetRole, userProfile.skills || []);
      await updateDoc(userDocRef, {
        categorizedSkills: result.categorizedSkills,
        skillGaps: result.skillGaps,
        roadmap: result.roadmap,
        roadmapProgress: 'In Progress'
      });
      toast({ title: "Roadmap Generated!", description: "Your personalized career roadmap is ready." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Generation Failed", description: error.message || "Could not generate roadmap." });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const hasRoadmap = !isLoading && userProfile?.roadmap && userProfile.roadmap.length > 0;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl">Your Career Roadmap</CardTitle>
                <CardDescription>
                    {hasRoadmap 
                        ? `Your personalized path to becoming a ${userProfile.targetRole}.`
                        : "Generate a step-by-step plan based on your skills and career goals."
                    }
                </CardDescription>
            </div>
            {hasRoadmap && (
                <Button onClick={handleGenerateRoadmap} disabled={isGenerating} variant="outline">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                    Regenerate
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="space-y-4 pt-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        ) : hasRoadmap ? (
            <motion.div
              className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-border/70"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
                {userProfile.roadmap.map((phase: any, index: number) => (
                    <motion.div key={index} variants={itemVariants} className="relative pl-16">
                        <div className={cn("absolute left-0 top-0 h-10 w-10 rounded-full flex items-center justify-center z-10 text-white", phase.status === 'Completed' ? 'bg-green-500' : 'bg-primary')}>
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="pl-4">
                          <h3 className="text-xl font-semibold">{phase.phase}: {phase.title}</h3>
                          <p className="text-muted-foreground mb-4">{phase.status}</p>
                          <ul className="space-y-3">
                            {phase.steps.map((step: any, stepIndex: number) => (
                               <li key={stepIndex} className="flex items-start gap-3 p-3 rounded-md bg-white/50 border">
                                    {step.status === 'Completed' ? (
                                       <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                   ) : (
                                       <div className="h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                                           <div className="h-2 w-2 rounded-full bg-primary" />
                                       </div>
                                   )}
                                   <div>
                                       <span className={cn("font-medium", step.status === 'Completed' && 'line-through text-muted-foreground')}>
                                           {step.title}
                                       </span>
                                       <p className={cn("text-sm text-muted-foreground", step.status === 'Completed' && 'line-through')}>{step.description}</p>
                                   </div>
                               </li>
                            ))}
                          </ul>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-white/50">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Ready to build your path?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Set your career goal in your profile, then generate your roadmap.</p>
            <Button className="mt-6" onClick={handleGenerateRoadmap} disabled={isGenerating}>
              {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Zap className="mr-2 h-4 w-4" /> Generate My Roadmap</>}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
