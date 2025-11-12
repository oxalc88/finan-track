-- Create investments table
CREATE TYPE investment_type AS ENUM ('stocks', 'bonds', 'real_estate', 'crypto', 'other');

CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type investment_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20),
    quantity DECIMAL(15,4),
    purchase_price DECIMAL(15,2),
    current_value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    purchase_date DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_user_id_active ON investments(user_id, is_active);
CREATE INDEX idx_investments_type ON investments(type);

-- Create trigger for updated_at
CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
