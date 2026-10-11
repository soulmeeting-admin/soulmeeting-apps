/* Backend config. Publishable key is safe in the browser (RLS protects the data).
   Add ?demo=1 to any page URL to use the mock data instead (for reviews/screenshots). */
window.SM_CONFIG = {
  supabaseUrl: 'https://dlvtmlsnuplwrjiwpzwc.supabase.co',
  supabaseKey: 'sb_publishable_20Pym6GVflGWdFxMke0eUw_aNTEztnw',
  useDemo: /[?&]demo=1\b/.test(location.search) || location.protocol === 'file:' || /claudeusercontent|claude\.ai/.test(location.host)
};
