(function () {
  'use strict';

  const config = window.TSA_CONFIG || {};
  const cacheKey = 'tsa_demo_database_v1';
  let client = null;
  let mode = 'demo';

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function hasSupabaseConfig() {
    return Boolean(config.supabaseUrl && config.supabaseAnonKey && !config.demoMode);
  }

  function demoDatabase() {
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {
      // Privacy modes can disable storage; use the in-memory demo dataset.
    }
    return clone(window.TSA_DEMO_DATA || {});
  }

  function saveDemo(db) {
    try { localStorage.setItem(cacheKey, JSON.stringify(db)); } catch (_) { /* in-memory fallback */ }
  }

  async function init() {
    if (!hasSupabaseConfig()) return { mode, client: null };
    try {
      const lib = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      client = lib.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      mode = 'supabase';
    } catch (error) {
      console.warn('Supabase unavailable; demo content loaded.', error);
      mode = 'demo';
    }
    return { mode, client };
  }

  const ready = init();

  async function list(table, options = {}) {
    await ready;
    if (mode === 'supabase') {
      let query = client.from(table).select(options.select || '*');
      if (options.status) query = query.eq('status', options.status);
      if (options.eq) Object.entries(options.eq).forEach(([key, value]) => { query = query.eq(key, value); });
      if (options.search && options.searchFields?.length) {
        const term = String(options.search).replace(/[,%()]/g, ' ').trim();
        query = query.or(options.searchFields.map((field) => `${field}.ilike.%${term}%`).join(','));
      }
      if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      if (Number.isInteger(options.limit)) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let data = clone(demoDatabase()[table] || []);
    if (options.status) data = data.filter((item) => item.status === options.status);
    if (options.eq) data = data.filter((item) => Object.entries(options.eq).every(([key, value]) => String(item[key]) === String(value)));
    if (options.search) {
      const needle = String(options.search).toLowerCase();
      const fields = options.searchFields || ['title', 'name', 'summary', 'description'];
      data = data.filter((item) => fields.some((field) => String(item[field] || '').toLowerCase().includes(needle)));
    }
    if (options.orderBy) {
      const direction = options.ascending ? 1 : -1;
      data.sort((a, b) => String(a[options.orderBy] || '').localeCompare(String(b[options.orderBy] || '')) * direction);
    }
    if (Number.isInteger(options.limit)) data = data.slice(0, options.limit);
    return data;
  }

  async function get(table, id) {
    await ready;
    if (mode === 'supabase') {
      const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    }
    return (demoDatabase()[table] || []).find((item) => String(item.id) === String(id)) || null;
  }

  async function getBySlug(table, slug) {
    await ready;
    if (mode === 'supabase') {
      const { data, error } = await client.from(table).select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data;
    }
    return (demoDatabase()[table] || []).find((item) => item.slug === slug) || null;
  }

  async function upsert(table, record) {
    await ready;
    const item = { ...record, id: record.id || createId(), updated_at: new Date().toISOString() };
    if (mode === 'supabase') {
      const { data, error } = await client.from(table).upsert(item).select().single();
      if (error) throw error;
      return data;
    }
    const db = demoDatabase();
    db[table] = db[table] || [];
    const index = db[table].findIndex((entry) => String(entry.id) === String(item.id));
    if (index >= 0) db[table][index] = { ...db[table][index], ...item };
    else db[table].unshift({ created_at: new Date().toISOString(), ...item });
    db.activity_logs = db.activity_logs || [];
    db.activity_logs.unshift({ id: createId(), action: index >= 0 ? 'updated' : 'created', entity_type: table, entity_id: item.id, created_at: new Date().toISOString() });
    saveDemo(db);
    return item;
  }

  async function softDelete(table, id) {
    const record = await get(table, id);
    if (!record) throw new Error('Record not found');
    return upsert(table, { ...record, deleted_at: new Date().toISOString(), status: 'trash' });
  }

  async function restore(table, id) {
    const record = await get(table, id);
    if (!record) throw new Error('Record not found');
    const restored = { ...record, deleted_at: null, status: 'draft' };
    return upsert(table, restored);
  }

  async function permanentDelete(table, id) {
    await ready;
    if (mode === 'supabase') {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const db = demoDatabase();
    db[table] = (db[table] || []).filter((entry) => String(entry.id) !== String(id));
    saveDemo(db);
    return true;
  }

  async function count(table, options = {}) {
    const rows = await list(table, options);
    return rows.length;
  }

  async function signIn(email, password) {
    await ready;
    if (mode === 'supabase') {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: admin, error: adminError } = await client.from('admins').select('id,email,role,active').eq('user_id', data.user.id).eq('active', true).maybeSingle();
      if (adminError || !admin) {
        await client.auth.signOut();
        throw new Error('This account is not authorized for admin access.');
      }
      return { user: data.user, admin };
    }
    if (!email || !password) throw new Error('Email और password दर्ज करें।');
    const session = { user: { id: 'demo-admin', email }, admin: { role: 'super_admin', active: true }, demo: true };
    sessionStorage.setItem('tsa_demo_admin', JSON.stringify(session));
    return session;
  }

  async function signOut() {
    await ready;
    if (mode === 'supabase') await client.auth.signOut();
    sessionStorage.removeItem('tsa_demo_admin');
  }

  async function getSession() {
    await ready;
    if (mode === 'supabase') {
      const { data } = await client.auth.getSession();
      if (!data.session) return null;
      const { data: admin } = await client.from('admins').select('*').eq('user_id', data.session.user.id).eq('active', true).maybeSingle();
      return admin ? { user: data.session.user, admin } : null;
    }
    try { return JSON.parse(sessionStorage.getItem('tsa_demo_admin')); } catch (_) { return null; }
  }

  async function uploadFile(file, bucket = 'media') {
    await ready;
    if (mode !== 'supabase') return { url: URL.createObjectURL(file), path: `demo/${file.name}`, demo: true };
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const path = `${new Date().getFullYear()}/${safeName}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async function incrementCounter(table, id, column) {
    await ready;
    if (mode === 'supabase') {
      const functions = {
        'posts.views': ['increment_post_views', { post_id: id }],
        'downloads.download_count': ['increment_download_count', { download_id: id }],
        'quizzes.attempts': ['increment_quiz_attempts', { quiz_id: id }]
      };
      const entry = functions[`${table}.${column}`];
      if (!entry) throw new Error('Unsupported public counter');
      const { error } = await client.rpc(entry[0], entry[1]);
      if (error) throw error;
      return true;
    }
    const record = await get(table, id);
    if (!record) return false;
    await upsert(table, { ...record, [column]: Number(record[column] || 0) + 1 });
    return true;
  }

  async function deleteFile(path, bucket = 'media') {
    await ready;
    if (!path || mode !== 'supabase') return true;
    const { error } = await client.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  }

  function resetDemo() {
    localStorage.removeItem(cacheKey);
    sessionStorage.removeItem('tsa_demo_admin');
  }

  window.TSAStore = { ready, list, get, getBySlug, upsert, softDelete, restore, permanentDelete, count, signIn, signOut, getSession, uploadFile, deleteFile, incrementCounter, resetDemo, createId, get mode() { return mode; } };
})();
