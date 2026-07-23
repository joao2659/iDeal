module.exports = async (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  try {
    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` }
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) {
      res.status(401).json({ error: 'Sessão inválida' });
      return;
    }

    const profileRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}&select=is_admin`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
    });
    const profileRows = await profileRes.json();
    if (!profileRows[0]?.is_admin) {
      res.status(403).json({ error: 'Acesso restrito a administradores' });
      return;
    }

    const listRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
    });
    const listData = await listRes.json();

    const users = (listData.users || []).map(u => ({ id: u.id, email: u.email }));
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado: ' + err.message });
  }
};
