import * as fs from 'fs';
import * as path from 'path';

const patterns = [
  { name: 'localhost', regex: /localhost/i },
  { name: '127.0.0.1', regex: /127\.0\.0\.1/ },
  { name: '10.0.2.2', regex: /10\.0\.2\.2/ },
  { name: 'debugPrint', regex: /debugPrint/ },
  { name: 'print(', regex: /print\s*\(/ },
  { name: 'console.log', regex: /console\.log/ },
  { name: 'GEMINI_API_KEY', regex: /GEMINI_API_KEY/ },
  { name: 'OPENAI_API_KEY', regex: /OPENAI_API_KEY/ },
  { name: 'JWT_SECRET', regex: /JWT_SECRET/ },
  { name: 'DATABASE_URL', regex: /DATABASE_URL/ }
];

interface Finding {
  file: string;
  line: number;
  match: string;
  snippet: string;
}

function scanDir(dir: string, exclude: string[] = []): Finding[] {
  let results: Finding[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (exclude.some(ex => fullPath.includes(ex))) continue;
    if (entry.isDirectory()) {
      results = results.concat(scanDir(fullPath, exclude));
    } else if (entry.isFile() && /\.(dart|ts|js|json|xml|gradle|properties)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          for (const p of patterns) {
            if (p.regex.test(line)) {
              results.push({
                file: path.relative(path.resolve('..'), fullPath).replace(/\\/g, '/'),
                line: idx + 1,
                match: p.name,
                snippet: line.trim().substring(0, 120)
              });
            }
          }
        });
      } catch (err) {
        // ignore unreadable
      }
    }
  }
  return results;
}

const mobileDir = path.resolve(__dirname, '../../mobile');
const backendDir = path.resolve(__dirname, '../../backend/src');

const mobileFindings = scanDir(mobileDir, ['node_modules', '.git', 'build', '.dart_tool', 'android/.gradle']);
const backendFindings = scanDir(backendDir, ['node_modules', '.git', 'dist']);

console.log(`Audited Mobile (${mobileFindings.length} findings) and Backend (${backendFindings.length} findings):`);
console.log('\n--- MOBILE FINDINGS ---');
mobileFindings.forEach(f => {
  console.log(`[${f.match}] ${f.file}:${f.line} -> ${f.snippet}`);
});

console.log('\n--- BACKEND FINDINGS ---');
backendFindings.forEach(f => {
  console.log(`[${f.match}] ${f.file}:${f.line} -> ${f.snippet}`);
});
