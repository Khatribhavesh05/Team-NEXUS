import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { BriefcaseBusiness, Target, Zap, TrendingUp, Search, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BriefcaseBusiness className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">SkillPathAI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">
              How it Works
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Login
            </Link>
          </nav>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </Container>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-32">
            <Container className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                Build your career path with clarity
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                AI-powered guidance to learn the right skills, step by step.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </Container>
        </section>

        <section id="features" className="py-20 md:py-24 bg-muted/50">
            <Container>
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold">Features</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Everything you need to navigate your career growth.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <div className="bg-primary/10 text-primary rounded-lg p-3 w-fit mb-4">
                                <Search className="h-8 w-8" />
                            </div>
                            <CardTitle>Skill Gap Analysis</CardTitle>
                            <CardDescription>Identify the exact skills you need to bridge the gap between your current expertise and your career aspirations.</CardDescription>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader>
                            <div className="bg-primary/10 text-primary rounded-lg p-3 w-fit mb-4">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                            <CardTitle>Personalized Learning Path</CardTitle>
                            <CardDescription>Receive a custom, step-by-step roadmap with curated resources to help you learn the most relevant skills efficiently.</CardDescription>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader>
                            <div className="bg-primary/10 text-primary rounded-lg p-3 w-fit mb-4">
                                <GraduationCap className="h-8 w-8" />
                            </div>
                            <CardTitle>Career-Focused Dashboard</CardTitle>
                            <CardDescription>Visualize your progress, track your skill acquisition, and see how you're moving closer to your professional goals.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </Container>
        </section>

        <section id="how-it-works" className="py-20 md:py-24">
            <Container>
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                       Get your personalized career roadmap in 3 simple steps.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center border-2 border-primary rounded-full h-16 w-16 text-primary font-bold text-2xl mb-4">1</div>
                        <h3 className="font-bold text-xl mb-2">Sign Up</h3>
                        <p className="text-muted-foreground">Create your free account in seconds to get started.</p>
                    </div>
                     <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center border-2 border-primary rounded-full h-16 w-16 text-primary font-bold text-2xl mb-4">2</div>
                        <h3 className="font-bold text-xl mb-2">Add Skills & Goals</h3>
                        <p className="text-muted-foreground">Tell us about your current skills and where you want to go in your career.</p>
                    </div>
                     <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center border-2 border-primary rounded-full h-16 w-16 text-primary font-bold text-2xl mb-4">3</div>
                        <h3 className="font-bold text-xl mb-2">Get a Learning Roadmap</h3>
                        <p className="text-muted-foreground">Our AI analyzes your profile to create a personalized learning plan just for you.</p>
                    </div>
                </div>
            </Container>
        </section>
      </main>
      <footer className="py-8 border-t">
        <Container className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SkillPathAI. All rights reserved.
          </p>
            <div className="flex items-center gap-4">
                 <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy Policy
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Terms of Service
                </Link>
            </div>
        </Container>
      </footer>
    </div>
  );
}
