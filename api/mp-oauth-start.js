module.exports = (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    res.status(400).send('Parâmetro user_id ausente.');
    return;
  }

  const clientId = process.env.MP_CLIENT_ID;
  const redirectUri = 'https://www.viajaideal.com.br/api/mp-oauth-callback';
  const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
};
