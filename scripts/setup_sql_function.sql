-- Create execute_sql function
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role; 