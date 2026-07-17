/* =========================================================================
   iDeal — dados de localização
   - Lista completa de países (ISO 3166-1), nomes em português
   - Bandeiras geradas automaticamente a partir do código do país (sem precisar
     digitar emoji por emoji e sem depender de nenhuma API externa)
   - Estados e cidades do Brasil buscados ao vivo na API pública do IBGE
     (servicodados.ibge.gov.br) — sempre atualizada, gratuita, sem necessidade
     de chave de API
   ========================================================================= */

// Converte um código de país de 2 letras (ex: "BR") na bandeira correspondente (🇧🇷)
function isoToFlagEmoji(iso2) {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

// Lista de países: código ISO 3166-1 alpha-2 + nome em português do Brasil
const IDEAL_COUNTRIES = [
  ["AF","Afeganistão"],["ZA","África do Sul"],["AL","Albânia"],["DE","Alemanha"],
  ["AD","Andorra"],["AO","Angola"],["AI","Anguilla"],["AQ","Antártida"],
  ["AG","Antígua e Barbuda"],["SA","Arábia Saudita"],["DZ","Argélia"],["AR","Argentina"],
  ["AM","Armênia"],["AW","Aruba"],["AU","Austrália"],["AT","Áustria"],
  ["AZ","Azerbaijão"],["BS","Bahamas"],["BD","Bangladesh"],["BB","Barbados"],
  ["BH","Bahrein"],["BE","Bélgica"],["BZ","Belize"],["BJ","Benin"],
  ["BY","Bielorrússia"],["BO","Bolívia"],["BA","Bósnia e Herzegovina"],["BW","Botsuana"],
  ["BR","Brasil"],["BN","Brunei"],["BG","Bulgária"],["BF","Burkina Faso"],
  ["BI","Burundi"],["BT","Butão"],["CV","Cabo Verde"],["CM","Camarões"],
  ["KH","Camboja"],["CA","Canadá"],["QA","Catar"],["KZ","Cazaquistão"],
  ["TD","Chade"],["CL","Chile"],["CN","China"],["CY","Chipre"],
  ["CO","Colômbia"],["KM","Comores"],["CG","Congo"],["CD","Congo (RD)"],
  ["KP","Coreia do Norte"],["KR","Coreia do Sul"],["CI","Costa do Marfim"],["CR","Costa Rica"],
  ["HR","Croácia"],["CU","Cuba"],["CW","Curaçao"],["DK","Dinamarca"],
  ["DJ","Djibouti"],["DM","Dominica"],["EG","Egito"],["SV","El Salvador"],
  ["AE","Emirados Árabes Unidos"],["EC","Equador"],["ER","Eritreia"],["SK","Eslováquia"],
  ["SI","Eslovênia"],["ES","Espanha"],["US","Estados Unidos"],["EE","Estônia"],
  ["ET","Etiópia"],["FJ","Fiji"],["PH","Filipinas"],["FI","Finlândia"],
  ["FR","França"],["GA","Gabão"],["GM","Gâmbia"],["GH","Gana"],
  ["GE","Geórgia"],["GI","Gibraltar"],["GR","Grécia"],["GD","Granada"],
  ["GL","Groenlândia"],["GP","Guadalupe"],["GU","Guam"],["GT","Guatemala"],
  ["GG","Guernsey"],["GY","Guiana"],["GF","Guiana Francesa"],["GN","Guiné"],
  ["GW","Guiné-Bissau"],["GQ","Guiné Equatorial"],["HT","Haiti"],["NL","Holanda"],
  ["HN","Honduras"],["HK","Hong Kong"],["HU","Hungria"],["YE","Iêmen"],
  ["IN","Índia"],["ID","Indonésia"],["IR","Irã"],["IQ","Iraque"],
  ["IE","Irlanda"],["IS","Islândia"],["IL","Israel"],["IT","Itália"],
  ["JM","Jamaica"],["JP","Japão"],["JE","Jersey"],["JO","Jordânia"],
  ["KW","Kuwait"],["LA","Laos"],["LS","Lesoto"],["LV","Letônia"],
  ["LB","Líbano"],["LR","Libéria"],["LY","Líbia"],["LI","Liechtenstein"],
  ["LT","Lituânia"],["LU","Luxemburgo"],["MO","Macau"],["MK","Macedônia do Norte"],
  ["MG","Madagascar"],["MY","Malásia"],["MW","Malawi"],["MV","Maldivas"],
  ["ML","Mali"],["MT","Malta"],["MA","Marrocos"],["MQ","Martinica"],
  ["MU","Maurício"],["MR","Mauritânia"],["YT","Mayotte"],["MX","México"],
  ["MM","Mianmar"],["FM","Micronésia"],["MZ","Moçambique"],["MD","Moldávia"],
  ["MC","Mônaco"],["MN","Mongólia"],["ME","Montenegro"],["MS","Montserrat"],
  ["NA","Namíbia"],["NR","Nauru"],["NP","Nepal"],["NI","Nicarágua"],
  ["NE","Níger"],["NG","Nigéria"],["NU","Niue"],["NO","Noruega"],
  ["NC","Nova Caledônia"],["NZ","Nova Zelândia"],["OM","Omã"],["PW","Palau"],
  ["PS","Palestina"],["PA","Panamá"],["PG","Papua-Nova Guiné"],["PK","Paquistão"],
  ["PY","Paraguai"],["PE","Peru"],["PF","Polinésia Francesa"],["PL","Polônia"],
  ["PR","Porto Rico"],["PT","Portugal"],["KE","Quênia"],["KG","Quirguistão"],
  ["KI","Quiribati"],["GB","Reino Unido"],["CF","República Centro-Africana"],
  ["CZ","República Tcheca"],["DO","República Dominicana"],["RE","Reunião"],
  ["RO","Romênia"],["RW","Ruanda"],["RU","Rússia"],["EH","Saara Ocidental"],
  ["WS","Samoa"],["AS","Samoa Americana"],["SM","San Marino"],["SH","Santa Helena"],
  ["LC","Santa Lúcia"],["KN","São Cristóvão e Névis"],["ST","São Tomé e Príncipe"],
  ["VC","São Vicente e Granadinas"],["SC","Seicheles"],["SN","Senegal"],
  ["SL","Serra Leoa"],["RS","Sérvia"],["SG","Singapura"],["SY","Síria"],
  ["SO","Somália"],["LK","Sri Lanka"],["SZ","Suazilândia"],["SD","Sudão"],
  ["SS","Sudão do Sul"],["SE","Suécia"],["CH","Suíça"],["SR","Suriname"],
  ["TH","Tailândia"],["TW","Taiwan"],["TJ","Tajiquistão"],["TZ","Tanzânia"],
  ["TL","Timor-Leste"],["TG","Togo"],["TO","Tonga"],["TT","Trinidad e Tobago"],
  ["TN","Tunísia"],["TM","Turcomenistão"],["TR","Turquia"],["TV","Tuvalu"],
  ["UA","Ucrânia"],["UG","Uganda"],["UY","Uruguai"],["UZ","Uzbequistão"],
  ["VU","Vanuatu"],["VA","Vaticano"],["VE","Venezuela"],["VN","Vietnã"],
  ["ZM","Zâmbia"],["ZW","Zimbábue"]
].map(([code, name]) => ({ code, name, flag: isoToFlagEmoji(code) }))
 .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

// Preenche um <select> com a lista completa de países
function idealPopulateCountrySelect(selectEl, placeholder = "País") {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  IDEAL_COUNTRIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.name;
    opt.textContent = `${c.flag} ${c.name}`;
    selectEl.appendChild(opt);
  });
}

