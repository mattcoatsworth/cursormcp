\d api_endpoints;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'api_endpoints'
ORDER BY ordinal_position; 