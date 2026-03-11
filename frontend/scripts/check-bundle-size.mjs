import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const assetsDir = join(process.cwd(), 'dist', 'assets');
const maxChunkKb = Number(process.env.MAX_JS_CHUNK_KB || 220);

const formatKb = (bytes) => (bytes / 1024).toFixed(2);

const files = readdirSync(assetsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const fullPath = join(assetsDir, name);
    const sizeBytes = statSync(fullPath).size;
    return { name, sizeBytes };
  })
  .sort((a, b) => b.sizeBytes - a.sizeBytes);

if (!files.length) {
  console.error('Nessun file JS trovato in dist/assets');
  process.exit(1);
}

console.log(`Budget per chunk JS: ${maxChunkKb} KB`);
console.log('Chunk JS generati (ordinati per dimensione):');
for (const file of files) {
  console.log(`- ${file.name}: ${formatKb(file.sizeBytes)} KB`);
}

const oversized = files.filter((file) => file.sizeBytes > maxChunkKb * 1024);
if (oversized.length > 0) {
  console.error('\n❌ Budget superato. Chunk troppo grandi:');
  for (const file of oversized) {
    console.error(`- ${file.name}: ${formatKb(file.sizeBytes)} KB > ${maxChunkKb} KB`);
  }
  process.exit(1);
}

console.log('\n✅ Budget rispettato.');

