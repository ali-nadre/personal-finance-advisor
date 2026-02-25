-- Add currency column to households table
ALTER TABLE households
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN (
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SEK', 'NZD',
  'INR', 'BRL', 'ZAR', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB',
  'AED', 'SAR', 'EGP', 'MAD', 'NGN', 'KES', 'GHS', 'TZS', 'UGX', 'DZD'
));

-- Update existing households to use USD as default
UPDATE households SET currency = 'USD' WHERE currency IS NULL;
