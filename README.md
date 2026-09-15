# Tech Study Adda

**Learn Today, Achieve Tomorrow**

Tech Study Adda एक complete, mobile-first educational website है। Frontend केवल HTML5, CSS3 और modular Vanilla JavaScript में है; production authentication, PostgreSQL database और file storage के लिए Supabase integration तैयार है। Project बिना Supabase के भी **working demo mode** में चलता है, इसलिए design और सभी major flows तुरंत test किए जा सकते हैं।

## क्या-क्या शामिल है

- Premium animated homepage, sticky responsive header और multi-column footer
- Hindi-first content with English educational terms
- Original Tech Study Adda trophy logo और उसी logo का favicon/PWA icon
- Dynamic categories, posts, career guides, exam updates और current affairs
- Global search; page-level search, sort और filters
- Working timed MCQ quiz, navigation, score, percentage, explanations, retry और share
- YouTube URL/video-ID support, thumbnail और privacy-enhanced responsive embed (no autoplay)
- Download cards, safe demo download और production file counter RPC
- Validated contact form, honeypot spam trap और admin inbox
- Newsletter/update subscription form
- Dark/light mode, skeleton loading, scroll reveal, animated counters और reduced-motion support
- PWA manifest, service worker, offline page, robots.txt, sitemap.xml और 404 page
- SEO metadata, canonical tags, Open Graph/Twitter tags और JSON-LD structured data
- Keyboard focus, semantic HTML, labels, dialog elements और accessible controls
- Supabase Auth allow-list, PostgreSQL schema, indexes, RLS policies और Storage policies
- Full admin dashboard with responsive sidebar, charts, CRUD, status filters, pagination, preview, Trash/restore, scheduling, safe rich text, uploads और activity log

## Public pages

| Page | File |
|---|---|
| Home | `index.html` |
| Career Guidance | `career.html` |
| Government Exams | `exams.html` |
| GK & GS | `gk-gs.html` |
| Current Affairs | `current-affairs.html` |
| Math Formula & Tricks | `math.html` |
| Study Material | `study-material.html` |
| Quiz / Mock Test | `quiz.html` |
| YouTube Videos | `videos.html` |
| Downloads | `downloads.html` |
| Dynamic Post | `post.html?slug=...` |
| Dynamic Category | `category.html?slug=...` |
| About / Contact / Legal | `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html` |

## Admin modules

`/admin/login.html` से login करें। Dashboard में ये modules हैं:

1. Posts
2. Categories
3. Career Guidance
4. Government Exams
5. Current Affairs
6. Study Material
7. PDF Downloads
8. Videos
9. Quizzes
10. Questions
11. Banners
12. Latest Update Ticker
13. Notices
14. Media Library
15. Contact Messages
16. SEO Manager
17. Website Settings
18. Admin Profile
19. Activity Log

## तुरंत local preview

Project folder में terminal खोलें और static server चलाएँ:

```bash
npm start
```

फिर खोलें:

- Public website: `http://localhost:4173/`
- Admin login: `http://localhost:4173/admin/login.html`

Demo login:

```text
Email: admin@techstudyadda.demo
Password: demo12345
```

Demo mode में कोई valid email और कम-से-कम 6-character password स्वीकार होता है। CRUD changes उसी browser के `localStorage` में save होते हैं और tab session तक admin login `sessionStorage` में रहता है। यह केवल local demonstration है—production security Supabase Auth + `admins` allow-list से आती है। Demo reset करने के लिए browser site data/local storage clear करें।

> Node.js 18+ चाहिए; कोई package install नहीं होता क्योंकि preview server केवल Node के built-in modules use करता है। HTML files को सीधे `file://` से खोलने के बजाय local server use करें; PWA, service worker और कुछ browser security features HTTP/HTTPS पर ही सही चलते हैं।

## Supabase production setup

### 1. Project बनाएँ

