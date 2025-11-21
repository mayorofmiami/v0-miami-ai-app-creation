import crypto from "crypto"

const password = "PAssword!33!"
const salt = crypto.randomBytes(16).toString("hex")
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256").toString("hex")
const passwordHash = `${salt}:${hash}`

console.log("Password hash for spencer@miami.ai:")
console.log(passwordHash)
