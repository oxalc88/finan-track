-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    last_four VARCHAR(4),
    issuer VARCHAR(255),
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit_limit DECIMAL(15,2) NOT NULL,
    minimum_payment DECIMAL(10,2),
    due_date DATE,
    statement_closing_date DATE,
    apr DECIMAL(5,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add computed columns for available_credit and utilization
ALTER TABLE credit_cards
ADD COLUMN available_credit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED;

ALTER TABLE credit_cards
ADD COLUMN utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
        WHEN credit_limit > 0 THEN (current_balance / credit_limit) * 100
        ELSE 0
    END
) STORED;

-- Create indexes
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_user_id_active ON credit_cards(user_id, is_active);
CREATE INDEX idx_credit_cards_due_date ON credit_cards(due_date) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_credit_cards_updated_at
    BEFORE UPDATE ON credit_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
