const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('companyName')) {
  schema = schema.replace(
    /isOnboarded(.*)Boolean(.*)@default\(false\)/,
    'isOnboarded$1Boolean$2@default(false)\n  phone         String?\n  companyName   String?\n  jobRole       String?'
  );

  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Schema updated.');
} else {
  console.log('Schema already has the updates.');
}
