-- Create debts table
CREATE TYPE debt_term_type AS ENUM ('short_term', 'long_term');
CREATE TYPE debt_category AS ENUM ('loan', 'mortgage', 'student_loan', 'personal_loan', 'other');

CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type debt_term_type NOT NULL,
    category debt_category NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2),
    minimum_payment DECIMAL(10,2),
    due_date DATE,
    lender VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_user_id_active ON debts(user_id, is_active);
CREATE INDEX idx_debts_due_date ON debts(due_date) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
