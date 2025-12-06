import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, LayoutDashboard, Calendar, Clock, Target } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navigation */}
            <nav className="border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">LO</span>
                        </div>
                        <span className="font-semibold text-xl">LifeOS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link href="/signup">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Master Your Life with LifeOS
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        The all-in-one workspace to manage your tasks, habits, goals, and time.
                        Stop juggling multiple apps and start living intentionally.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="h-12 px-8 text-lg">
                                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                                Live Demo
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16">Everything you need in one place</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<LayoutDashboard className="h-10 w-10 text-blue-500" />}
                            title="Task Management"
                            description="Organize projects and tasks with powerful Kanban boards and lists."
                        />
                        <FeatureCard
                            icon={<Calendar className="h-10 w-10 text-green-500" />}
                            title="Smart Calendar"
                            description="Two-way sync with Google Calendar and smart reminders for upcoming events."
                        />
                        <FeatureCard
                            icon={<Target className="h-10 w-10 text-red-500" />}
                            title="Habit Tracking"
                            description="Build lasting habits with streaks, analytics, and daily reminders."
                        />
                        <FeatureCard
                            icon={<Clock className="h-10 w-10 text-purple-500" />}
                            title="Time Tracking"
                            description="Track where your time goes and optimize your productivity."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 text-center">
                    <div className="bg-primary/5 rounded-3xl p-12 md:p-20">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take control?</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                            Join thousands of users who have transformed their productivity with LifeOS.
                        </p>
                        <Link href="/signup">
                            <Button size="lg" className="h-12 px-8 text-lg">
                                Get Started Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">LO</span>
                        </div>
                        <span className="font-semibold">LifeOS</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} LifeOS. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-background p-6 rounded-xl border hover:shadow-lg transition-all">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
