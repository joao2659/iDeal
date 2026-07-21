module.exports = (req, res) => {
  function mask(v) {
    if (!v) return 'AUSENTE';
    if (v.length <= 8) return `"${v}" (tamanho: ${v.length})`;
    return `"${v.slice(0, 6)}...${v.slice(-6)}" (tamanho: ${v.length})`;
  }

  res.json({
    SUPABASE_URL: mask(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    MP_CLIENT_ID: mask(process.env.MP_CLIENT_ID),
    MP_CLIENT_SECRET: mask(process.env.MP_CLIENT_SECRET)
  });
};
