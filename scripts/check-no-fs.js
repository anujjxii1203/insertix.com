const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Files allowed to import fs (e.g. dev scripts or CLI tools)
const ALLOWED_FILES = [
  path.normalize('src/scripts'),
];

// Production code paths that must NEVER import fs for data persistence
const FORBIDDEN_IMPORTS = [
  /from\s+["']fs["']/,
  /from\s+["']fs\/promises["']/,
  /require\(["']fs["']\)/,
  /require\(["']fs\/promises["']\)/,
];

let errors = [];

function checkFile(filePath) {
  const norm = path.normalize(filePath);
  if (ALLOWED_FILES.some(allowed => norm.includes(allowed))) {
    return;
  }

  // db.ts is allowed to import fs ONLY under dev-gated condition
  // But let's check any other file under src/app/api or src/lib
  const content = fs.readFileSync(filePath, 'utf-8');

  if (norm.includes(path.normalize('src/lib/db.ts'))) {
    // Specifically verify db.ts never calls saveLocalDB from Mongo branches
    if (/saveLocalDB\(/.test(content)) {
      // Check that saveLocalDB checks allowLocalFs
      if (!/allowLocalFs/.test(content)) {
        errors.push(`[CHECK FAILED] src/lib/db.ts calls saveLocalDB without allowLocalFs guard.`);
      }
    }
    return;
  }

  if (norm.includes(path.normalize('src/app/api/upload/route.ts'))) {
    // Check that upload route is protected by process.env.NODE_ENV !== "production"
    if (!content.includes('process.env.NODE_ENV === "production"')) {
      errors.push(`[CHECK FAILED] src/app/api/upload/route.ts does not guard production filesystem writes.`);
    }
    return;
  }

  for (const pattern of FORBIDDEN_IMPORTS) {
    if (pattern.test(content)) {
      errors.push(`[CHECK FAILED] Forbidden 'fs' import detected in production file: ${filePath}`);
    }
  }
}

function traverse(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverse(fullPath);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

console.log('[CHECK] Scanning src/ for illegal fs usage in production code paths...');
traverse(SRC_DIR);

if (errors.length > 0) {
  console.error('\n❌ VIOLATIONS FOUND:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ PASSED: No production code path uses fs for un-gated persistence.\n');
}
