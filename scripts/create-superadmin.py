import hashlib
import secrets
import asyncio

# Password to hash
password = "PAssword!33!"

# Generate random 16-byte salt
salt = secrets.token_hex(16)

# Hash password with salt using SHA-256
password_with_salt = password + salt
hash_hex = hashlib.sha256(password_with_salt.encode()).hexdigest()

# Combine salt and hash
password_hash = f"{salt}:{hash_hex}"

print("Generated password hash:")
print(password_hash)
print("\nSQL to insert superadmin user:")
print(f"""
INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES (gen_random_uuid(), 'spencer@miami.ai', '{password_hash}', 'Spencer', 'owner', NOW(), NOW())
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = 'owner';
""")