1. [Supabase](https://supabase.com/) पर नया project बनाएँ।
2. SQL Editor खोलें।
3. पूरा [`supabase/schema.sql`](supabase/schema.sql) run करें।

Migration automatically ये tables बनाती है:

`admins`, `profiles`, `categories`, `posts`, `career_guides`, `exam_updates`, `current_affairs`, `videos`, `quizzes`, `quiz_questions`, `downloads`, `banners`, `notices`, `contact_messages`, `subscribers`, `site_settings`, `media`, `activity_logs`.

इसके साथ primary/foreign keys, unique slugs, validation checks, timestamps, updated-at triggers, search/filter indexes, activity triggers, demo content, Row Level Security और Storage buckets/policies भी बनते हैं।

### 2. पहला admin बनाएँ

1. Supabase Dashboard → **Authentication → Users → Add user**.
2. Email `techstudyadda@gmail.com` रखें और एक नया strong private password बनाएँ.
3. SQL Editor में schema file के अंत में दिया गया `insert into public.admins ...` query दोबारा run करें। वह existing Auth user को `super_admin` allow-list में जोड़ देगा।

Password database SQL या repository में कभी न लिखें। अगर अलग login email चाहिए, तो admin insert query में केवल email बदलें।

### 3. Frontend config जोड़ें

[`assets/js/config.js`](assets/js/config.js) में Supabase Dashboard → Project Settings → API से values भरें:

```js
window.TSA_CONFIG = Object.freeze({
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY',
  demoMode: false,
  siteUrl: 'https://YOUR_REAL_DOMAIN.com',
  youtubeUrl: 'https://www.youtube.com/@techstudyadda',
  telegramUrl: 'https://t.me/Techstudyadda',
  contactEmail: 'techstudyadda@gmail.com'
});
```

केवल **public anon/publishable key** use करें। `service_role` key browser, GitHub repository या ZIP में कभी न रखें। RLS enabled रहने पर anon key का frontend में होना expected और safe है।

Readable CSS/JS source में code changes करने के बाद `npm run build` चलाएँ; इससे HTML द्वारा इस्तेमाल होने वाले compact production assets दोबारा generate होंगे। `config.js` छोटा runtime configuration file है और सीधे load होता है, इसलिए Supabase values बदलने के बाद build जरूरी नहीं है।

### 4. Auth URL configuration

Supabase Dashboard → Authentication → URL Configuration:

- Site URL में production domain जोड़ें।
- Redirect URLs में production domain और local testing के लिए `http://localhost:4173/**` जोड़ें।
- Email/password provider enabled रखें।

### 5. Storage

Schema migration `media` (10 MB limit) और `downloads` (50 MB limit) buckets बनाती है। Public files read हो सकती हैं, लेकिन upload/replace/delete केवल active admin कर सकता है। Frontend file type और size validate करता है; Storage policy दूसरी server-side सुरक्षा layer है।

## Production behavior

- Public visitors को केवल published content और वह scheduled content दिखता है जिसका `scheduled_for` समय आ चुका है।
- Draft और Trash records RLS से public users के लिए invisible रहते हैं।
- Admin page access के लिए valid Supabase session **और** active `admins` row दोनों जरूरी हैं।
- Unauthorized login तुरंत sign out होता है और login page पर redirect होता है।
- Session auto-refresh Supabase client संभालता है; admin UI periodic session check भी करता है।
- Contact form public insert कर सकता है, लेकिन messages पढ़ना/update/delete करना admin-only है।
- Subscribers की list public नहीं पढ़ सकता।
- Post views, quiz attempts और download counts restricted SQL RPC functions से increment होते हैं।
- Rich text DOMPurify से sanitize होता है; CDN unavailable होने पर strict local DOM sanitizer fallback active रहता है।

## Content workflow

### Post publish करना

1. Admin → Posts → **Add New**.
2. Title डालने पर slug auto-generate होगा; जरूरत हो तो edit करें।
3. Dynamic category select करें, summary/content लिखें और featured image upload या URL add करें।
4. Tags, SEO title/description और reading time भरें।
5. `Draft`, `Published` या `Scheduled` status चुनें। Scheduled status पर future `Schedule for` date/time जरूरी रखें।
6. Save करें। Preview icon से public post layout देखें।

### YouTube video जोड़ना

YouTube watch, Shorts, embed या `youtu.be` URL paste करें। Video ID automatically extract होगा। Public page YouTube thumbnail और no-autoplay privacy-enhanced embed दिखाता है।

### Quiz बनाना

1. पहले Quiz Manager में quiz बनाएँ और उसका ID copy करें।
2. Question Manager में Quiz ID, question, options (हर line पर एक), correct option index (`0` = पहला option) और explanation जोड़ें।
3. Quiz publish करें। Public quiz timer, navigation, result और review automatically render करेगा।

### Dynamic category

Category Manager से enabled category add करते ही वह public category explorer में display order के अनुसार दिखाई देती है। Post में वही category select करने पर dynamic category page related post दिखाता है—HTML manually edit नहीं करना पड़ता।

## SEO launch checklist

Deployment से पहले पूरे project में `https://example.com` को अपने domain से replace करें:

```bash
rg -l 'https://example.com' .
```

फिर listed files में domain update करें, खासकर:

- `assets/js/config.js`
- `sitemap.xml`
- `robots.txt`
- HTML canonical tags
- Supabase `site_settings.site_url`

हर important post के लिए unique title, description, featured image और descriptive alt text रखें। Dynamic post page Article JSON-LD और homepage EducationalOrganization JSON-LD generate करता है।

## Deployment

### Netlify

1. ZIP unzip करें।
2. Netlify Drop में project folder upload करें या Git repository connect करें।
3. Build command खाली और publish directory project root रखें।
4. Included `_headers` file caching और security headers apply करेगा।

### Cloudflare Pages

1. Repository import करें।
2. Framework preset: **None**.
3. Build command खाली; output directory `/` या project root.
4. Dashboard में security headers equivalent configure करें।

### GitHub Pages

Static frontend GitHub Pages पर चल सकता है। Repository Pages enable करें, Supabase allowed redirect URL add करें और base-path hosting होने पर absolute domain/canonical paths verify करें। Admin source public दिखेगा, लेकिन database access फिर भी Auth + RLS से protected रहता है।

### Apache/cPanel

पूरे folder की files `public_html` में upload करें। Included `.htaccess` security/cache headers और 404 page configure करता है। Hosting में `mod_headers` enabled होना चाहिए।

Google Sites arbitrary HTML/CSS/JS app को full hosting environment की तरह serve नहीं करता। नई website को ऊपर के static host पर deploy करके Google Sites से link या embed किया जा सकता है।

## Content Security Policy guidance

पहले Report-Only mode में test करें, फिर host पर domain-specific CSP लागू करें। Supabase project host को अपने exact domain से बदलें:

```text
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://i.ytimg.com https://*.supabase.co;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-src https://www.youtube-nocookie.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'self';
form-action 'self';
upgrade-insecure-requests
```

Inline styles dynamic category colours के लिए हैं। Strict nonce/hash CSP चाहिए तो inline dynamic style values को approved CSS classes में migrate करें।

## Security notes

- RLS किसी भी table पर disable न करें।
- Service-role key server-only रखें; इस project को उसकी जरूरत नहीं है।
- Admin access केवल `admins.active = true` allow-list से दें।
- Unknown file types upload न करें; limits schema और UI दोनों में लागू हैं।
- Contact spam बढ़ने पर honeypot के साथ Cloudflare Turnstile/rate-limited Edge Function जोड़ें।
- Supabase database backups और Storage lifecycle policy configure करें।
- Dependencies (Supabase client और DOMPurify URLs) periodically update और retest करें।
- Production content render होने से पहले sanitize होता है; फिर भी untrusted HTML सीधे database में import न करें।

## Testing checklist

### Responsive / accessibility

- [ ] 360 px mobile: header, menu, hero, cards, forms और quiz usable
- [ ] 768 px tablet: grids और admin sidebar responsive
- [ ] 1440 px desktop: alignment, spacing और max-width correct
- [ ] Keyboard से navigation, modal close, form fields और quiz usable
- [ ] Visible focus states और sufficient contrast
- [ ] `prefers-reduced-motion` पर animations effectively disabled

### Public website

- [ ] सभी navigation links और legal pages open
- [ ] Global search title/category/keywords/exam/material find करे
- [ ] Page search, newest/popular/A–Z filters work
- [ ] Dynamic post और category slugs work
- [ ] YouTube thumbnail opens embed; autoplay नहीं होता
- [ ] Download starts और count increment होता है
- [ ] Quiz next/previous/navigation/timer/result/explanation/retry/share work
- [ ] Contact validation + honeypot + success/error toast work
- [ ] Newsletter duplicate email safely handle हो
- [ ] Dark/light mode refresh के बाद retain हो
- [ ] Offline page network loss पर दिखे

### Admin / Supabase

- [ ] Unauthorized `/admin/` access login पर redirect हो
- [ ] Non-admin Supabase account reject और sign out हो
- [ ] Authorized login, logout और session expiry handling work
- [ ] Add/edit/preview/draft/publish/schedule work
- [ ] Soft delete → Trash → restore और permanent delete confirmation work
- [ ] Category change public page पर दिखाई दे
- [ ] Featured image/PDF/media upload URL save हो
- [ ] YouTube ID auto-extract हो
- [ ] Quiz + questions public test में render हों
- [ ] Contact messages inbox में दिखें और status update हो
- [ ] SEO/settings homepage पर लागू हों
- [ ] Browser console में uncaught errors न हों
- [ ] Supabase RLS anon write attempts को block करे

## Project structure

```text
tech-study-adda/
├── index.html and public pages
├── manifest.json, sw.js, robots.txt, sitemap.xml
├── assets/
│   ├── css/readable source + minified production styles
│   ├── js/readable source + minified production scripts
│   ├── images/logo, favicon and career art
│   └── icons/PWA icons
├── admin/
│   ├── login.html, index.html
│   └── all content/settings manager pages
├── supabase/schema.sql
├── _headers and .htaccess
└── README.md
```

## Brand links

- YouTube: <https://www.youtube.com/@techstudyadda>
- Telegram: <https://t.me/Techstudyadda>
- Email: <techstudyadda@gmail.com>

---

Built for **Tech Study Adda** — *Learn Today, Achieve Tomorrow*.
