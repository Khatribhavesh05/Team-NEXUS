'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BriefcaseBusiness, LayoutDashboard, User, BarChart, LogOut, CheckSquare, FolderKanban, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth, useUser } from '@/firebase';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';


const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/skills', label: 'Skills', icon: CheckSquare },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/roadmap', label: 'Roadmap', icon: BarChart },
  { href: '/dashboard/github-analyzer', label: 'GitHub Analyzer', icon: Github },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const getInitials = (firstName?: string | null, email?: string | null) => {
    if (firstName) {
        return firstName[0].toUpperCase();
    }
    if (email) {
        return email[0].toUpperCase();
    }
    return 'U';
  }

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full main-gradient-background">
        <div className="hidden md:flex flex-col gap-4 border-r bg-white/80 backdrop-blur-sm p-2">
            <div className="p-2">
              <Skeleton className="h-7 w-32" />
            </div>
            <div className="flex flex-col gap-2 p-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </header>
            <main className="flex-1 p-4 md:p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </div>
            </main>
        </div>
      </div>
    );
  }

  return (
    <div className="main-gradient-background min-h-screen">
      <SidebarProvider>
          <Sidebar className="bg-white/60 backdrop-blur-lg border-r">
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <BriefcaseBusiness className="h-7 w-7 text-primary" />
                <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
                  SkillPathAI
                </span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={isMobile ? undefined : item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} tooltip={isMobile ? undefined : 'Logout'}>
                          <LogOut />
                          <span>Logout</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
              <header className="flex items-center justify-between p-4 border-b bg-white/30 backdrop-blur-lg sticky top-0 z-40">
                  <SidebarTrigger />
                  <h1 className="text-xl font-semibold">
                      {menuItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                  </h1>
                  <div>
                    <Button variant="ghost" size="icon" className="rounded-full" asChild>
                          <Link href="/dashboard/profile">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL ?? undefined} />
                              <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                          </Avatar>
                          </Link>
                      </Button>
                  </div>
              </header>
              <main className="flex-1 p-4 md:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                      key={pathname}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                      {children}
                  </motion.div>
                </AnimatePresence>
              </main>
          </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
