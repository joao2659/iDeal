module.exports = async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).send('Parâmetros ausentes na resposta do Mercado Pago.');
    return;
  }

  try {
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://www.viajaideal.com.br/api/mp-oauth-callback'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      res.status(400).send('Erro ao conectar com o Mercado Pago: ' + JSON.stringify(tokenData));
      return;
    }

    const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${state}`, {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        mp_user_id: String(tokenData.user_id),
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_connected: true
      })
    });

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      res.status(500).send('Erro ao salvar a conexão: ' + errText);
      return;
    }

    res.writeHead(302, { Location: 'https://www.viajaideal.com.br/ideal-dashboard.html?mp=conectado#verificacaoSection' });
    res.end();
  } catch (err) {
    res.status(500).send('Erro inesperado: ' + err.message);
  }
};
