import os
from neondb_toolkit import sql

# Get database connection
database_url = os.environ.get('DATABASE_URL')

if not database_url:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

print("Running rate limit system migration...")

# Read the migration SQL
with open('scripts/009_rate_limit_system.sql', 'r') as f:
    migration_sql = f.read()

try:
    # Execute the migration
    result = sql(migration_sql)
    print("✅ Migration completed successfully!")
    print(f"Result: {result}")
    
    # Verify the table was created
    verify_sql = "SELECT COUNT(*) as count FROM rate_limit_configs;"
    verify_result = sql(verify_sql)
    print(f"✅ Verified: rate_limit_configs table has {verify_result} rows")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    exit(1)
