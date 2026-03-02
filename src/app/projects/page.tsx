'use client';

import { useProjects } from '@/hooks/useProjects';
import { useState } from 'react';
import { Plus, Trash2, Folder, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DeleteModal } from '@/components/DeleteModal';

export default function ProjectsPage() {
    const { projects: allProjects, loading, addProject, deleteProject } = useProjects();
    const [filter, setFilter] = useState<'all' | 'renda' | 'estudo' | 'produto' | 'pessoal'>('all');
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        type: 'pessoal' as 'renda' | 'estudo' | 'produto' | 'pessoal',
        impact: 3
    });
    const [projectToDelete, setProjectToDelete] = useState<{ id: string, name: string } | null>(null);

    const projects = allProjects.filter(p => filter === 'all' || p.type === filter);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await addProject(form);
        if (!error) {
            setIsAdding(false);
            setForm({ name: '', description: '', type: 'pessoal', impact: 3 });
        }
        setIsSubmitting(false);
    };

    const handleConfirmDelete = async () => {
        if (projectToDelete) {
            setIsSubmitting(true);
            await deleteProject(projectToDelete.id);
            setProjectToDelete(null);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
                    <p className="text-zinc-400">Gerencie seus grandes objetivos</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
                    >
                        <Plus size={20} />
                        Novo Projeto
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {['all', 'renda', 'estudo', 'produto', 'pessoal'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t as any)}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                            filter === t
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white"
                        )}
                    >
                        {t === 'all' ? 'Todos' : t}
                    </button>
                ))}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Nome do Projeto</label>
                                <input
                                    required
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Descrição</label>
                                <textarea
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Tipo</label>
                                <select
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                                >
                                    <option value="renda">Renda</option>
                                    <option value="estudo">Estudo</option>
                                    <option value="produto">Produto</option>
                                    <option value="pessoal">Pessoal</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Impacto (1-5)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    className="mt-1 block w-full accent-indigo-600"
                                    value={form.impact}
                                    onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                                />
                                <div className="mt-1 flex justify-between text-xs text-zinc-500">
                                    <span>Baixo</span>
                                    <span>Médio</span>
                                    <span>Alto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-xl bg-zinc-900 border border-zinc-800" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-indigo-500/50 hover:bg-zinc-900/60"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToDelete({ id: project.id, name: project.name });
                                }}
                                className="absolute right-4 top-4 z-10 text-zinc-500 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>

                            <Link href={`/projects/${project.id}`} className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div className="rounded-lg bg-indigo-600/10 p-2 text-indigo-400">
                                        <Folder size={24} />
                                    </div>
                                </div>
                                <h3 className="mt-4 font-bold text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                                    {project.description || 'Sem descrição'}
                                </p>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-black tracking-widest text-zinc-300 uppercase">
                                            {project.type}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Impacto</span>
                                            <span className="font-bold text-indigo-400">{project.impact}</span>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-zinc-700 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 text-center">
                    <p className="text-zinc-500">Nenhum projeto encontrado. Comece criando um!</p>
                </div>
            )}

            <DeleteModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Projeto"
                itemName={projectToDelete?.name}
                isLoading={isSubmitting}
            />
        </div>
    );
}
