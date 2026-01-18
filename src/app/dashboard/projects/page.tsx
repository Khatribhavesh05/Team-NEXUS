'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Briefcase, CheckCircle, MoreVertical, Pencil, Trash2, Github } from 'lucide-react';
import {
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  description: z.string().optional(),
  status: z.enum(['Planned', 'In Progress', 'Completed']),
  skills: z.array(z.string()).optional().default([]),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type Project = ProjectFormValues & { 
    id: string;
    source: 'manual' | 'github';
    url?: string;
    analysis?: {
        projectType: string;
        experienceLevel: string;
    }
};

export default function ProjectsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const projectsColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'projects') : null, [firestore, user]);
  
  const { data: userProfile, isLoading: isUserLoading } = useDoc<{ skills: string[] }>(userDocRef);
  const { data: projects, isLoading: areProjectsLoading } = useCollection(projectsColRef);

  const processedProjects = useMemo(() => {
    if (!projects) return [];
    return (projects as any[]).map(p => ({ ...p, source: p.source || 'manual' })).sort((a,b) => (a.source > b.source) ? -1 : 1);
  }, [projects]);

  const projectStats = useMemo(() => {
    const projectList = processedProjects || [];
    const totalProjects = projectList.length;
    const completedProjects = projectList.filter((p: any) => p.status === 'Completed').length;
    return { totalProjects, completedProjects };
  }, [processedProjects]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', status: 'Planned', skills: [] },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    if (!user || !userDocRef || !projectsColRef) return;
    try {
      if (selectedProject) {
        await updateDoc(doc(firestore, 'users', user.uid, 'projects', selectedProject.id), values);
        toast({ title: 'Project Updated' });
      } else {
        await addDoc(projectsColRef, { ...values, createdAt: serverTimestamp(), source: 'manual' });
        toast({ title: 'Project Added' });
      }
      form.reset();
      setIsProjectDialogOpen(false);
      setSelectedProject(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save project. ' + error.message });
    }
  };
  
  const handleDeleteProject = async () => {
    if (!user || !projectToDeleteId) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'projects', projectToDeleteId));
      toast({ title: 'Project Deleted' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete project. ' + error.message });
    } finally {
      setDeleteAlertOpen(false);
      setProjectToDeleteId(null);
    }
  };

  const handleAddClick = () => {
    setSelectedProject(null);
    form.reset({ name: '', description: '', status: 'Planned', skills: [] });
    setIsProjectDialogOpen(true);
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    form.reset({ name: project.name, description: project.description || '', status: project.status, skills: project.skills || [] });
    setIsProjectDialogOpen(true);
  };
  
  const handleDeleteClick = (projectId: string) => {
    setProjectToDeleteId(projectId);
    setDeleteAlertOpen(true);
  };
  
  const isLoading = areProjectsLoading || isUserLoading;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Track your personal and professional projects.</p>
        </div>
        <Button onClick={handleAddClick}><Plus className="mr-2 h-4 w-4" /> Add Project</Button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}><Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Projects</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{projectStats.totalProjects}</div>}</CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants}><Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{projectStats.completedProjects}</div>}</CardContent>
        </Card></motion.div>
      </motion.div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Project List</h2>
        {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
            </div>
        ) : processedProjects && processedProjects.length > 0 ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {processedProjects.map((project) => (
              <motion.div variants={itemVariants} key={project.id}>
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    {project.source === 'github' && project.url ? (
                        <Link href={project.url} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold">
                            <CardTitle className="pr-8 truncate flex items-center gap-2 text-lg">
                                <Github className="h-5 w-5" /> {project.name}
                            </CardTitle>
                        </Link>
                    ) : (
                        <CardTitle className="pr-8 truncate text-lg">{project.name}</CardTitle>
                    )}
                    {project.source === 'github' ? (
                      <Tooltip><TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-default border-blue-300 bg-blue-50 text-blue-800">From GitHub</Badge>
                      </TooltipTrigger><TooltipContent><p>This project is synced from GitHub and is read-only.</p></TooltipContent></Tooltip>
                    ) : (
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(project as Project)}><Pencil className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(project.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </div>
                   <CardDescription className="line-clamp-2 h-[40px] pt-1">{project.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                   <div>
                       <div className="flex flex-wrap gap-2 mb-4">
                         {project.source === 'github' && project.analysis ? (
                            <>
                               {project.analysis.projectType && <Badge variant="secondary">{project.analysis.projectType}</Badge>}
                               {project.analysis.experienceLevel && <Badge variant="secondary">{project.analysis.experienceLevel}</Badge>}
                            </>
                         ) : (
                            <Badge variant={ project.status === 'Completed' ? 'default' : project.status === 'In Progress' ? 'secondary' : 'outline' }>{project.status}</Badge>
                         )}
                       </div>
                      <h4 className="text-sm font-semibold mb-2">Tech Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.skills && project.skills.length > 0 ? (
                          project.skills.slice(0, 5).map((skill: string) => <Badge key={skill} variant="outline">{skill}</Badge>)
                        ) : (
                          <p className="text-xs text-muted-foreground">No tech stack specified.</p>
                        )}
                      </div>
                   </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-white/50">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Projects Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add a project or sync with GitHub to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedProject ? 'Edit Project' : 'Add New Project'}</DialogTitle><DialogDescription>{selectedProject ? 'Update details.' : 'Fill in details.'}</DialogDescription></DialogHeader>
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>
              {/* ... form fields ... */}
              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Saving...' : (selectedProject ? 'Save Changes' : 'Save Project')}</Button>
              </DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your project.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
