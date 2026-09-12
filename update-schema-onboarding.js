const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('isOnboarded   Boolean   @default(false)')) {
  schema = schema.replace(
    'role          String?   @default("user") // "user" | "admin" | "superadmin"',
    'role          String?   @default("user") // "user" | "admin" | "superadmin"\n  isOnboarded   Boolean   @default(false)\n  referralCodeUsed String?'
  );

  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Schema updated.');
} else {
  console.log('Schema already has the updates.');
}
