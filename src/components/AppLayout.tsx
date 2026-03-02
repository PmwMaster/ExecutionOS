'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X, Brain } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Projetos', href: '/projects', icon: FolderKanban },
        { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
        { name: 'Evolução', href: '/evolution', icon: Brain },
    ];

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (isAuthPage) return <>{children}</>;

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Mobile Header */}
            <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 backdrop-blur-md lg:hidden">
                <h1 className="text-xl font-bold tracking-tight">ExecutionOS</h1>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="rounded-lg p-2 hover:bg-zinc-800"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-800 bg-zinc-900/50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
                        !isSidebarOpen && "-translate-x-full"
                    )}
                >
                    <div className="flex h-full flex-col p-6">
                        <div className="hidden items-center gap-2 lg:flex">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">E</div>
                            <h1 className="text-xl font-bold tracking-tight">ExecutionOS</h1>
                        </div>

                        <nav className="mt-10 flex-1 space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-indigo-600/10 text-indigo-400"
                                                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                        )}
                                    >
                                        <Icon size={20} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <button
                            onClick={handleLogout}
                            className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                        >
                            <LogOut size={20} />
                            Sair
                        </button>
                    </div>
                </aside>

                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
                    <div className="mx-auto max-w-5xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
