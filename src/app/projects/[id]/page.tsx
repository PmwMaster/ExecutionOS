'use client';

import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Clock,
    Target,
    CheckCircle2,
    TrendingUp,
    Brain,
    Calendar,
    Pencil,
    Trash2,
    Minus
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useMemo } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { calculateTaskScore, calculateProjectProgress } from '@/lib/priority';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RadarChart } from '@/components/RadarChart';
import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useEvolution } from '@/hooks/useEvolution';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { projects, loading: loadingProjects } = useProjects();
    const { tasks, loading: loadingTasks, updateTaskStatus, addTask, updateTask, deleteTask } = useTasks();
    const { subSkills, taskSubSkills } = useEvolution();
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomSkill, setIsCustomSkill] = useState(false);
    const [selectedSubSkills, setSelectedSubSkills] = useState<{ id: string, name: string, weight: number }[]>([]);
    const [taskForm, setTaskForm] = useState({
        name: '',
        description: '',
        impact: 3,
        duration_minutes: 30,
        skill: 'Geral',
    });

    const project = useMemo(() =>
        projects.find(p => p.id === id),
        [projects, id]);

    const projectTasks = useMemo(() =>
        tasks.filter(t => t.project_id === id),
        [tasks, id]);

    const stats = useMemo(() => {
        const total = projectTasks.length;
        const completed = projectTasks.filter(t => t.status === 'done').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const totalSeconds = projectTasks.reduce((acc, t) => {
            const timeSpent = t.elapsed_seconds > 0
                ? t.elapsed_seconds
                : (t.status === 'done' ? t.duration_minutes * 60 : 0);
            return acc + timeSpent;
        }, 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        const avgImpact = total > 0
            ? (projectTasks.reduce((acc, t) => acc + t.impact, 0) / total).toFixed(1)
            : 0;

        return { total, completed, progress, hours, minutes, avgImpact };
    }, [projectTasks]);

    // Distribuição de SubSkills do projeto: agrega XP pelas tarefas vinculadas
    const subSkillDistribution = useMemo(() => {
        const projectTaskIds = new Set(projectTasks.map(t => t.id));
        const distribution: Record<string, { name: string, totalXP: number }> = {};

        taskSubSkills
            .filter(tss => projectTaskIds.has(tss.task_id))
            .forEach(tss => {
                const sub = subSkills.find(s => s.id === tss.subskill_id);
                if (sub) {
                    if (!distribution[sub.id]) {
                        distribution[sub.id] = { name: sub.name, totalXP: 0 };
                    }
                    distribution[sub.id].totalXP += sub.total_xp * tss.normalized_weight + tss.distribution_weight;
                }
            });

        return Object.values(distribution)
            .sort((a, b) => b.totalXP - a.totalXP);
    }, [projectTasks, taskSubSkills, subSkills]);

    const skillDistribution = useMemo(() => {
        const distribution: Record<string, number> = {};
        projectTasks.forEach(task => {
            const skill = task.skill || 'Geral';
            const timeSpent = task.elapsed_seconds > 0
                ? task.elapsed_seconds
                : (task.status === 'done' ? task.duration_minutes * 60 : 0);
            distribution[skill] = (distribution[skill] || 0) + timeSpent;
        });
        return Object.entries(distribution)
            .sort((a, b) => b[1] - a[1]);
    }, [projectTasks]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const taskData = {
            ...taskForm,
            project_id: id as string,
        };
        const subskillsData = selectedSubSkills.map(s => ({ id: s.id, weight: s.weight }));

        let error;
        if (editingTaskId) {
            const result = await updateTask(editingTaskId, taskData, subskillsData);
            error = result.error;
        } else {
            const result = await addTask({ ...taskData, status: 'pending' }, subskillsData);
            error = result.error;
        }

        if (!error) {
            setIsAddingTask(false);
            setEditingTaskId(null);
            setIsCustomSkill(false);
            setSelectedSubSkills([]);
            setTaskForm({
                name: '',
                description: '',
                impact: 3,
                duration_minutes: 30,
                skill: 'Geral',
            });
        }
        setIsSubmitting(false);
    };

    const handleEditTask = async (task: any) => {
        // Buscar subskills vinculadas
        const { data: links } = await createClient().from('task_subskills').select('subskill_id, distribution_weight').eq('task_id', task.id);

        const mappedSubSkills = (links || []).map((l: any) => {
            const sub = subSkills.find(s => s.id === l.subskill_id);
            return { id: l.subskill_id, name: sub?.name || 'Unknown', weight: l.distribution_weight };
        });

        setTaskForm({
            name: task.name,
            description: task.description || '',
            impact: task.impact,
            duration_minutes: task.duration_minutes,
            skill: task.skill,
        });

        const standardSkills = ['Geral', 'Coding', 'Design', 'Business', 'Marketing', 'Research'];
        setIsCustomSkill(!standardSkills.includes(task.skill));
        setSelectedSubSkills(mappedSubSkills);
        setEditingTaskId(task.id);
        setIsAddingTask(true);
    };

    if (loadingProjects || loadingTasks) {
        return <div className="flex h-96 items-center justify-center text-zinc-500">Carregando projeto...</div>;
    }

    if (!project) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
                <Link href="/projects" className="text-indigo-400 hover:underline flex items-center gap-2">
                    <ArrowLeft size={16} /> Voltar para lista
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div className="flex items-center gap-3 mt-2">
                        <h1 className="text-4xl font-black tracking-tight text-white">{project.name}</h1>
                        <span className="rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400 border border-indigo-600/30">
                            {project.type}
                        </span>
                    </div>
                    <p className="text-zinc-400 max-w-2xl">{project.description || 'Nenhuma descrição fornecida.'}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Impacto do Projeto</div>
                        <div className="text-2xl font-black text-indigo-400">Nível {project.impact}</div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Progress & Time */}
                <div className="col-span-1 space-y-6 lg:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Progresso Geral</span>
                                <TrendingUp size={18} className="text-indigo-400" />
                            </div>
                            <div className="mt-4">
                                <div className="text-4xl font-black text-white">{stats.progress}%</div>
                                <ProgressBar progress={stats.progress} className="mt-4" />
                                <div className="mt-2 text-xs text-zinc-500">
                                    {stats.completed} de {stats.total} tarefas concluídas
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Tempo Investido</span>
                                <Clock size={18} className="text-amber-400" />
                            </div>
                            <div className="mt-4">
                                <div className="text-4xl font-black text-white">
                                    {stats.hours}h {stats.minutes}m
                                </div>
                                <div className="mt-4 text-xs text-zinc-500">
                                    Baseado em cronômetro manual
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SubSkill Spider Chart */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                                {subSkillDistribution.length >= 3 ? 'Mapa de SubSkills' : 'Distribuição de Habilidades'}
                            </span>
                            <Brain size={18} className="text-indigo-400" />
                        </div>
                        <div className="flex items-center justify-center min-h-[280px]">
                            {subSkillDistribution.length >= 3 ? (
                                <RadarChart
                                    data={subSkillDistribution.map(s => ({ label: s.name, value: s.totalXP }))}
                                    size={320}
                                />
                            ) : skillDistribution.length >= 3 ? (
                                <RadarChart
                                    data={skillDistribution.map(([label, value]) => ({ label, value }))}
                                    size={320}
                                />
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                                        <Brain size={32} />
                                    </div>
                                    <p className="text-zinc-500 max-w-[220px] text-sm">
                                        Vincule pelo menos 3 SubSkills nas tarefas deste projeto para desbloquear o Gráfico Aranha.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        {skillDistribution.length > 0 ? (
                            skillDistribution.map(([skill, time]) => {
                                const maxTime = Math.max(...skillDistribution.map(d => d[1]));
                                const skillProgress = maxTime > 0 ? (time / maxTime) * 100 : 0;
                                const h = Math.floor(time / 3600);
                                const m = Math.floor((time % 3600) / 60);

                                return (
                                    <div key={skill} className="space-y-1.5">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-zinc-300">{skill}</span>
                                            <span className="text-zinc-500">{h}h {m}m</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                                            <div
                                                className="h-full bg-indigo-500/50"
                                                style={{ width: `${skillProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-zinc-600 italic">
                                Adicione habilidades às suas tarefas para ver a análise.
                            </div>
                        )}
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-green-400" />
                            Tarefas do Projeto
                        </h3>
                        <button
                            onClick={() => {
                                if (isAddingTask && editingTaskId) {
                                    setEditingTaskId(null);
                                    setTaskForm({
                                        name: '',
                                        description: '',
                                        impact: 3,
                                        duration_minutes: 30,
                                        skill: 'Geral',
                                    });
                                }
                                setIsAddingTask(!isAddingTask);
                            }}
                            className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            <Plus size={20} className={cn(isAddingTask && !editingTaskId ? "rotate-45" : "")} />
                        </button>
                    </div>

                    {isAddingTask && (
                        <form onSubmit={handleAddTask} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-600/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <input
                                required
                                placeholder="Nome da tarefa"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                value={taskForm.name}
                                onChange={e => setTaskForm({ ...taskForm, name: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-zinc-300"
                                    value={isCustomSkill ? 'Outro' : taskForm.skill}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'Outro') {
                                            setIsCustomSkill(true);
                                            setTaskForm({ ...taskForm, skill: '' });
                                        } else {
                                            setIsCustomSkill(false);
                                            setTaskForm({ ...taskForm, skill: val });
                                        }
                                    }}
                                >
                                    <option value="Geral">Geral</option>
                                    <option value="Coding">Coding</option>
                                    <option value="Design">Design</option>
                                    <option value="Business">Business</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Research">Research</option>
                                    <option value="Outro">Outro...</option>
                                </select>
                                {isCustomSkill && (
                                    <input
                                        required
                                        placeholder="Habilidade"
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                        value={taskForm.skill}
                                        onChange={e => setTaskForm({ ...taskForm, skill: e.target.value })}
                                    />
                                )}
                            </div>

                            {/* SubSkill Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                                    <Zap size={12} className="text-indigo-400" />
                                    SubSkills Impactadas
                                </label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-zinc-300"
                                    onChange={(e) => {
                                        const subId = e.target.value;
                                        if (!subId) return;
                                        const sub = subSkills.find(s => s.id === subId);
                                        if (sub && !selectedSubSkills.find(s => s.id === subId)) {
                                            setSelectedSubSkills([...selectedSubSkills, { id: sub.id, name: sub.name, weight: 1 }]);
                                        }
                                        e.target.value = "";
                                    }}
                                >
                                    <option value="">+ Vincular SubSkill</option>
                                    {subSkills.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedSubSkills.map(ss => (
                                        <div key={ss.id} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-[10px] text-white animate-in zoom-in-95 duration-200">
                                            <span className="font-medium text-indigo-200">{ss.name}</span>
                                            <div className="flex items-center bg-zinc-950/50 rounded-md border border-zinc-800 ml-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVal = Math.max(1, ss.weight - 1);
                                                        setSelectedSubSkills(selectedSubSkills.map(s => s.id === ss.id ? { ...s, weight: newVal } : s));
                                                    }}
                                                    className="p-1 hover:text-indigo-400 transition-colors"
                                                >
                                                    <Minus size={10} />
                                                </button>
                                                <span className="w-4 text-center font-bold text-indigo-400">{ss.weight}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVal = ss.weight + 1;
                                                        setSelectedSubSkills(selectedSubSkills.map(s => s.id === ss.id ? { ...s, weight: newVal } : s));
                                                    }}
                                                    className="p-1 hover:text-indigo-400 transition-colors"
                                                >
                                                    <Plus size={10} />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSubSkills(selectedSubSkills.filter(s => s.id !== ss.id))}
                                                className="ml-1 text-zinc-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? (editingTaskId ? 'Salvando...' : 'Adicionando...') : (editingTaskId ? 'Atualizar' : 'Adicionar')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingTask(false);
                                        setEditingTaskId(null);
                                        setTaskForm({
                                            name: '',
                                            description: '',
                                            impact: 3,
                                            duration_minutes: 30,
                                            skill: 'Geral',
                                        });
                                    }}
                                    className="px-4 bg-zinc-800 text-zinc-400 rounded-lg py-2 text-xs font-bold hover:bg-zinc-700"
                                >
                                    X
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {projectTasks.length > 0 ? (
                            projectTasks.sort((a, b) => {
                                if (a.status === 'done' && b.status !== 'done') return 1;
                                if (a.status !== 'done' && b.status === 'done') return -1;
                                return calculateTaskScore(b) - calculateTaskScore(a);
                            }).map(task => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "group flex flex-col gap-3 rounded-xl border p-4 transition-all",
                                        task.status === 'done'
                                            ? "border-zinc-900 bg-zinc-900/10 opacity-60"
                                            : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {task.name}
                                        </div>
                                        <div className="text-xs font-black text-indigo-400/80 tracking-tighter uppercase px-2 py-0.5 rounded bg-indigo-500/5 flex items-center gap-3">
                                            <span>Score {calculateTaskScore(task)}</span>
                                            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTask(task);
                                                    }}
                                                    className="p-1 hover:text-white transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Excluir esta tarefa?')) {
                                                            deleteTask(task.id);
                                                        }
                                                    }}
                                                    className="p-1 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                                        <span className="flex items-center gap-1 border-r border-zinc-800 pr-3">
                                            <Clock size={10} /> {task.duration_minutes}m
                                        </span>
                                        <span className="flex items-center gap-1 border-r border-zinc-800 pr-3">
                                            <Zap size={10} /> Impacto {task.impact}
                                        </span>
                                        <span className="flex items-center gap-1 text-indigo-400/70">
                                            <Brain size={10} /> {task.skill || 'Geral'}
                                        </span>
                                    </div>

                                    {task.status !== 'done' && (
                                        <button
                                            onClick={() => updateTaskStatus(task.id, 'done')}
                                            className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-xs font-bold text-zinc-400 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={14} /> Marcar como Concluída
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
                                Nenhuma tarefa vinculada a este projeto.
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
}
