module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(200).send('ok');
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let payload;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    res.status(200).send('ok');
    return;
  }

  const paymentId = payload?.data?.id;
  const topic = payload?.type || payload?.topic;

  if (topic !== 'payment' || !paymentId) {
    res.status(200).send('ignorado');
    return;
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      res.status(200).send('erro ao consultar pagamento');
      return;
    }

    const requestId = mpData.external_reference;
    const status = mpData.status; // approved, pending, rejected, etc.

    const statusMap = {
      approved: 'liberado',
      pending: 'pendente',
      in_process: 'pendente',
      rejected: 'cancelado',
      refunded: 'reembolsado',
      cancelled: 'cancelado'
    };

    const supaHeaders = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    };

    await fetch(`${process.env.SUPABASE_URL}/rest/v1/payments?request_id=eq.${requestId}`, {
      method: 'PATCH',
      headers: supaHeaders,
      body: JSON.stringify({
        payment_status: statusMap[status] || status,
        released_at: status === 'approved' ? new Date().toISOString() : null
      })
    });

    if (status === 'approved') {
      const reqRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/requests?id=eq.${requestId}&select=buyer_id,traveler_id,product_name`, { headers: supaHeaders });
      const reqRows = await reqRes.json();
      const r = reqRows[0];

      if (r) {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/requests?id=eq.${requestId}`, {
          method: 'PATCH',
          headers: supaHeaders,
          body: JSON.stringify({ request_status: 'em_transporte' })
        });

        await fetch(`${process.env.SUPABASE_URL}/rest/v1/notifications`, {
          method: 'POST',
          headers: supaHeaders,
          body: JSON.stringify([
            { user_id: r.traveler_id, type: 'pagamento_aprovado', message: `Pagamento de "${r.product_name}" foi aprovado! Pode seguir com a compra.`, link: 'ideal-dashboard.html' },
            { user_id: r.buyer_id, type: 'pagamento_aprovado', message: `Seu pagamento de "${r.product_name}" foi aprovado!`, link: 'ideal-dashboard.html' }
          ])
        });
      }
    }

    res.status(200).send('ok');
  } catch (err) {
    res.status(200).send('erro: ' + err.message);
  }
};
