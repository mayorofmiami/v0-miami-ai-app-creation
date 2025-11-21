import crypto from 'crypto';
import postgres from 'postgres';

// Hash password using same algorithm as lib/auth.ts
async function hashPassword(password) {
  // Generate random salt (16 bytes)
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  const salt = Array.from(saltArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Hash password with salt using SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return salt + ':' + hash;
}

// Generate hash for "PAssword!33!"
const passwordHash = await hashPassword('PAssword!33!');

console.log('Generated password hash for PAssword!33!');
console.log(passwordHash);
console.log('\nRun this SQL to update the user:');
console.log(`UPDATE users SET password_hash = '${passwordHash}', role = 'owner', updated_at = NOW() WHERE email = 'spencer@miami.ai';`);
