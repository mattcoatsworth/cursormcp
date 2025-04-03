-- Function to create a user
CREATE OR REPLACE FUNCTION create_user(
    user_email text,
    user_password text,
    user_data jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz
) AS $$
DECLARE
    new_user_id uuid;
    result record;
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_email,
        crypt(user_password, gen_salt('bf')),
        CASE 
            WHEN (user_data->>'email_confirmed')::boolean 
            THEN now() 
            ELSE null 
        END,
        null,
        null,
        '{"provider":"email","providers":["email"]}'::jsonb,
        user_data,
        now(),
        now(),
        encode(gen_random_bytes(32), 'base64'),
        null,
        null,
        null
    )
    RETURNING * INTO result;

    RETURN QUERY SELECT 
        result.id,
        result.email,
        result.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 