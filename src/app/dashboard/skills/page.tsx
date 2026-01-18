'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Github } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function SkillsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [skillInput, setSkillInput] = useState('');

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isUserLoading } = useDoc<{ skills: string[] }>(userDocRef);
  
  const handleAddSkill = async () => {
    if (!skillInput.trim() || !userDocRef) return;
    const newSkill = skillInput.trim();

    if (userProfile?.skills?.find(s => s.toLowerCase() === newSkill.toLowerCase())) {
      toast({ variant: 'destructive', title: 'Duplicate Skill' });
      return;
    }
    
    try {
      await updateDoc(userDocRef, { skills: arrayUnion(newSkill) });
      setSkillInput('');
      toast({ title: 'Skill Added', description: `"${newSkill}" has been added.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add skill. ' + error.message });
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!userDocRef) return;
    try {
      await updateDoc(userDocRef, { skills: arrayRemove(skillToRemove) });
      toast({ title: 'Skill Removed' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove skill. ' + error.message });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Your Skills Profile</CardTitle>
                <CardDescription>
                    Add skills manually, or connect your GitHub account to sync them automatically.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2 mb-8">
                <Input 
                    type="text" 
                    placeholder="e.g., React, Python" 
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isUserLoading}
                />
                <Button type="button" onClick={handleAddSkill} disabled={isUserLoading || !skillInput.trim()}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
                </div>
                
                {isUserLoading ? (
                <div className="flex flex-wrap gap-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-28" />)}
                </div>
                ) : (
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                    <AnimatePresence>
                    {userProfile?.skills && Array.isArray(userProfile.skills) && userProfile.skills.length > 0 ? (
                    userProfile.skills.map(skill => (
                        <motion.div key={skill} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.5 }}>
                            <Badge variant="secondary" className="flex items-center gap-2 text-base py-2 px-4 rounded-full transition-colors hover:bg-primary/10 hover:text-primary">
                                {skill}
                                <button onClick={() => handleRemoveSkill(skill)} className="rounded-full hover:bg-black/10 p-0.5">
                                    <X className="h-4 w-4" />
                                </button>
                            </Badge>
                        </motion.div>
                    ))
                    ) : (
                    <p className="text-muted-foreground">You haven't added any skills yet.</p>
                    )}
                    </AnimatePresence>
                </motion.div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
