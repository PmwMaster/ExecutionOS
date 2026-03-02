'use client';

import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    itemName?: string;
    isLoading?: boolean;
}

export function DeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Excluir Item",
    itemName,
    isLoading
}: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-red-500/10 p-3 text-red-500">
                        <AlertTriangle size={32} />
                    </div>

                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <p className="mt-2 text-zinc-400">
                        Você tem certeza que deseja excluir <span className="font-bold text-zinc-200">{itemName || 'este item'}</span>?
                        Esta ação não pode ser desfeita.
                    </p>

                    <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Excluindo...' : 'Sim, excluir'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
