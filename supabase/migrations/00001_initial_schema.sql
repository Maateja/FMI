-- Migration 00001: Initial FMI Database Schema with Row Level Security (RLS)

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    target_role TEXT DEFAULT 'Full Stack Developer',
    target_experience_level TEXT DEFAULT 'Fresher',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. User Roles Table (Role-based access control)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Interview Templates Table
CREATE TABLE IF NOT EXISTS interview_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    role TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'fresher' CHECK (difficulty IN ('fresher', 'junior', 'intermediate', 'senior')),
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Question Bank Table
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL CHECK (domain IN ('hr', 'frontend', 'backend', 'data_ml')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('fresher', 'junior', 'intermediate', 'senior')),
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    expected_key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    probing_follow_ups JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_domain_diff ON question_bank(domain, difficulty);

-- 6. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES interview_templates(id) ON DELETE SET NULL,
    target_role TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'fresher',
    status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'warmup', 'hr', 'technical', 'closing', 'processing', 'completed', 'abandoned', 'error')),
    livekit_room_name TEXT NOT NULL UNIQUE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Interview Turns Table
CREATE TABLE IF NOT EXISTS interview_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_id UUID REFERENCES question_bank(id) ON DELETE SET NULL,
    turn_number INTEGER NOT NULL,
    round TEXT NOT NULL CHECK (round IN ('warmup', 'hr', 'technical', 'closing')),
    interviewer_question TEXT NOT NULL,
    user_transcript TEXT,
    word_timestamps JSONB DEFAULT '[]'::jsonb,
    duration_seconds NUMERIC(6, 2) DEFAULT 0.0,
    turn_metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turns_interview_id ON interview_turns(interview_id);
CREATE INDEX IF NOT EXISTS idx_turns_interview_round ON interview_turns(interview_id, round);

-- 8. Body Metrics Table (Aggregated client vision metrics)
CREATE TABLE IF NOT EXISTS body_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    timestamp_offset_seconds NUMERIC(8, 2) NOT NULL,
    eye_contact_score NUMERIC(4, 3) NOT NULL,
    head_pose_stability NUMERIC(4, 3) NOT NULL,
    posture_score NUMERIC(4, 3) NOT NULL,
    expressiveness_score NUMERIC(4, 3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_interview_id ON body_metrics(interview_id);

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    communication_score INTEGER NOT NULL CHECK (communication_score BETWEEN 0 AND 100),
    technical_score INTEGER NOT NULL CHECK (technical_score BETWEEN 0 AND 100),
    body_language_score INTEGER NOT NULL CHECK (body_language_score BETWEEN 0 AND 100),
    summary TEXT NOT NULL,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    speech_analytics JSONB NOT NULL DEFAULT '{}'::jsonb,
    body_analytics JSONB NOT NULL DEFAULT '{}'::jsonb,
    per_question_feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- 10. Resources Table (Curated learning links)
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'video', 'documentation', 'practice')),
    skill_gap_tag TEXT NOT NULL,
    domain TEXT NOT NULL CHECK (domain IN ('hr', 'frontend', 'backend', 'data_ml', 'general_communication')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_skill_gap ON resources(skill_gap_tag);

-- 11. Report Resources Junction Table
CREATE TABLE IF NOT EXISTS report_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_resources_report_id ON report_resources(report_id);

-- 12. Consents Table
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    microphone_consent BOOLEAN NOT NULL DEFAULT true,
    camera_consent BOOLEAN NOT NULL DEFAULT false,
    audio_recording_consent BOOLEAN NOT NULL DEFAULT false,
    ai_training_notice_acknowledged BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user_interview ON consents(user_id, interview_id);

-- 13. Usage Limits Table
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    interviews_conducted_count INTEGER NOT NULL DEFAULT 0,
    daily_limit INTEGER NOT NULL DEFAULT 5,
    total_limit INTEGER NOT NULL DEFAULT 30,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Profiles: Users manage their own profile; admins can read all
CREATE POLICY profiles_user_policy ON profiles
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- User Roles: Read own role, admin can manage all
CREATE POLICY user_roles_read_own ON user_roles
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY user_roles_admin_write ON user_roles
    FOR ALL USING (is_admin())
    WITH CHECK (is_admin());

-- Interview Templates: Authenticated users can read active templates, admin can write
CREATE POLICY templates_read_auth ON interview_templates
    FOR SELECT TO authenticated
    USING (is_active = true OR is_admin());

CREATE POLICY templates_admin_write ON interview_templates
    FOR ALL USING (is_admin())
    WITH CHECK (is_admin());

-- Question Bank: Authenticated users can read, admin can write
CREATE POLICY question_bank_read_auth ON question_bank
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY question_bank_admin_write ON question_bank
    FOR ALL USING (is_admin())
    WITH CHECK (is_admin());

-- Resources: Authenticated users can read, admin can write
CREATE POLICY resources_read_auth ON resources
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY resources_admin_write ON resources
    FOR ALL USING (is_admin())
    WITH CHECK (is_admin());

-- Interviews: Users manage their own interviews
CREATE POLICY interviews_user_policy ON interviews
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Interview Turns: Users access turns belonging to their interviews
CREATE POLICY turns_user_policy ON interview_turns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = interview_turns.interview_id
              AND interviews.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = interview_turns.interview_id
              AND interviews.user_id = auth.uid()
        )
    );

-- Body Metrics: Users access body metrics for their interviews
CREATE POLICY body_metrics_user_policy ON body_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = body_metrics.interview_id
              AND interviews.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = body_metrics.interview_id
              AND interviews.user_id = auth.uid()
        )
    );

-- Reports: Users manage their own reports
CREATE POLICY reports_user_policy ON reports
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Report Resources: Users access resources linked to their own reports
CREATE POLICY report_resources_user_policy ON report_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM reports
            WHERE reports.id = report_resources.report_id
              AND reports.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reports
            WHERE reports.id = report_resources.report_id
              AND reports.user_id = auth.uid()
        )
    );

-- Consents: Users manage their own consent records
CREATE POLICY consents_user_policy ON consents
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Usage Limits: Users can read their own limits; system updates via service role or admin
CREATE POLICY usage_limits_user_policy ON usage_limits
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Automatically create profile and usage limits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.usage_limits (user_id, interviews_conducted_count, daily_limit, total_limit)
    VALUES (NEW.id, 0, 5, 30)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

