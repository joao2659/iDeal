const crypto = require('crypto');

function base64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  // Igual ao create-payment.js e list-users.js: a identidade vem do
  // token de sessão (Authorization: Bearer ...), nunca de um parâmetro
  // solto na URL. Isso impede que alguém troque um "user_id" na URL
  // pra conectar a própria conta Mercado Pago ao perfil de outra pessoa.
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

    // PKCE: gera o code_verifier (segredo local) e o code_challenge
    // (derivado dele, é o que vai público na URL de autorização)
    const codeVerifier = base64urlEncode(crypto.randomBytes(32));
    const codeChallenge = base64urlEncode(
      crypto.createHash('sha256').update(codeVerifier).digest()
    );

    // "state" assinado: carrega o uid JÁ CONFIRMADO acima (não o que
    // viria de um parâmetro da URL) e o code_verifier, pra recuperar
    // os dois no callback sem precisar guardar sessão no servidor
    const payload = { uid: userData.id, cv: codeVerifier, ts: Date.now() };
    const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload)));
    const signature = crypto
      .createHmac('sha256', process.env.MP_OAUTH_STATE_SECRET)
      .update(payloadB64)
      .digest('hex');
    const state = `${payloadB64}.${signature}`;

    const authUrl = new URL('https://auth.mercadopago.com.br/authorization');
    authUrl.searchParams.set('client_id', process.env.MP_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('redirect_uri', 'https://www.viajaideal.com.br/api/mp-oauth-callback');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.status(200).json({ url: authUrl.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado: ' + err.message });
  }
};
