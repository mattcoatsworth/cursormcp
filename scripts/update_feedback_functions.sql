-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_feedback_stats(uuid);

-- Create updated function with endpoint stats
CREATE OR REPLACE FUNCTION public.get_user_feedback_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    WITH feedback_data AS (
        SELECT
            rating,
            query_rating,
            response_rating,
            endpoint_rating,
            created_at
        FROM
            public.user_data
        WHERE
            user_id = p_user_id
            AND is_archived = false
    ),
    stats AS (
        SELECT
            COUNT(*) as total_interactions,
            -- Overall rating stats
            COALESCE(AVG(rating), 0) as avg_rating,
            jsonb_object_agg(
                COALESCE(rating::text, 'null'),
                COUNT(*) FILTER (WHERE rating IS NOT NULL)
            ) FILTER (WHERE rating IS NOT NULL) as rating_distribution,
            -- Query rating stats
            COALESCE(AVG(query_rating), 0) as avg_query_rating,
            jsonb_object_agg(
                COALESCE(query_rating::text, 'null'),
                COUNT(*) FILTER (WHERE query_rating IS NOT NULL)
            ) FILTER (WHERE query_rating IS NOT NULL) as query_rating_distribution,
            -- Response rating stats
            COALESCE(AVG(response_rating), 0) as avg_response_rating,
            jsonb_object_agg(
                COALESCE(response_rating::text, 'null'),
                COUNT(*) FILTER (WHERE response_rating IS NOT NULL)
            ) FILTER (WHERE response_rating IS NOT NULL) as response_rating_distribution,
            -- Endpoint rating stats
            COALESCE(AVG(endpoint_rating), 0) as avg_endpoint_rating,
            jsonb_object_agg(
                COALESCE(endpoint_rating::text, 'null'),
                COUNT(*) FILTER (WHERE endpoint_rating IS NOT NULL)
            ) FILTER (WHERE endpoint_rating IS NOT NULL) as endpoint_rating_distribution
        FROM
            feedback_data
    ),
    time_series AS (
        SELECT
            date_trunc('day', created_at) as day,
            AVG(rating) as avg_rating,
            AVG(query_rating) as avg_query_rating,
            AVG(response_rating) as avg_response_rating,
            AVG(endpoint_rating) as avg_endpoint_rating,
            COUNT(*) as interaction_count
        FROM
            feedback_data
        GROUP BY
            date_trunc('day', created_at)
        ORDER BY
            day DESC
        LIMIT 30
    )
    SELECT
        json_build_object(
            'total_interactions', stats.total_interactions,
            'ratings', json_build_object(
                'overall', json_build_object(
                    'avg', ROUND(stats.avg_rating::numeric, 2),
                    'distribution', COALESCE(stats.rating_distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb)
                ),
                'query', json_build_object(
                    'avg', ROUND(stats.avg_query_rating::numeric, 2),
                    'distribution', COALESCE(stats.query_rating_distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb)
                ),
                'response', json_build_object(
                    'avg', ROUND(stats.avg_response_rating::numeric, 2),
                    'distribution', COALESCE(stats.response_rating_distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb)
                ),
                'endpoint', json_build_object(
                    'avg', ROUND(stats.avg_endpoint_rating::numeric, 2),
                    'distribution', COALESCE(stats.endpoint_rating_distribution, '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb)
                )
            ),
            'feedback_over_time', (
                SELECT json_agg(
                    json_build_object(
                        'date', day,
                        'ratings', json_build_object(
                            'overall', ROUND(avg_rating::numeric, 2),
                            'query', ROUND(avg_query_rating::numeric, 2),
                            'response', ROUND(avg_response_rating::numeric, 2),
                            'endpoint', ROUND(avg_endpoint_rating::numeric, 2)
                        ),
                        'interaction_count', interaction_count
                    )
                )
                FROM time_series
            )
        ) INTO result
    FROM stats;

    RETURN result;
END;
$$;
