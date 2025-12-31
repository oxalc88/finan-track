-- Create invoices table
CREATE TYPE ocr_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_key VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000),
    file_type VARCHAR(50),
    ocr_status ocr_status NOT NULL DEFAULT 'pending',
    vendor_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    subtotal DECIMAL(15,2),
    tax DECIMAL(15,2),
    total DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    raw_ocr_text TEXT,
    ocr_data JSONB,
    confidence_score DECIMAL(5,2),
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(ocr_status);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, ocr_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_vendor ON invoices(vendor_name);

-- Create GIN index on JSONB column for efficient querying
CREATE INDEX idx_invoices_ocr_data ON invoices USING GIN (ocr_data);

-- Create trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
