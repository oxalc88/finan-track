-- Create categories table
CREATE TYPE category_type AS ENUM ('income', 'expense');

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type category_type NOT NULL,
    color VARCHAR(7),
    icon VARCHAR(50),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_system ON categories(is_system);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system categories
INSERT INTO categories (name, type, color, icon, is_system) VALUES
    -- Expense categories
    ('Food & Dining', 'expense', '#FF6B6B', 'restaurant', true),
    ('Transportation', 'expense', '#4ECDC4', 'car', true),
    ('Shopping', 'expense', '#45B7D1', 'shopping-bag', true),
    ('Entertainment', 'expense', '#96CEB4', 'film', true),
    ('Bills & Utilities', 'expense', '#FFEAA7', 'receipt', true),
    ('Healthcare', 'expense', '#DFE6E9', 'heart', true),
    ('Education', 'expense', '#74B9FF', 'book', true),
    ('Personal Care', 'expense', '#A29BFE', 'user', true),
    ('Travel', 'expense', '#FD79A8', 'plane', true),
    ('Insurance', 'expense', '#636E72', 'shield', true),
    ('Other Expense', 'expense', '#B2BEC3', 'dots-horizontal', true),

    -- Income categories
    ('Salary', 'income', '#00B894', 'briefcase', true),
    ('Freelance', 'income', '#00CEC9', 'code', true),
    ('Investment Income', 'income', '#0984E3', 'trending-up', true),
    ('Rental Income', 'income', '#6C5CE7', 'home', true),
    ('Business Income', 'income', '#FDCB6E', 'store', true),
    ('Other Income', 'income', '#2D3436', 'plus-circle', true);
