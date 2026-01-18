'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const steps = [
  { step: 1, title: 'Career Sector' },
  { step: 2, title: 'Current Skills' },
  { step: 3, title: 'Career Goal' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [targetSector, setTargetSector] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleNext = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }
      setIsSubmitting(true);
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, {
          targetSector,
          skills,
          targetRole,
        });
        toast({ title: 'Profile Updated', description: 'Your profile has been successfully set up.' });
        router.push('/dashboard');
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  
  if (isUserLoading || !user) {
      return (
         <div className="flex items-center justify-center min-h-screen bg-muted/50">
            <div className="w-full max-w-xl p-4">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <span className="text-sm text-muted-foreground self-end"><Skeleton className="h-4 w-24" /></span>
                        <Skeleton className="h-2 w-full mt-4" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Skeleton className="h-6 w-1/3 mb-6" />
                        <div className="min-h-[200px]">
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="mt-8 flex justify-end">
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <div className="w-full max-w-xl p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
                <CardTitle>Let's set up your profile</CardTitle>
                <span className="text-sm text-muted-foreground">Step {currentStep} of {steps.length}</span>
            </div>
            <Progress value={(currentStep / steps.length) * 100} />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mt-4">
              <h3 className="text-lg font-semibold">{steps[currentStep-1].title}</h3>
            </div>
            <div className="mt-6 min-h-[200px]">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Label htmlFor="sector">Choose your primary career sector</Label>
                  <p className="text-sm text-muted-foreground">This helps us tailor recommendations for you.</p>
                  <Select value={targetSector} onValueChange={setTargetSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="e.g., Technology" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                       <SelectItem value="engineering">Core Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {currentStep === 2 && (
                 <div className="space-y-4">
                  <Label htmlFor="skills">Enter your current skills</Label>
                  <p className="text-sm text-muted-foreground">Add your skills to help us understand your expertise. Press Enter or comma to add a skill.</p>
                  <Input 
                    id="skills" 
                    placeholder="Type a skill and press Enter" 
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="rounded-full hover:bg-muted/50">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <Label htmlFor="goal">What is your main career goal?</Label>
                  <p className="text-sm text-muted-foreground">e.g., "Become a Senior Product Manager" or "Transition to a Data Scientist role".</p>
                  <Input id="goal" placeholder="e.g., Become a Senior Product Manager" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack}>Back</Button>
              ) : <div></div>}
              <Button onClick={handleNext} disabled={isSubmitting}>
                {currentStep === steps.length
                    ? (isSubmitting ? "Saving..." : "Finish & Go to Dashboard")
                    : 'Continue'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
