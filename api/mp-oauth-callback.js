const crypto = require('crypto');

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const redirectBase = 'https://www.viajaideal.com.br/ideal-dashboard.html';

  if (errorParam || !code || !state) {
    res.writeHead(302, { Location: `${redirectBase}?mp=erro` });
    res.end();
    return;
  }

  try {
    const [payloadB64, signature] = state.split('.');
    if (!payloadB64 || !signature) throw new Error('state inválido');

    const expectedSig = crypto.createHmac('sha256', process.env.MP_OAUTH_STATE_SECRET).update(payloadB64).digest('hex');
    const sigA = Buffer.from(expectedSig);
    const sigB = Buffer.from(signature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) throw new Error('assinatura inválida');

    const payload = JSON.parse(base64urlDecode(payloadB64));
    const { uid, cv, ts } = payload;
    if (!uid || !cv || !ts) throw new Error('payload incompleto');
    if (Date.now() - ts > 15 * 60 * 1000) throw new Error('state expirado');

    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://www.viajaideal.com.br/api/mp-oauth-callback',
        code_verifier: cv
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      res.writeHead(302, { Location: `${redirectBase}?mp=erro` });
      res.end();
      return;
    }

    const supaHeaders = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    };
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, {
      method: 'PATCH',
      headers: supaHeaders,
      body: JSON.stringify({
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_user_id: tokenData.user_id,
        mp_connected: true
      })
    });

    res.writeHead(302, { Location: `${redirectBase}?mp=sucesso#verificacaoSection` });
    res.end();
  } catch (err) {
    res.writeHead(302, { Location: `${redirectBase}?mp=erro` });
    res.end();
  }
};
