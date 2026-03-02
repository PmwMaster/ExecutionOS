'use client';

import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { calculateTaskScore, getTopPriorityTask, calculateProjectProgress } from '@/lib/priority';
import { Rocket, Target, Zap, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { TaskTimer } from '@/components/TaskTimer';
import { useEvolution } from '@/hooks/useEvolution';
import { RadarChart } from '@/components/RadarChart';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Brain, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { tasks, loading: loadingTasks, updateTaskStatus, toggleTimer } = useTasks();
  const { projects, loading: loadingProjects } = useProjects();
  const { skills, loading: loadingEvolution } = useEvolution();
  const [recommendedTask, setRecommendedTask] = useState<any>(null);

  const stats = useMemo(() => {
    const pending = tasks.filter(t => t.status !== 'done').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const completionRate = tasks.length > 0 ? (done / tasks.length) * 100 : 0;

    return { pending, done, completionRate: Math.round(completionRate) };
  }, [tasks]);

  const topPriorityTask = useMemo(() => getTopPriorityTask(tasks), [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter(t => t.status !== 'done')
      .sort((a, b) => calculateTaskScore(b) - calculateTaskScore(a))
      .slice(0, 5);
  }, [tasks]);

  const handleRecommend = () => {
    if (topPriorityTask) {
      setRecommendedTask(topPriorityTask);
    } else {
      alert("Nenhuma tarefa pendente encontrada!");
    }
  };

  const activeProjectCount = projects.length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-400">Bem-vindo ao seu motor de execução.</p>
        </div>
        {!recommendedTask && topPriorityTask && (
          <button
            onClick={handleRecommend}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95"
          >
            <Rocket size={24} />
            O que devo fazer agora?
          </button>
        )}
      </div>

      {(recommendedTask || topPriorityTask) && (
        <div className={cn(
          "rounded-2xl border-2 p-8 transition-all duration-500",
          recommendedTask ? "border-indigo-500 bg-indigo-600/10 scale-100" : "border-zinc-800 bg-zinc-900/30 scale-95 opacity-80 hover:opacity-100"
        )}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                recommendedTask ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
              )}>
                {recommendedTask ? "🎯 Foco Atual" : "💡 Recomendação Automática"}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white">{(recommendedTask || topPriorityTask).name}</h2>
              <p className="mt-2 text-zinc-400">{(recommendedTask || topPriorityTask).description || 'Foque nesta tarefa para maximizar seu impacto hoje.'}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-zinc-500 uppercase">Score de Prioridade</div>
              <div className="text-4xl font-black text-indigo-400">{calculateTaskScore(recommendedTask || topPriorityTask)}</div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  updateTaskStatus((recommendedTask || topPriorityTask).id, 'done');
                  setRecommendedTask(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition-all hover:bg-green-500 shadow-lg shadow-green-600/20"
              >
                <CheckCircle2 size={20} />
                Marcar como Feito
              </button>
              {recommendedTask && (
                <button
                  onClick={() => setRecommendedTask(null)}
                  className="px-6 py-3 font-medium text-zinc-500 hover:text-white"
                >
                  Dispensar Foco
                </button>
              )}
            </div>

            <TaskTimer
              elapsedSeconds={(recommendedTask || topPriorityTask).elapsed_seconds || 0}
              timerStartedAt={(recommendedTask || topPriorityTask).timer_started_at}
              onToggle={() => toggleTimer((recommendedTask || topPriorityTask).id)}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 text-zinc-400">
            <Target size={20} />
            <span className="text-sm font-medium uppercase">Projetos Ativos</span>
          </div>
          <div className="mt-2 text-3xl font-bold">{activeProjectCount}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 text-zinc-400">
            <Zap size={20} />
            <span className="text-sm font-medium uppercase">Tarefas Pendentes</span>
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.pending}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 text-zinc-400">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium uppercase">Conclusão</span>
          </div>
          <div className="mt-2 text-3xl font-bold">{stats.completionRate}%</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Top Prioridades</h3>
            <Link href="/tasks" className="text-sm font-medium text-indigo-400 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {sortedTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:bg-zinc-800/50">
                <div>
                  <div className="font-bold">{task.name}</div>
                  <div className="text-xs text-zinc-500">{task.duration_minutes} min • Impacto {task.impact}</div>
                </div>
                <div className="text-lg font-black text-indigo-400">{calculateTaskScore(task)}</div>
              </div>
            ))}
            {!loadingTasks && sortedTasks.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">Nada para fazer agora. Descanso merecido?</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Projetos Recentes</h3>
            <Link href="/projects" className="text-sm font-medium text-indigo-400 hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 5).map(project => {
              const progress = calculateProjectProgress(project.id, tasks);
              const projectTasks = tasks.filter(t => t.project_id === project.id);
              const totalSeconds = projectTasks.reduce((acc, t) => acc + (t.elapsed_seconds || 0), 0);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);

              return (
                <div key={project.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-colors hover:bg-zinc-800/50">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <div>
                        <div className="font-bold">{project.name}</div>
                        {totalSeconds > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-medium">
                            <Clock size={10} />
                            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} investidos
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                      <ArrowRight size={16} className="text-zinc-600 hover:text-indigo-400" />
                    </Link>
                  </div>
                  <ProgressBar progress={progress} showText />
                </div>
              );
            })}
            {!loadingProjects && projects.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">Comece seu primeiro projeto.</p>
            )}
          </div>
        </div>
      </div>

      {/* Global Evolution Section */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-600/20 p-2 text-indigo-400">
                <Brain size={24} />
              </div>
              <h3 className="text-2xl font-bold">Evolução Global</h3>
            </div>
            <p className="text-zinc-400 max-w-md">
              Acompanhe seu progresso através de todas as áreas de domínio. Cada tarefa concluída fortalece suas habilidades e expande sua base de conhecimento.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {skills.slice(0, 4).map(skill => (
                <div key={skill.id} className="rounded-xl bg-zinc-800/50 p-4 border border-zinc-700/50">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{skill.name}</div>
                  <div className="mt-1 text-lg font-black text-white">Lvl {skill.level}</div>
                  <div className="mt-2 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(skill.current_xp / skill.max_xp) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/evolution"
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Gerenciar Hierarquia de Skills <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex items-center justify-center lg:w-[400px]">
            {skills.length >= 3 ? (
              <RadarChart
                data={skills.map(s => ({ label: s.name, value: s.current_xp + (s.level - 1) * 10000 }))}
                size={380}
              />
            ) : (
              <div className="text-center p-8 border border-dashed border-zinc-800 rounded-2xl">
                <Sparkles className="mx-auto text-zinc-700 mb-4" size={48} />
                <p className="text-zinc-500 text-sm italic">
                  Defina e evolua pelo menos 3 habilidades para desbloquear seu mapa de maestria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
