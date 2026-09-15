import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';

const root = resolve(process.cwd());
const failures = [];
const passes = [];

async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}
function check(condition, label) { (condition ? passes : failures).push(label); }

const files = await walk(root);
const htmlFiles = files.filter((file) => extname(file) === '.html');
const requiredPublic = ['index.html','career.html','exams.html','gk-gs.html','current-affairs.html','math.html','study-material.html','quiz.html','videos.html','downloads.html','post.html','category.html','about.html','contact.html','privacy.html','terms.html','disclaimer.html','404.html','offline.html'];
const requiredAdmin = ['login.html','index.html','posts.html','categories.html','careers.html','exams.html','current-affairs.html','study-material.html','downloads.html','videos.html','quizzes.html','questions.html','banners.html','ticker.html','notices.html','media.html','messages.html','seo.html','settings.html','profile.html','activity.html'];

for (const file of requiredPublic) check(await exists(join(root, file)), `public file: ${file}`);
for (const file of requiredAdmin) check(await exists(join(root, 'admin', file)), `admin file: ${file}`);

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  check(/<meta\s+name="viewport"/i.test(html), `viewport: ${file.slice(root.length + 1)}`);
  check(/<title>[^<]+<\/title>/i.test(html), `title: ${file.slice(root.length + 1)}`);
  if (file.includes(`${join(root, 'admin')}/`)) check(/noindex/i.test(html), `admin noindex: ${file.slice(root.length + 1)}`);
  const references = [...html.matchAll(/(?:href|src)="([^"#]+)"/gi)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) continue;
    const clean = reference.split('?')[0].split('#')[0];
    if (!clean || clean.startsWith('/')) continue;
    const target = resolve(dirname(file), clean);
    check(await exists(target), `local reference: ${file.slice(root.length + 1)} → ${reference}`);
  }
}

const app = await readFile(join(root, 'assets/js/app.js'), 'utf8');
const admin = await readFile(join(root, 'assets/js/admin.js'), 'utf8');
const schema = await readFile(join(root, 'supabase/schema.sql'), 'utf8');
const config = await readFile(join(root, 'assets/js/config.js'), 'utf8');
const css = await readFile(join(root, 'assets/css/style.css'), 'utf8');

check(app.includes('DOMPurify') && admin.includes('DOMPurify'), 'DOMPurify with local sanitizer fallback');
check(app.includes('prefers-reduced-motion') || css.includes('prefers-reduced-motion'), 'reduced motion support');
check(css.includes('@media (max-width: 600px)') && css.includes('@media (max-width: 860px)'), 'mobile and tablet breakpoints');
check(app.includes('startQuiz') && app.includes('showResult'), 'quiz scoring flow');
check(app.includes('global-search') && app.includes('renderSearchResults'), 'global search flow');
check(admin.includes('softDelete') && admin.includes('restore'), 'admin trash and restore flow');
check(admin.includes('scheduled_for'), 'admin scheduling fields');
check(!/service[_-]?role/i.test(config), 'no service-role key in browser config');

const tables = ['admins','profiles','categories','posts','career_guides','exam_updates','current_affairs','videos','quizzes','quiz_questions','downloads','banners','notices','contact_messages','subscribers','site_settings','activity_logs'];
for (const table of tables) {
  check(new RegExp(`create table if not exists public\\.${table}\\b`, 'i').test(schema), `database table: ${table}`);
  check(new RegExp(`alter table public\\.${table} enable row level security`, 'i').test(schema), `RLS enabled: ${table}`);
}
check(schema.includes("'media', 'media', true") && schema.includes("'downloads', 'downloads', true"), 'storage buckets');
check(schema.includes('public.is_admin()') && schema.includes('admins manage posts'), 'admin authorization policies');
check(await exists(join(root, 'manifest.json')) && await exists(join(root, 'sw.js')) && await exists(join(root, 'offline.html')), 'PWA/offline files');
check(await exists(join(root, 'assets/icons/icon-192.png')) && await exists(join(root, 'assets/icons/icon-512.png')), 'PWA icons');

console.log(`PASS ${passes.length}`);
passes.forEach((label) => console.log(`✓ ${label}`));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  failures.forEach((label) => console.error(`✗ ${label}`));
  process.exitCode = 1;
} else {
  console.log('All automated structural checks passed.');
}
