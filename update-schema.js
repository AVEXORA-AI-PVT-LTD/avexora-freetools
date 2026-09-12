const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('role          String?   @default("user")')) {
  schema = schema.replace(
    'image         String?',
    'image         String?\n  role          String?   @default("user") // "user" | "admin" | "superadmin"'
  );
  
  schema = schema.replace(
    'usageCounters UsageCounter[]',
    'usageCounters UsageCounter[]\n  toolUsages    ToolUsage[]'
  );
  
  schema += `\n
// ---------------------------------------------------------------------------
// Tool Usage Tracking (for Analytics and Admin Panel)
// ---------------------------------------------------------------------------

model ToolUsage {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  toolSlug  String
  useCount  Int      @default(1)
  lastUsed  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Ek user ka ek tool ke liye ek hi record hoga, count update hoga
  @@unique([userId, toolSlug])
  // Ranking ke liye index taaki sabse zyada use hone wale tools jaldi fetch ho sakein
  @@index([toolSlug, useCount(sort: Desc)])
}
`;

  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Schema updated.');
} else {
  console.log('Schema already has the updates.');
}
