-- ExecutionOS Schema V2: Níveis Hierárquicos e Sistema de XP

CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_xp FLOAT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- 2. Skills (Habilidades dentro da Área)
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    current_xp FLOAT DEFAULT 0 NOT NULL,
    max_xp FLOAT DEFAULT 10000 NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(area_id, name)
);

-- 3. SubSkills (Especializações da Habilidade)
CREATE TABLE IF NOT EXISTS subskills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_xp FLOAT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(skill_id, name)
);

-- 4. Relacionamento Tarefa <-> SubSkill (N:N)
-- Permite que uma tarefa impacte múltiplas subskills
CREATE TABLE IF NOT EXISTS task_subskills (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    subskill_id UUID NOT NULL REFERENCES subskills(id) ON DELETE CASCADE,
    distribution_weight FLOAT DEFAULT 1.0 NOT NULL, -- Peso manual
    normalized_weight FLOAT DEFAULT 1.0 NOT NULL, -- Peso calculado pela lógica
    PRIMARY KEY (task_id, subskill_id)
);

-- Habilitar RLS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE subskills ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_subskills ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso por usuário
CREATE POLICY "Users can manage their own areas" ON areas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own skills" ON skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subskills" ON subskills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own task_subskills" ON task_subskills 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_id AND tasks.user_id = auth.uid())
    );

-- 5. Funções de Incremento de XP (RPC)

-- Incrementar XP de SubSkill e propagar na hierarquia
CREATE OR REPLACE FUNCTION increment_subskill_xp(sub_id UUID, xp_amount FLOAT)
RETURNS VOID AS $$
DECLARE
    v_skill_id UUID;
    v_area_id UUID;
    v_current_xp FLOAT;
    v_max_xp FLOAT;
    v_level INTEGER;
BEGIN
    -- 1. Atualizar SubSkill
    UPDATE subskills 
    SET total_xp = total_xp + xp_amount 
    WHERE id = sub_id 
    RETURNING skill_id INTO v_skill_id;

    -- 2. Atualizar Skill e gerenciar Level Up
    IF v_skill_id IS NOT NULL THEN
        UPDATE skills
        SET current_xp = current_xp + xp_amount
        WHERE id = v_skill_id
        RETURNING current_xp, max_xp, level, area_id INTO v_current_xp, v_max_xp, v_level, v_area_id;

        -- Loop de Level Up (caso ganhe muito XP de uma vez)
        WHILE v_current_xp >= v_max_xp LOOP
            v_current_xp := v_current_xp - v_max_xp;
            v_level := v_level + 1;
            v_max_xp := v_max_xp + 5000; -- Aumenta dificuldade

            UPDATE skills
            SET level = v_level,
                current_xp = v_current_xp,
                max_xp = v_max_xp
            WHERE id = v_skill_id;
        END LOOP;

        -- 3. Atualizar Área pai
        IF v_area_id IS NOT NULL THEN
            UPDATE areas
            SET total_xp = total_xp + xp_amount
            WHERE id = v_area_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para normalizar pesos (Opcional, mas recomendado para consistência)
-- ... (implementar conforme necessário)
