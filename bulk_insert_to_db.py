import os
import json
import argparse
import time
from datetime import datetime

"""
This script bulk inserts locally generated training data into the database.
It reads the JSON files stored in the local_training_data directory and inserts them
into the database using direct SQL commands.
"""

def main():
    parser = argparse.ArgumentParser(description="Bulk insert training data from local files to database")
    parser.add_argument("--dir", default="training_data_local", help="Directory with training data JSON files")
    parser.add_argument("--output", help="Output SQL file to generate (if not directly executing)")
    parser.add_argument("--execute", action="store_true", help="Execute the SQL directly (requires psycopg2)")
    parser.add_argument("--batch", type=int, default=50, help="Batch size for inserts")
    
    args = parser.parse_args()
    
    # Check if directory exists
    if not os.path.exists(args.dir):
        print(f"Error: Directory {args.dir} does not exist.")
        return
    
    # Get list of all JSON files
    json_files = [f for f in os.listdir(args.dir) if f.endswith('.json')]
    
    if not json_files:
        print(f"No JSON files found in {args.dir}")
        return
    
    print(f"Found {len(json_files)} JSON files to process")
    
    # Process files
    sql_commands = []
    records = []
    
    for filename in json_files:
        file_path = os.path.join(args.dir, filename)
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
            # Extract relevant fields
            record = {
                'id': data.get('id', f"gen-{int(time.time())}-{len(records)}"),
                'tool': data.get('tool', 'Unknown'),
                'intent': data.get('intent', 'Unknown'),
                'query': data.get('query', '').replace("'", "''"),  # Escape single quotes
                'response': data.get('response', '').replace("'", "''"),  # Escape single quotes
                'metadata': json.dumps(data.get('metadata', {})),
                'created_at': data.get('createdAt', datetime.now().isoformat()),
                'updated_at': data.get('updatedAt', datetime.now().isoformat())
            }
            
            records.append(record)
            
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Generate SQL statements
    if args.output or not args.execute:
        sql = generate_sql_file(records, args.batch)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(sql)
            print(f"SQL commands written to {args.output}")
        else:
            print(sql)
    
    # Execute SQL directly if requested
    if args.execute:
        try:
            import psycopg2
            from psycopg2.extras import execute_values
            
            # Get database connection from environment variable
            conn_string = os.environ.get('DATABASE_URL')
            
            if not conn_string:
                print("Error: DATABASE_URL environment variable not set")
                return
            
            print(f"Connecting to database...")
            conn = psycopg2.connect(conn_string)
            cursor = conn.cursor()
            
            # Make sure the table exists
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS training_data (
                id TEXT PRIMARY KEY,
                tool TEXT NOT NULL,
                intent TEXT NOT NULL,
                query TEXT NOT NULL,
                response TEXT NOT NULL,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
            """)
            
            # Use execute_values for more efficient batch inserts
            data_tuples = [(
                r['id'], 
                r['tool'], 
                r['intent'], 
                r['query'], 
                r['response'], 
                r['metadata'], 
                r['created_at'], 
                r['updated_at']
            ) for r in records]
            
            execute_values(
                cursor,
                """
                INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at)
                VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    tool = EXCLUDED.tool,
                    intent = EXCLUDED.intent,
                    query = EXCLUDED.query,
                    response = EXCLUDED.response,
                    metadata = EXCLUDED.metadata,
                    updated_at = EXCLUDED.updated_at
                """,
                data_tuples,
                page_size=args.batch
            )
            
            # Commit changes
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"Successfully inserted/updated {len(records)} records")
            
        except ImportError:
            print("Error: psycopg2 package is required for direct database execution")
            print("Install it with: pip install psycopg2-binary")
        except Exception as e:
            print(f"Error executing SQL: {e}")

def generate_sql_file(records, batch_size=50):
    """Generate SQL commands for inserting records"""
    sql_commands = [
        "-- SQL commands for importing training data",
        "-- Generated at " + datetime.now().isoformat(),
        "",
        "-- Create table if it doesn't exist",
        "CREATE TABLE IF NOT EXISTS training_data (",
        "    id TEXT PRIMARY KEY,",
        "    tool TEXT NOT NULL,",
        "    intent TEXT NOT NULL,",
        "    query TEXT NOT NULL,",
        "    response TEXT NOT NULL,",
        "    metadata JSONB DEFAULT '{}'::jsonb,",
        "    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),",
        "    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
        ");",
        ""
    ]
    
    # Process in batches
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        
        sql_commands.append(f"-- Batch {i//batch_size + 1}")
        insert_sql = "INSERT INTO training_data (id, tool, intent, query, response, metadata, created_at, updated_at) VALUES\n"
        
        values = []
        for idx, record in enumerate(batch):
            value = "("
            value += f"'{record['id']}', "
            value += f"'{record['tool']}', "
            value += f"'{record['intent']}', "
            value += f"'{record['query']}', "
            value += f"'{record['response']}', "
            value += f"'{record['metadata']}'::jsonb, "
            value += f"'{record['created_at']}', "
            value += f"'{record['updated_at']}'"
            value += ")"
            
            if idx < len(batch) - 1:
                value += ","
                
            values.append(value)
        
        insert_sql += "\n".join(values)
        insert_sql += "\nON CONFLICT (id) DO UPDATE SET\n"
        insert_sql += "    tool = EXCLUDED.tool,\n"
        insert_sql += "    intent = EXCLUDED.intent,\n"
        insert_sql += "    query = EXCLUDED.query,\n"
        insert_sql += "    response = EXCLUDED.response,\n"
        insert_sql += "    metadata = EXCLUDED.metadata,\n"
        insert_sql += "    updated_at = EXCLUDED.updated_at;\n"
        
        sql_commands.append(insert_sql)
    
    return "\n".join(sql_commands)

if __name__ == "__main__":
    main()