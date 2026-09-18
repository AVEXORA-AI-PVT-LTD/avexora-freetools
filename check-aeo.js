const { register } = require('esbuild-register/dist/node');
register();
const { allTools } = require('./src/tools/registry.ts');

let missingAnswer = 0;
let missingExample = 0;
let missingFaq = 0;

allTools.forEach(t => {
  if (!t.directAnswer) {
    console.log(`[Missing Answer] ${t.category}/${t.slug}`);
    missingAnswer++;
  }
  
  if (t.kind === 'calculator' || t.kind === 'generator' || t.kind === 'ai-writer') {
    if (!t.example) {
      console.log(`[Missing Example] ${t.category}/${t.slug}`);
      missingExample++;
    }
  }

  if (!t.faq || t.faq.length < 4) {
    console.log(`[Missing/Short FAQ] ${t.category}/${t.slug} (${t.faq ? t.faq.length : 0})`);
    missingFaq++;
  }
});

console.log(`Total tools: ${allTools.length}`);
console.log(`Missing Direct Answer: ${missingAnswer}`);
console.log(`Missing Example: ${missingExample}`);
console.log(`Missing/Short FAQ: ${missingFaq}`);
