/* =========================================================================
   iDeal — conexão com o Supabase
   Esse arquivo cria uma única conexão (cliente) com o banco de dados,
   usada por todas as páginas do site que precisam de login, cadastro
   ou dados reais (viagens, solicitações, mensagens etc.)
   ========================================================================= */

// Carregado via CDN no <head> de cada página:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const IDEAL_SUPABASE_URL = "https://vrqhupvyygfvzbyafgyc.supabase.co";
const IDEAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycWh1cHZ5eWdmdnpieWFmZ3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwODY3OTYsImV4cCI6MjA5OTY2Mjc5Nn0.I4Bme5VletIYoLSOn7sw_dQuGprgWxhqM3S5btkc5gI";

const idealSupabase = window.supabase.createClient(
  IDEAL_SUPABASE_URL,
  IDEAL_SUPABASE_ANON_KEY
);

/* -------------------------------------------------------------------------
   Funções de autenticação reutilizáveis
   ------------------------------------------------------------------------- */

// Cria uma conta nova (login) + a linha correspondente em "profiles"
async function idealSignUp({ email, password, firstName, lastName }) {
  try {
    const { data, error } = await idealSupabase.auth.signUp({
      email,
      password,
    });
    if (error) return { error };

    // Se a confirmação de e-mail estiver ativada no Supabase, ainda não
    // existe uma sessão aqui — não dá pra gravar o perfil ainda (RLS bloqueia).
    if (!data.session) {
      return { needsEmailConfirmation: true };
    }

    // Cria o perfil vinculado ao novo usuário
    if (data.user) {
      const { error: profileError } = await idealSupabase.from("profiles").insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
      });
      if (profileError) return { error: profileError };
    }

    return { data };
  } catch (err) {
    console.error("Erro em idealSignUp:", err);
    return { error: { message: "Falha de conexão com o servidor. Verifique sua internet e tente novamente." } };
  }
}

// Login
async function idealSignIn({ email, password }) {
  try {
    const { data, error } = await idealSupabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err) {
    console.error("Erro em idealSignIn:", err);
    return { error: { message: "Falha de conexão com o servidor. Verifique sua internet e tente novamente." } };
  }
}

// Logout
async function idealSignOut() {
  await idealSupabase.auth.signOut();
  window.location.href = "ideal-homepage.html";
}

// Garante que o usuário logado tem uma linha em "profiles".
// Necessário porque, com confirmação de e-mail ativada, o perfil não é
// criado no momento do cadastro (ainda não há sessão pra isso).
async function idealEnsureProfile(user) {
  const { data: existing } = await idealSupabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  await idealSupabase.from("profiles").insert({ id: user.id });
}

// Retorna o usuário logado (ou null)
async function idealGetCurrentUser() {
  try {
    const { data } = await idealSupabase.auth.getUser();
    return data?.user || null;
  } catch (err) {
    console.error("Erro em idealGetCurrentUser:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------
   Atualiza automaticamente o cabeçalho (nav) da página conforme o login:
   - Se NÃO estiver logado: mostra os botões "Entrar" / "Criar conta"
   - Se estiver logado: mostra o avatar (iniciais do nome) linkando pro
     dashboard, e um botão de "Sair"

   Uso: no HTML, dar o id "navAuthArea" para o elemento que envolve os
   botões de Entrar/Criar conta, e chamar idealRenderNavAuth() no fim da página.
   ------------------------------------------------------------------------- */
async function idealRenderNavAuth() {
  const container = document.getElementById("navAuthArea");
  if (!container) return;

  const user = await idealGetCurrentUser();
  if (!user) return; // já mostra Entrar/Criar conta por padrão no HTML

  const { data: profile } = await idealSupabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const initial = (profile?.first_name || user.email || "?").charAt(0).toUpperCase();

  container.innerHTML = `
    <a href="ideal-dashboard.html" style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:14px; color:var(--navy);">
      <span style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--coral));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-family:'Space Grotesk',sans-serif;">${initial}</span>
    </a>
    <button id="idealLogoutBtn" class="btn btn-ghost" style="padding:9px 16px; font-size:13px;">Sair</button>
  `;

  document.getElementById("idealLogoutBtn").addEventListener("click", idealSignOut);
}
