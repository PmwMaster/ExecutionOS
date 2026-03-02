'use client';

import { useEvolution } from '@/hooks/useEvolution';
import { useState } from 'react';
import { Brain, Target, Zap, Plus, ChevronRight, Layers, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function EvolutionPage() {
    const {
        areas, skills, subSkills, loading,
        addArea, addSkill, addSubSkill,
        deleteArea, deleteSkill, deleteSubSkill
    } = useEvolution();
    const [newAreaName, setNewAreaName] = useState('');
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [isAddingArea, setIsAddingArea] = useState(false);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSubSkillName, setNewSubSkillName] = useState('');

    if (loading) return <div className="flex h-96 items-center justify-center text-zinc-500">Carregando evolução...</div>;

    const handleAddArea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAreaName.trim()) return;
        const { data, error } = await addArea(newAreaName);
        if (!error && data) {
            setSelectedAreaId(data.id);
            setNewAreaName('');
            setIsAddingArea(false);
        } else if (error?.includes('unique_area_name_per_user')) {
            alert('Esta área já existe!');
        }
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkillName.trim() || !selectedAreaId) return;
        const { data, error } = await addSkill(selectedAreaId, newSkillName);
        if (!error && data) {
            setSelectedSkillId(data.id);
            setNewSkillName('');
        } else if (error?.includes('unique_skill_name_per_area')) {
            alert('Esta skill já existe nesta área!');
        }
    };

    const handleAddSubSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubSkillName.trim() || !selectedSkillId) return;
        const { error } = await addSubSkill(selectedSkillId, newSubSkillName);
        if (!error) {
            setNewSubSkillName('');
        } else if (error?.includes('unique_subskill_name_per_skill')) {
            alert('Esta subskill já existe nesta skill!');
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Brain className="text-indigo-400" size={32} />
                        Sistema de Evolução
                    </h1>
                    <p className="text-zinc-500 mt-2">Gerencie suas áreas de domínio e suba de nível.</p>
                </div>
                {!isAddingArea && (
                    <button
                        onClick={() => setIsAddingArea(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                    >
                        <Plus size={18} /> Nova Área
                    </button>
                )}
            </div>

            {isAddingArea && (
                <form onSubmit={handleAddArea} className="bg-indigo-600/5 border border-indigo-500/20 p-6 rounded-2xl animate-in zoom-in-95 duration-200">
                    <h3 className="text-white font-bold mb-4">Criar Nova Área de Domínio</h3>
                    <div className="flex gap-4">
                        <input
                            autoFocus
                            placeholder="Ex: Carreira, Fitness, Estudos..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                        />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold transition-all">
                            Criar
                        </button>
                        <button type="button" onClick={() => setIsAddingArea(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-xl font-bold transition-all">
                            X
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. ÁREAS */}
                <div className="space-y-4">
                    <h2 className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                        <Layers size={14} /> Áreas (Domínios)
                    </h2>
                    <div className="space-y-2">
                        {areas.map(area => (
                            <button
                                key={area.id}
                                onClick={() => {
                                    setSelectedAreaId(area.id);
                                    setSelectedSkillId(null);
                                }}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border transition-all group flex items-center justify-between",
                                    selectedAreaId === area.id
                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                                )}
                            >
                                <span className="font-bold">{area.name}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Excluir esta área removerá todas as skills vinculadas. Tem certeza?')) {
                                                deleteArea(area.id);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <ChevronRight size={16} className={cn(
                                        "transition-transform",
                                        selectedAreaId === area.id ? "rotate-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                    )} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. SKILLS */}
                <div className="space-y-4">
                    <h2 className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                        <Target size={14} /> Skills (Habilidades)
                    </h2>
                    <div className="space-y-2">
                        {!selectedAreaId ? (
                            <div className="h-32 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-sm italic">
                                Selecione uma Área
                            </div>
                        ) : (
                            <>
                                {skills.filter(s => s.area_id === selectedAreaId).map(skill => (
                                    <button
                                        key={skill.id}
                                        onClick={() => setSelectedSkillId(skill.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border transition-all group flex items-center justify-between",
                                            selectedSkillId === skill.id
                                                ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/10"
                                                : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                                        )}
                                    >
                                        <div className="space-y-0.5">
                                            <div className="font-bold">{skill.name}</div>
                                            <div className="text-[10px] opacity-70">LEVEL {skill.level}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Excluir esta skill?')) {
                                                        deleteSkill(skill.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <ChevronRight size={16} className={cn(
                                                "transition-transform",
                                                selectedSkillId === skill.id ? "rotate-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                            )} />
                                        </div>
                                    </button>
                                ))}
                                <form onSubmit={handleAddSkill} className="mt-4">
                                    <input
                                        placeholder="+ Adicionar Skill..."
                                        className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl px-4 py-3 text-sm text-zinc-500 outline-none focus:border-amber-500/50 transition-all italic"
                                        value={newSkillName}
                                        onChange={(e) => setNewSkillName(e.target.value)}
                                    />
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. SUBSKILLS */}
                <div className="space-y-4">
                    <h2 className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                        <Zap size={14} /> SubSkills (Especialidades)
                    </h2>
                    <div className="space-y-2">
                        {!selectedSkillId ? (
                            <div className="h-32 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-sm italic">
                                Selecione uma Skill
                            </div>
                        ) : (
                            <>
                                {subSkills.filter(ss => ss.skill_id === selectedSkillId).map(subSkill => (
                                    <div
                                        key={subSkill.id}
                                        className="w-full p-4 rounded-xl border bg-zinc-900/50 border-zinc-800 text-zinc-400 group"
                                    >
                                        <div className="flex items-center justify-between font-bold text-white">
                                            <div className="flex items-center gap-2">
                                                <span>{subSkill.name}</span>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Excluir esta subskill?')) {
                                                            deleteSubSkill(subSkill.id);
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <span className="text-[10px] text-indigo-400">{Math.round(subSkill.total_xp)} XP</span>
                                        </div>
                                        <div className="h-1 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-indigo-500/30" style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                ))}
                                <form onSubmit={handleAddSubSkill} className="mt-4">
                                    <input
                                        placeholder="+ Adicionar SubSkill..."
                                        className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl px-4 py-3 text-sm text-zinc-500 outline-none focus:border-indigo-500/50 transition-all italic"
                                        value={newSubSkillName}
                                        onChange={(e) => setNewSubSkillName(e.target.value)}
                                    />
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl text-center">
                <Brain className="mx-auto text-indigo-500/50 mb-4" size={48} />
                <h2 className="text-xl font-bold text-white mb-2">Configure sua Árvore de Evolução</h2>
                <p className="text-zinc-500 max-w-md mx-auto text-sm">
                    Crie as categorias que definem seu crescimento. Quanto mais você treina SubSkills, mais forte sua Skill principal se torna!
                </p>
                <div className="mt-8">
                    <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        ← Voltar para o Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
