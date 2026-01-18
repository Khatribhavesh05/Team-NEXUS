'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GithubAuthProvider, linkWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { CheckCircle, Github, Plus, Loader2 } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.66 1.67-3.86 0-6.99-3.16-6.99-7.02s3.13-7.02 6.99-7.02c2.2 0 3.63.86 4.49 1.67l2.6-2.6C16.84 3.3 14.83 2.4 12.48 2.4 7.22 2.4 3.02 6.58 3.02 11.82s4.2 9.42 9.46 9.42c2.78 0 4.95-.94 6.62-2.62 1.78-1.78 2.4-4.27 2.4-6.38 0-.57-.05-.92-.15-1.32H12.48z" />
  </svg>
);

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  targetRole: z.string().optional(),
  targetSector: z.string().optional(),
});

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      targetRole: "",
      targetSector: "",
    },
  });
  
  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        targetRole: userProfile.targetRole || '',
        targetSector: userProfile.targetSector || '',
      });
    }
  }, [userProfile, form]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  const handleConnectGitHub = async () => {
    if (!user || !userDocRef) return;
    setIsLinking(true);
    const githubProvider = new GithubAuthProvider();
    githubProvider.addScope('repo');

    try {
      const result = await linkWithPopup(user, githubProvider);
      await user.reload(); 
      const providerIds = user.providerData.map(p => p.providerId);
      const additionalInfo = getAdditionalUserInfo(result);
      
      let githubData = {};
      if (additionalInfo?.providerId === 'github.com' && additionalInfo.username) {
        githubData = {
          github: {
            username: additionalInfo.username,
            profileUrl: additionalInfo.profile?.html_url,
            avatarUrl: additionalInfo.profile?.avatar_url,
            connectedAt: new Date().toISOString(),
          }
        };
      }

      await updateDoc(userDocRef, {
        authProviders: providerIds,
        ...githubData
      });
      
      toast({ title: "GitHub Connected!", description: "Your GitHub account has been successfully linked." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to connect GitHub', description: error.message });
    } finally {
      setIsLinking(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) return;
    try {
      await updateDoc(userDocRef, values);
      toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }
  
  if (isLoading || !userProfile || !user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGoogleLinked = user.providerData.some(p => p.providerId === 'google.com');
  const isGithubLinked = user.providerData.some(p => p.providerId === 'github.com');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your career goals and personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback>{getInitials(userProfile.firstName, userProfile.lastName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                   <p className="text-xl font-semibold">{userProfile.firstName} {userProfile.lastName}</p>
                   <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Senior Product Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetSector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Sector</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="e.g., Technology" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="engineering">Core Engineering</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your third-party account connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {isGoogleLinked && (
                <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <GoogleIcon className="h-6 w-6" />
                        <span className="font-medium">Google</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle className="h-5 w-5" />
                        Connected
                    </div>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                      <Github className="h-6 w-6" />
                      <span className="font-medium">GitHub</span>
                  </div>
                  {isGithubLinked ? (
                     <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle className="h-5 w-5" />
                        Connected
                    </div>
                  ) : (
                    <Button variant="outline" onClick={handleConnectGitHub} disabled={isLinking}>
                        {isLinking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Connecting...</> : <><Plus className="mr-2 h-4 w-4" /> Connect</>}
                    </Button>
                  )}
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
