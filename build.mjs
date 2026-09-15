import { readFile, writeFile } from 'node:fs/promises';

const cssFiles = ['assets/css/style.css', 'assets/css/admin.css'];
const jsFiles = ['assets/js/data.js', 'assets/js/store.js', 'assets/js/app.js', 'assets/js/admin.js'];

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}\s*/g, '}')
    .trim();
}

function compactJavaScript(source) {
  // Dependency-free and syntax-safe: removes blank/full-line comments and indentation.
  // It intentionally avoids risky token rewriting; deploy with HTTP compression enabled.
  return source.split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .join('\n');
}

for (const file of cssFiles) {
  const source = await readFile(file, 'utf8');
  await writeFile(file.replace(/\.css$/, '.min.css'), minifyCss(source));
}
for (const file of jsFiles) {
  const source = await readFile(file, 'utf8');
  await writeFile(file.replace(/\.js$/, '.min.js'), compactJavaScript(source));
}

console.log('Production CSS and JavaScript assets regenerated.');