// Busca os 27 estados brasileiros na API do IBGE e preenche o <select>
async function idealPopulateBrazilStates(selectEl) {
  selectEl.disabled = true;
  selectEl.innerHTML = `<option value="">Carregando estados…</option>`;
  try {
    const res = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
    );
    if (!res.ok) throw new Error("Falha na API do IBGE");
    const estados = await res.json();
    selectEl.innerHTML = `<option value="">Estado</option>`;
    estados.forEach((uf) => {
      const opt = document.createElement("option");
      opt.value = uf.sigla;
      opt.textContent = uf.nome;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    selectEl.innerHTML = `<option value="">Não foi possível carregar os estados</option>`;
  } finally {
    selectEl.disabled = false;
  }
}

// Busca os municípios de um estado (sigla, ex: "SP") na API do IBGE
async function idealPopulateBrazilCities(selectEl, ufSigla) {
  if (!ufSigla) {
    selectEl.innerHTML = `<option value="">Selecione um estado primeiro</option>`;
    selectEl.disabled = true;
    return;
  }
  selectEl.disabled = true;
  selectEl.innerHTML = `<option value="">Carregando cidades…</option>`;
  try {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSigla}/municipios`
    );
    if (!res.ok) throw new Error("Falha na API do IBGE");
    const cidades = await res.json();
    selectEl.innerHTML = `<option value="">Cidade</option>`;
    cidades.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.nome;
      opt.textContent = c.nome;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    selectEl.innerHTML = `<option value="">Não foi possível carregar as cidades</option>`;
  } finally {
    selectEl.disabled = false;
  }
}

// Busca os estados/regiões de qualquer país do mundo (exceto Brasil, que usa o IBGE)
// via API gratuita e sem chave (CountriesNow). Só busca o país escolhido, nunca a lista toda.
async function idealPopulateCountryStates(selectEl, countryName) {
  if (countryName === "Brasil") return idealPopulateBrazilStates(selectEl);

  selectEl.disabled = true;
  selectEl.innerHTML = `<option value="">Carregando estados…</option>`;
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
    });
    const json = await res.json();
    const states = json?.data?.states || [];

    if (!states.length) {
      selectEl.innerHTML = `<option value="">Este país não tem estados/regiões listados</option>`;
      return;
    }
    selectEl.innerHTML = `<option value="">Estado / região</option>`;
    states.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.name;
      opt.textContent = s.name;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    selectEl.innerHTML = `<option value="">Não foi possível carregar os estados</option>`;
  } finally {
    selectEl.disabled = false;
  }
}

// Busca as cidades de um estado/região de qualquer país (fora do Brasil), sob demanda.
// Preenche um <datalist> (sugestão), mantendo o campo de cidade sempre digitável.
async function idealPopulateCountryStateCities(datalistEl, countryName, stateName) {
  if (!countryName || !stateName) return;
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName, state: stateName }),
    });
    const json = await res.json();
    const cities = json?.data || [];
    datalistEl.innerHTML = cities.map((c) => `<option value="${c}">`).join("");
  } catch (err) {
    // silencioso — o campo continua digitável normalmente
  }
}

/* =========================================================================
   Helper de alto nível: transforma um grupo país/estado/cidade em um
   conjunto dinâmico. Uso:

   idealSetupLocationGroup({
     countrySelect: document.querySelector('#origemPais'),
     stateSelect:   document.querySelector('#origemEstado'),
     citySelect:    document.querySelector('#origemCidade'), // select OU input
   });
   ========================================================================= */
function idealSetupLocationGroup({ countrySelect, stateSelect, citySelect }) {
  idealPopulateCountrySelect(countrySelect);

  const isCitySelect = citySelect && citySelect.tagName === "SELECT";

  countrySelect.addEventListener("change", () => {
    const isBrasil = countrySelect.value === "Brasil";

    if (isBrasil) {
      idealPopulateBrazilStates(stateSelect);
    } else if (countrySelect.value) {
      idealPopulateCountryStates(stateSelect, countrySelect.value);
    } else {
      stateSelect.innerHTML = `<option value="">Estado / região</option>`;
    }

    if (isCitySelect) {
      citySelect.innerHTML = `<option value="">Selecione um estado primeiro</option>`;
      citySelect.disabled = true;
    } else if (citySelect) {
      citySelect.value = "";
      citySelect.disabled = false;
      citySelect.placeholder = "Cidade";
    }
  });

  if (isCitySelect) {
    stateSelect.addEventListener("change", () => {
      if (countrySelect.value === "Brasil") {
        idealPopulateBrazilCities(citySelect, stateSelect.value);
      }
      // Para outros países, o campo de cidade (quando for <select>) permanece
      // simples; use o padrão com <input> + <datalist> (ver anunciar-viagem)
      // se quiser sugestões de cidade também fora do Brasil.
    });
  }
}
