-- Check for existing data that might conflict with new schema
SELECT 
    'Users' as table_name, 
    COUNT(*) as count 
FROM "User"
UNION ALL
SELECT 
    'Invoices' as table_name, 
    COUNT(*) as count 
FROM "Invoice"
UNION ALL
SELECT 
    'Clients' as table_name, 
    COUNT(*) as count 
FROM "Client";

-- Check for duplicate invoice numbers (will conflict with new unique constraint)
SELECT 
    "invoiceNumber", 
    COUNT(*) as count 
FROM "Invoice" 
GROUP BY "invoiceNumber" 
HAVING COUNT(*) > 1;

