'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Area = Database['public']['Tables']['areas']['Row'];
type Skill = Database['public']['Tables']['skills']['Row'];
type SubSkill = Database['public']['Tables']['subskills']['Row'];

export function useEvolution() {
    const supabase = createClient();
    const [areas, setAreas] = useState<Area[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [subSkills, setSubSkills] = useState<SubSkill[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [areasRes, skillsRes, subSkillsRes] = await Promise.all([
                (supabase.from('areas') as any).select('*').order('name'),
                (supabase.from('skills') as any).select('*').order('name'),
                (supabase.from('subskills') as any).select('*').order('name')
            ]);

            if (areasRes.data) setAreas(areasRes.data);
            if (skillsRes.data) setSkills(skillsRes.data);
            if (subSkillsRes.data) setSubSkills(subSkillsRes.data);
        } catch (error) {
            console.error('Error fetching evolution data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addArea = async (name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await (supabase
            .from('areas') as any)
            .insert([{ name, user_id: user.id } as any])
            .select()
            .single();

        if (!error && data) setAreas(prev => [...prev, data as Area]);
        return { data, error };
    };

    const addSkill = async (areaId: string, name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await (supabase
            .from('skills') as any)
            .insert([{
                area_id: areaId,
                name,
                user_id: user.id,
                current_xp: 0,
                max_xp: 10000,
                level: 1,
                status: 'active'
            } as any])
            .select()
            .single();

        if (!error && data) setSkills(prev => [...prev, data as Skill]);
        return { data, error };
    };

    const addSubSkill = async (skillId: string, name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { data, error } = await (supabase
            .from('subskills') as any)
            .insert([{ skill_id: skillId, name, user_id: user.id, total_xp: 0 } as any])
            .select()
            .single();

        if (!error && data) setSubSkills(prev => [...prev, data as SubSkill]);
        return { data, error };
    };

    const deleteArea = async (id: string) => {
        const { error } = await (supabase.from('areas') as any).delete().eq('id', id);
        if (!error) {
            setAreas(prev => prev.filter(a => a.id !== id));
            // Cascade local state update
            const affectedSkills = skills.filter(s => s.area_id === id).map(s => s.id);
            setSkills(prev => prev.filter(s => s.area_id !== id));
            setSubSkills(prev => prev.filter(ss => !affectedSkills.includes(ss.skill_id)));
        }
        return { error };
    };

    const deleteSkill = async (id: string) => {
        const { error } = await (supabase.from('skills') as any).delete().eq('id', id);
        if (!error) {
            setSkills(prev => prev.filter(s => s.id !== id));
            // Cascade local state update
            setSubSkills(prev => prev.filter(ss => ss.skill_id !== id));
        }
        return { error };
    };

    const deleteSubSkill = async (id: string) => {
        const { error } = await (supabase.from('subskills') as any).delete().eq('id', id);
        if (!error) setSubSkills(prev => prev.filter(s => s.id !== id));
        return { error };
    };

    return {
        areas,
        skills,
        subSkills,
        loading,
        addArea,
        addSkill,
        addSubSkill,
        deleteArea,
        deleteSkill,
        deleteSubSkill,
        refresh: fetchData
    };
}
