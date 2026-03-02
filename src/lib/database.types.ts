export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            projects: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    type: 'renda' | 'estudo' | 'produto' | 'pessoal'
                    impact: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    type: 'renda' | 'estudo' | 'produto' | 'pessoal'
                    impact: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    type?: 'renda' | 'estudo' | 'produto' | 'pessoal'
                    impact?: number
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    user_id: string
                    project_id: string
                    name: string
                    description: string | null
                    impact: number
                    duration_minutes: number
                    deadline: string | null
                    status: 'pending' | 'in_progress' | 'done'
                    elapsed_seconds: number
                    timer_started_at: string | null
                    skill: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    project_id: string
                    name: string
                    description?: string | null
                    impact: number
                    duration_minutes: number
                    deadline?: string | null
                    status?: 'pending' | 'in_progress' | 'done'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    project_id?: string
                    name?: string
                    description?: string | null
                    impact?: number
                    duration_minutes?: number
                    deadline?: string | null
                    status?: 'pending' | 'in_progress' | 'done'
                    created_at?: string
                }
            }
            areas: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    total_xp: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    total_xp?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    total_xp?: number
                    created_at?: string
                }
            }
            skills: {
                Row: {
                    id: string
                    user_id: string
                    area_id: string
                    name: string
                    level: number
                    current_xp: number
                    max_xp: number
                    status: 'active' | 'completed' | 'archived'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    area_id: string
                    name: string
                    level?: number
                    current_xp?: number
                    max_xp?: number
                    status?: 'active' | 'completed' | 'archived'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    area_id?: string
                    name?: string
                    level?: number
                    current_xp?: number
                    max_xp?: number
                    status?: 'active' | 'completed' | 'archived'
                    created_at?: string
                }
            }
            subskills: {
                Row: {
                    id: string
                    user_id: string
                    skill_id: string
                    name: string
                    total_xp: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    skill_id: string
                    name: string
                    total_xp?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    skill_id?: string
                    name?: string
                    total_xp?: number
                    created_at?: string
                }
            }
            task_subskills: {
                Row: {
                    task_id: string
                    subskill_id: string
                    distribution_weight: number
                    normalized_weight: number
                }
                Insert: {
                    task_id: string
                    subskill_id: string
                    distribution_weight?: number
                    normalized_weight?: number
                }
                Update: {
                    task_id?: string
                    subskill_id?: string
                    distribution_weight?: number
                    normalized_weight?: number
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            increment_subskill_xp: {
                Args: {
                    sub_id: string
                    xp_amount: number
                }
                Returns: void
            }
            increment_area_xp: {
                Args: {
                    a_id: string
                    xp_amount: number
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
