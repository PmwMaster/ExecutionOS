'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
    elapsedSeconds: number;
    timerStartedAt: string | null;
    onToggle: () => void;
    className?: string;
}

export function TaskTimer({ elapsedSeconds, timerStartedAt, onToggle, className }: TaskTimerProps) {
    const [displaySeconds, setDisplaySeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const updateDisplay = () => {
            if (timerStartedAt) {
                const start = new Date(timerStartedAt).getTime();
                const now = new Date().getTime();
                const currentSessionSeconds = Math.floor((now - start) / 1000);
                setDisplaySeconds(elapsedSeconds + currentSessionSeconds);
            } else {
                setDisplaySeconds(elapsedSeconds);
            }
        };

        updateDisplay();

        if (timerStartedAt) {
            interval = setInterval(updateDisplay, 1000);
        }

        return () => clearInterval(interval);
    }, [elapsedSeconds, timerStartedAt]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [h, m, s]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":");
    };

    const isActive = !!timerStartedAt;

    return (
        <div className={cn("flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4", className)}>
            <div className="flex items-center gap-2 text-zinc-400">
                <Clock size={18} />
                <span className="font-mono text-xl font-bold tabular-nums text-white">
                    {formatTime(displaySeconds)}
                </span>
            </div>

            <button
                onClick={onToggle}
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                    isActive
                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                )}
            >
                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
        </div>
    );
}
