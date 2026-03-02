'use client';

import { createClient } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { useEffect, useState } from 'react';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                setError(error.message + " (verifique se as tabelas foram criadas no Supabase)");
            } else {
                setProjects(data || []);
            }
        } catch (err: any) {
            setError("Erro de conexão: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addProject = async (project: Omit<ProjectInsert, 'user_id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await (supabase
            .from('projects') as any)
            .insert([{ ...project, user_id: user.id }])
            .select()
            .single();

        if (error) return { error: error.message };
        setProjects([data, ...projects]);
        return { data };
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) return { error: error.message };
        setProjects(projects.filter((p) => p.id !== id));
        return { success: true };
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return { projects, loading, error, addProject, deleteProject, refresh: fetchProjects };
}
