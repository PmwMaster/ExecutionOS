'use client';

import { createClient } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useEffect, useState } from 'react';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                setError(error.message + " (verifique se as tabelas foram criadas no Supabase)");
            } else {
                setTasks(data || []);
            }
        } catch (err: any) {
            setError("Erro de conexão: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (task: Omit<TaskInsert, 'user_id'>, subskills?: { id: string, weight: number }[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await (supabase
            .from('tasks') as any)
            .insert([{ ...task, user_id: user.id } as any])
            .select()
            .single();

        if (error) return { error: error.message };

        // Vincular SubSkills
        if (subskills && subskills.length > 0) {
            await (supabase.from('task_subskills') as any).insert(
                subskills.map(ss => ({
                    task_id: (data as any).id,
                    subskill_id: ss.id,
                    distribution_weight: ss.weight
                }) as any)
            );
        }

        setTasks([data, ...tasks]);
        return { data };
    };

    const updateTaskStatus = async (id: string, status: Task['status']) => {
        const { error } = await (supabase
            .from('tasks') as any)
            .update({ status } as any)
            .eq('id', id);

        if (error) return { error: error.message };

        // Lógica de Distribuição de XP se a tarefa for concluída
        if (status === 'done') {
            const task = tasks.find(t => t.id === id);
            if (task) {
                const baseXP = task.impact * task.duration_minutes;

                const { data: subSkillLinks } = await (supabase
                    .from('task_subskills') as any)
                    .select('subskill_id, distribution_weight')
                    .eq('task_id', id);

                if (subSkillLinks && (subSkillLinks as any[]).length > 0) {
                    const totalWeight = (subSkillLinks as any[]).reduce((acc: number, curr: any) => acc + curr.distribution_weight, 0);

                    for (const link of (subSkillLinks as any[])) {
                        const normalizedWeight = totalWeight > 0
                            ? link.distribution_weight / totalWeight
                            : 1 / (subSkillLinks as any[]).length;

                        const xpToDistribute = baseXP * normalizedWeight;

                        // Uma única chamada ao banco que cuida de toda a hierarquia e Level Up
                        await (supabase as any).rpc('increment_subskill_xp', {
                            sub_id: link.subskill_id,
                            xp_amount: xpToDistribute
                        });
                    }
                }
            }
        }

        setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
        return { success: true };
    };

    const toggleTimer = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return { error: 'Task not found' };

        const now = new Date().toISOString();
        let update: Partial<Task> = {};

        if (task.timer_started_at) {
            // Pausar: calcular tempo decorrido
            const start = new Date(task.timer_started_at).getTime();
            const end = new Date(now).getTime();
            const sessionSeconds = Math.floor((end - start) / 1000);
            update = {
                timer_started_at: null,
                elapsed_seconds: (task.elapsed_seconds || 0) + sessionSeconds,
                status: task.status === 'pending' ? 'in_progress' : task.status
            };
        } else {
            // Iniciar: salvar timestamp de início
            update = {
                timer_started_at: now,
                status: task.status === 'pending' ? 'in_progress' : task.status
            };
        }

        const { error } = await (supabase
            .from('tasks') as any)
            .update(update as any)
            .eq('id', taskId);

        if (error) return { error: error.message };
        setTasks(tasks.map(t => t.id === taskId ? { ...t, ...update } : t));
        return { success: true };
    };

    const updateTask = async (id: string, task: Partial<TaskInsert>, subskills?: { id: string, weight: number }[]) => {
        const { error } = await (supabase
            .from('tasks') as any)
            .update(task as any)
            .eq('id', id);

        if (error) return { error: error.message };

        // Sincronizar SubSkills
        if (subskills) {
            // Remover vínculos antigos
            await (supabase.from('task_subskills') as any).delete().eq('task_id', id);

            // Inserir novos vínculos
            if (subskills.length > 0) {
                await (supabase.from('task_subskills') as any).insert(
                    subskills.map(ss => ({
                        task_id: id,
                        subskill_id: ss.id,
                        distribution_weight: ss.weight
                    }) as any)
                );
            }
        }

        setTasks(tasks.map(t => t.id === id ? { ...t, ...task } as Task : t));
        return { success: true };
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) return { error: error.message };
        setTasks(tasks.filter((t) => t.id !== id));
        return { success: true };
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return { tasks, loading, error, addTask, updateTask, updateTaskStatus, toggleTimer, deleteTask, refresh: fetchTasks };
}
