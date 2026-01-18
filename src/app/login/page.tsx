'use client';

import { Button } from '@/components/ui/button';
import { BriefcaseBusiness, Github } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  type AuthProvider,
  type UserCredential,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.67-4.66 1.67-3.86 0-6.99-3.16-6.99-7.02s3.13-7.02 6.99-7.02c2.2 0 3.63.86 4.49 1.67l2.6-2.6C16.84 3.3 14.83 2.4 12.48 2.4 7.22 2.4 3.02 6.58 3.02 11.82s4.2 9.42 9.46 9.42c2.78 0 4.95-.94 6.62-2.62 1.78-1.78 2.4-4.27 2.4-6.38 0-.57-.05-.92-.15-1.32H12.48z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateUserDocument = async (result: UserCredential) => {
    const user = result.user;
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    await user.reload();
    const freshUser = auth.currentUser!;
    const providerIds = freshUser.providerData.map(p => p.providerId);
    
    const isNewUser = !userDoc.exists();

    let userData: any = {
      id: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      authProviders: providerIds,
    };
    
    const displayName = freshUser.displayName || userDoc.data()?.displayName || '';
    if (displayName) {
      const nameParts = displayName.split(' ');
      userData.firstName = nameParts[0] || '';
      userData.lastName = nameParts.slice(1).join(' ') || '';
    }

    if (isNewUser) {
        userData.createdAt = serverTimestamp();
        userData.skills = [];
        userData.targetRole = '';
        userData.targetSector = '';
        userData.roadmapProgress = 'Not Started';
    }

    const additionalInfo = getAdditionalUserInfo(result);
    if (additionalInfo?.providerId === 'github.com' && additionalInfo.username) {
      userData.github = {
        username: additionalInfo.username,
        profileUrl: additionalInfo.profile?.html_url,
        avatarUrl: additionalInfo.profile?.avatar_url,
        publicRepoCount: additionalInfo.profile?.public_repos,
        followers: additionalInfo.profile?.followers,
        following: additionalInfo.profile?.following,
        connectedAt: serverTimestamp(),
      };
    }
    
    await setDoc(userDocRef, userData, { merge: true });
    
    return { isNewUser };
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setIsLoading(providerName);
    setError(null);
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    if (providerName === 'github') {
      provider.addScope('repo');
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const { isNewUser } = await updateUserDocument(result);
      toast({ title: "Sign-in Successful", description: "Welcome to SkillPathAI!" });
      router.push(isNewUser ? '/onboarding' : '/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = GithubAuthProvider.credentialFromError(error);
        const email = error.customData.email;
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods[0] === 'google.com') {
          setError(`This email is linked to a Google account. Please sign in with Google to connect your GitHub account.`);
          toast({
            title: "Account already exists",
            description: `Sign in with Google to link your GitHub account.`,
            duration: 8000,
          });
          
          try {
            const googleProvider = new GoogleAuthProvider();
            const googleResult = await signInWithPopup(auth, googleProvider);
            if (pendingCred) {
              await linkWithCredential(googleResult.user, pendingCred);
            }
            const { isNewUser } = await updateUserDocument(googleResult);
            toast({ title: "GitHub Account Connected!", description: "Successfully linked to your Google account." });
            router.push(isNewUser ? '/onboarding' : '/dashboard');
          } catch (linkError: any) {
            console.error("Linking error:", linkError);
            setError("Could not link GitHub account. Please try again.");
          }
        }
      } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Social login error:", error);
        setError(error.message || "An unexpected error occurred during sign-in.");
        toast({ variant: "destructive", title: "Sign-in Failed", description: error.message });
      }
    } finally {
      setIsLoading(null);
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen animated-gradient">
        <div className="w-full max-w-md p-4">
            <div className="glass-card p-8 text-center">
              <Skeleton className="h-8 w-3/4 mx-auto bg-gray-200/50" />
              <Skeleton className="h-4 w-full mt-4 mx-auto bg-gray-200/50" />
              <div className="space-y-4 mt-8">
                <Skeleton className="h-12 w-full bg-gray-200/50" />
                <Skeleton className="h-12 w-full bg-gray-200/50" />
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 animated-gradient">
        <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="glass-card p-8 text-center"
            >
                <div className="flex justify-center mb-6">
                    <BriefcaseBusiness className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Welcome to SkillPathAI
                </h1>
                <p className="mt-2 text-md text-gray-600">
                    Build your career profile automatically.
                </p>

                {error && (
                    <div className="mt-6 text-sm text-blue-600 bg-blue-100 p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
                    }}
                    className="mt-8 space-y-4"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                        <Button 
                            className="w-full h-12 text-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-transform duration-200 hover:scale-105 active:scale-100"
                            onClick={() => handleSocialLogin('google')} 
                            disabled={!!isLoading}
                        >
                            {isLoading === 'google' ? 'Redirecting...' : <><GoogleIcon className="mr-3 h-5 w-5" /> Continue with Google</>}
                        </Button>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                        <Button 
                            className="w-full h-12 text-md bg-gray-800 text-white hover:bg-gray-900 transition-transform duration-200 hover:scale-105 active:scale-100"
                            onClick={() => handleSocialLogin('github')} 
                            disabled={!!isLoading}
                        >
                            {isLoading === 'github' ? 'Redirecting...' : <><Github className="mr-3 h-5 w-5" /> Continue with GitHub</>}
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    </main>
  );
}
