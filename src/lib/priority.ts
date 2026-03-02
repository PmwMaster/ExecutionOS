import { Database } from './database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export function calculateTaskScore(task: Task): number {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;

    let urgency = 1;

    if (deadline) {
        const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 0) {
            // Tarefa vencida: urgência máxima
            urgency = 10;
        } else if (diffInHours <= 24) {
            // Menos de 24 horas: urgência alta
            urgency = 5;
        } else if (diffInHours <= 72) {
            // Entre 1 e 3 dias: urgência média
            urgency = 2.5;
        } else {
            // Mais de 3 dias: urgência padrão
            urgency = 1.5;
        }
    }

    // Fórmula: score = (impact * urgency) / duration
    // Multiplicamos por 100 para ter números mais amigáveis
    const score = (task.impact * urgency * 100) / task.duration_minutes;

    return Number(score.toFixed(2));
}

export function getTopPriorityTask(tasks: Task[]): Task | null {
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    if (pendingTasks.length === 0) return null;

    return pendingTasks.reduce((prev, current) => {
        return calculateTaskScore(prev) > calculateTaskScore(current) ? prev : current;
    });
}

export function calculateProjectProgress(projectId: string, tasks: Task[]): number {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    if (projectTasks.length === 0) return 0;

    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
}
