'use client';

import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useEvolution } from '@/hooks/useEvolution';
import { createClient } from '@/lib/supabase';
import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Clock, Play, Zap, Pencil, Minus } from 'lucide-react';
import { DeleteModal } from '@/components/DeleteModal';
import { cn } from '@/lib/utils';

export default function TasksPage() {
    const { tasks, loading: loadingTasks, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
    const { projects, loading: loadingProjects } = useProjects();
    const { subSkills } = useEvolution();
    const [isAdding, setIsAdding] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isCustomSkill, setIsCustomSkill] = useState(false);
    const [selectedSubSkills, setSelectedSubSkills] = useState<{ id: string, name: string, weight: number }[]>([]);

    const [form, setForm] = useState({
        name: '',
        description: '',
        project_id: '',
        impact: 3,
        duration_minutes: 30,
        deadline: '',
        skill: 'Geral',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const taskData = {
            ...form,
            deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        };
        const subskillsData = selectedSubSkills.map(s => ({ id: s.id, weight: s.weight }));

        let error;
        if (editingTaskId) {
            const result = await updateTask(editingTaskId, taskData, subskillsData);
            error = result.error;
        } else {
            const result = await addTask(taskData, subskillsData);
            error = result.error;
        }

        if (!error) {
            setIsAdding(false);
            setEditingTaskId(null);
            setIsCustomSkill(false);
            setSelectedSubSkills([]);
            setForm({
                name: '',
                description: '',
                project_id: '',
                impact: 3,
                duration_minutes: 30,
                deadline: '',
                skill: 'Geral',
            });
        }
        setIsSubmitting(false);
    };

    const handleConfirmDelete = async () => {
        if (taskToDelete) {
            setIsSubmitting(true);
            await deleteTask(taskToDelete.id);
            setTaskToDelete(null);
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (task: any) => {
        // Buscar subskills vinculadas
        const { data: links } = await createClient().from('task_subskills').select('subskill_id, distribution_weight').eq('task_id', task.id);

        const mappedSubSkills = (links || []).map((l: any) => {
            const sub = subSkills.find(s => s.id === l.subskill_id);
            return { id: l.subskill_id, name: sub?.name || 'Unknown', weight: l.distribution_weight };
        });

        const formatDate = (isoDate: string | null) => {
            if (!isoDate) return '';
            const d = new Date(isoDate);
            return d.toISOString().slice(0, 16);
        };

        setForm({
            name: task.name,
            description: task.description || '',
            project_id: task.project_id,
            impact: task.impact,
            duration_minutes: task.duration_minutes,
            deadline: formatDate(task.deadline),
            skill: task.skill,
        });

        const standardSkills = ['Geral', 'Coding', 'Design', 'Business', 'Marketing', 'Research'];
        setIsCustomSkill(!standardSkills.includes(task.skill));
        setSelectedSubSkills(mappedSubSkills);
        setEditingTaskId(task.id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done': return <CheckCircle2 className="text-green-500" size={20} />;
            case 'in_progress': return <Play className="text-yellow-500" size={20} />;
            default: return <Clock className="text-zinc-500" size={20} />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
                    <p className="text-zinc-400">Suas ações diárias</p>
                </div>
                <button
                    onClick={() => {
                        if (isAdding && editingTaskId) {
                            setEditingTaskId(null);
                            setForm({
                                name: '',
                                description: '',
                                project_id: '',
                                impact: 3,
                                duration_minutes: 30,
                                deadline: '',
                                skill: 'Geral',
                            });
                        }
                        setIsAdding(!isAdding);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
                >
                    <Plus size={20} />
                    Nova Tarefa
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Nome da Tarefa</label>
                                <input
                                    required
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Projeto</label>
                                <select
                                    required
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    value={form.project_id}
                                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                                >
                                    <option value="">Selecionar Projeto</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-400" />
                                    Duração estimada
                                </label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {[15, 30, 60, 120].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setForm({ ...form, duration_minutes: t })}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                                form.duration_minutes === t
                                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105"
                                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                                            )}
                                        >
                                            {t >= 60 ? `${t / 60}h` : `${t}m`}
                                        </button>
                                    ))}
                                    <div className="relative flex-1 min-w-[100px]">
                                        <input
                                            type="number"
                                            placeholder="Personalizado"
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500"
                                            value={form.duration_minutes}
                                            onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 pointer-events-none">
                                            min
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Deadline</label>
                                <input
                                    type="datetime-local"
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    value={form.deadline}
                                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                />
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
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Habilidade / Categoria</label>
                                <div className="mt-1 flex gap-2">
                                    <select
                                        className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                        value={isCustomSkill ? 'Outro' : form.skill}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'Outro') {
                                                setIsCustomSkill(true);
                                                setForm({ ...form, skill: '' });
                                            } else {
                                                setIsCustomSkill(false);
                                                setForm({ ...form, skill: val });
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
                                            placeholder="Qual habilidade?"
                                            className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500 animate-in fade-in slide-in-from-left-2"
                                            value={form.skill}
                                            onChange={(e) => setForm({ ...form, skill: e.target.value })}
                                        />
                                    )}
                                </div>
                            </div>
                            {/* SubSkill Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <Zap size={14} className="text-indigo-400" />
                                    SubSkills Impactadas (Multiselção)
                                </label>
                                <select
                                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500 text-sm"
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        if (!id) return;
                                        const sub = subSkills.find(s => s.id === id);
                                        if (sub && !selectedSubSkills.find(s => s.id === id)) {
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
                                        <div key={ss.id} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs text-white animate-in zoom-in-95 duration-200">
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
                                                <span className="w-4 text-center text-[10px] font-bold text-indigo-400">{ss.weight}</span>
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
                            <div>
                                <label className="text-sm font-medium text-zinc-300">Descrição</label>
                                <textarea
                                    className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(false);
                                setEditingTaskId(null);
                                setForm({
                                    name: '',
                                    description: '',
                                    project_id: '',
                                    impact: 3,
                                    duration_minutes: 30,
                                    deadline: '',
                                    skill: 'Geral',
                                });
                            }}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : (editingTaskId ? 'Atualizar Tarefa' : 'Salvar Tarefa')}
                        </button>
                    </div>
                </form>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">Tarefa</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Duração</th>
                            <th className="px-6 py-4">Impacto</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loadingTasks ? (
                            [1, 2, 3].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-4 h-16 bg-zinc-900/20" />
                                </tr>
                            ))
                        ) : (
                            tasks.map((task) => (
                                <tr key={task.id} className="group hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{task.name}</div>
                                        <div className="text-xs text-zinc-500 truncate max-w-xs">{task.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="bg-transparent border-none text-zinc-300 outline-none cursor-pointer"
                                            value={task.status}
                                            onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                                        >
                                            <option value="pending">Pendente</option>
                                            <option value="in_progress">Em Progresso</option>
                                            <option value="done">Concluída</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{task.duration_minutes} min</td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-indigo-400">{task.impact}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(task)}
                                                className="text-zinc-500 hover:text-indigo-400 transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => setTaskToDelete({ id: task.id, name: task.name })}
                                                className="text-zinc-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!loadingTasks && tasks.length === 0 && (
                    <div className="py-12 text-center text-zinc-500">
                        Nenhuma tarefa encontrada. Hora de planejar!
                    </div>
                )}
            </div>

            <DeleteModal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Tarefa"
                itemName={taskToDelete?.name}
                isLoading={isSubmitting}
            />
        </div>
    );
}
