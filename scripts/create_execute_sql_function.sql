-- Create a function to execute SQL commands
CREATE OR REPLACE FUNCTION execute_sql(sql_command text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Execute the SQL command and return the result as JSON
  EXECUTE sql_command;
  
  -- Return a success message
  result := json_build_object('status', 'success', 'message', 'SQL command executed successfully');
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return an error message
    result := json_build_object('status', 'error', 'message', SQLERRM);
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role; 