-- Add updated_at to OD Intakes
ALTER TABLE public.od_intake_responses
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at to Employer Intakes
ALTER TABLE public.employer_intake_responses
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger for OD Intakes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_od_intake_updated_at
    BEFORE UPDATE ON public.od_intake_responses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for Employer Intakes
CREATE OR REPLACE TRIGGER update_employer_intake_updated_at
    BEFORE UPDATE ON public.employer_intake_responses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
