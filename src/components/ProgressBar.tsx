'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
    progress: number;
    className?: string;
    showText?: boolean;
}

export function ProgressBar({ progress, className, showText = false }: ProgressBarProps) {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={cn("w-full space-y-1.5", className)}>
            {showText && (
                <div className="flex justify-between text-xs font-medium text-zinc-500">
                    <span>Progresso</span>
                    <span>{clampedProgress}%</span>
                </div>
            )}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
}
