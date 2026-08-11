module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  // 1) Confirma que quem está chamando está logado de verdade
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  const { request_id } = JSON.parse(body || '{}');
  if (!request_id) {
    res.status(400).json({ error: 'request_id ausente' });
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

    const supaHeaders = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };

    const reqRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/requests?id=eq.${request_id}&select=*`, { headers: supaHeaders });
    const reqRows = await reqRes.json();
    const requestRow = reqRows[0];
    if (!requestRow) {
      res.status(404).json({ error: 'Solicitação não encontrada' });
      return;
    }

    // 2) Confirma que quem está pagando é realmente o comprador dessa solicitação
    if (requestRow.buyer_id !== userData.id) {
      res.status(403).json({ error: 'Você não tem permissão para pagar esta solicitação' });
      return;
    }

    // 3) Só permite pagar solicitações já aceitas pelo viajante
    if (requestRow.request_status !== 'aceita') {
      res.status(400).json({ error: 'Esta solicitação ainda não foi aceita pelo viajante' });
      return;
    }

    // 4) Evita gerar cobrança duplicada se já existe um pagamento em andamento/concluído
    const existingRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/payments?request_id=eq.${request_id}&select=payment_status`, { headers: supaHeaders });
    const existingRows = await existingRes.json();
    if (existingRows.some(p => p.payment_status === 'liberado' || p.payment_status === 'pendente')) {
      res.status(400).json({ error: 'Já existe um pagamento em andamento para esta solicitação' });
      return;
    }

    const travelerRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${requestRow.traveler_id}&select=mp_access_token,mp_connected,first_name`, { headers: supaHeaders });
    const travelerRows = await travelerRes.json();
    const traveler = travelerRows[0];
    if (!traveler || !traveler.mp_connected || !traveler.mp_access_token) {
      res.status(400).json({ error: 'O viajante ainda não conectou a conta Mercado Pago.' });
      return;
    }

    const valorProduto = Number(requestRow.offered_reward) || 0;
    const taxaServico = Math.round(valorProduto * 0.05 * 100) / 100;
    const valorTotal = Math.round((valorProduto + taxaServico) * 100) / 100;

    const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${traveler.mp_access_token}`
      },
      body: JSON.stringify({
        items: [{
          title: requestRow.product_name || 'Produto iDeal',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: valorTotal
        }],
        marketplace_fee: taxaServico,
        external_reference: request_id,
        back_urls: {
          success: 'https://www.viajaideal.com.br/ideal-dashboard.html?pagamento=sucesso',
          failure: 'https://www.viajaideal.com.br/ideal-dashboard.html?pagamento=falhou',
          pending: 'https://www.viajaideal.com.br/ideal-dashboard.html?pagamento=pendente'
        },
        auto_return: 'approved',
        notification_url: 'https://www.viajaideal.com.br/api/mp-webhook'
      })
    });
    const prefData = await prefRes.json();
    if (!prefRes.ok) {
      res.status(400).json({ error: 'Erro ao criar cobrança: ' + JSON.stringify(prefData) });
      return;
    }

    await fetch(`${process.env.SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: { ...supaHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        request_id: request_id,
        buyer_id: requestRow.buyer_id,
        traveler_id: requestRow.traveler_id,
        total_amount: valorTotal,
        commission_percent: 5,
        commission_amount: taxaServico,
        traveler_amount: valorProduto,
        mercadopago_payment_id: prefData.id,
        payment_status: 'pendente'
      })
    });

    res.status(200).json({ checkout_url: prefData.init_point });
  } catch (err) {
    res.status(500).json({ error: 'Erro inesperado: ' + err.message });
  }
};
