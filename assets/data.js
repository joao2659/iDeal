/* =========================================================================
   iDeal — dados reais (sem conteúdo fictício)
   Busca viagens, destinos e estatísticas direto do Supabase.
   Requer que assets/supabase-client.js já tenha sido carregado antes.
   ========================================================================= */

// Busca viagens ativas e aprovadas, com dados do viajante (join com profiles)
async function idealFetchActiveTrips(limit = 24) {
  const { data, error } = await idealSupabase
    .from("trips")
    .select(
      "*, traveler:traveler_id ( first_name, last_name, average_rating, identity_verified, completed_trips_count )"
    )
    .eq("approval_status", "aprovada")
    .eq("trip_status", "ativa")
    .order("departure_date", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar viagens:", error);
    return [];
  }
  return data || [];
}

// Agrupa viagens ativas por país de origem (para "De onde você quer comprar?")
async function idealFetchOriginSummary() {
  const trips = await idealFetchActiveTrips(300);
  const groups = {};

  trips.forEach((t) => {
    const key = t.origin_country;
    if (!key) return;
    if (!groups[key]) {
      groups[key] = {
        country: key,
        tripCount: 0,
        travelerIds: new Set(),
        destCities: new Set(),
        categories: new Set(),
        nextArrival: null,
      };
    }
    const g = groups[key];
    g.tripCount++;
    if (t.traveler_id) g.travelerIds.add(t.traveler_id);
    if (t.destination_city) g.destCities.add(t.destination_city);
    (t.accepted_categories || []).forEach((c) => g.categories.add(c));
    if (t.arrival_date && (!g.nextArrival || t.arrival_date < g.nextArrival)) {
      g.nextArrival = t.arrival_date;
    }
  });

  return Object.values(groups)
    .map((g) => ({
      country: g.country,
      tripCount: g.tripCount,
      travelerCount: g.travelerIds.size,
      destCities: Array.from(g.destCities),
      categories: Array.from(g.categories),
      nextArrival: g.nextArrival,
    }))
    .sort((a, b) => b.travelerCount - a.travelerCount);
}

// Agrupa viagens dentro do Brasil por rota (cidade origem → cidade destino)
async function idealFetchNationalRoutes() {
  const trips = await idealFetchActiveTrips(300);
  const groups = {};

  trips
    .filter((t) => t.origin_country === "Brasil" && t.destination_country === "Brasil")
    .forEach((t) => {
      const key = `${t.origin_city}|${t.destination_city}`;
      if (!groups[key]) {
        groups[key] = {
          originCity: t.origin_city,
          destCity: t.destination_city,
          count: 0,
          transport: t.transport_type,
          maxWeight: 0,
        };
      }
      groups[key].count++;
      groups[key].maxWeight = Math.max(groups[key].maxWeight, t.available_weight || 0);
    });

  return Object.values(groups).sort((a, b) => b.count - a.count);
}

// Estatísticas gerais da plataforma (pra badge do hero etc.)
async function idealFetchPlatformStats() {
  const [{ count: travelerCount }, { count: tripCount }] = await Promise.all([
    idealSupabase.from("profiles").select("*", { count: "exact", head: true }),
    idealSupabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "aprovada")
      .eq("trip_status", "ativa"),
  ]);
  return { travelerCount: travelerCount || 0, tripCount: tripCount || 0 };
}

// Formata "AAAA-MM-DD" em "18 jul"
function idealFormatDateShort(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

// Gera as iniciais/avatar padrão a partir do primeiro nome
function idealInitial(firstName) {
  return (firstName || "?").charAt(0).toUpperCase();
}
