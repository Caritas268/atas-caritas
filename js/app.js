/* Telas do Sistema de Atas – Cáritas 268 */
(function () {
  const F = window.Frases, E = window.Extenso, S = window.Store;
  const GRAU_OPC = [['', '—'], ['AM', 'A∴M∴'], ['CM', 'C∴M∴'], ['MM', 'M∴M∴'], ['MI', 'M∴I∴']];
  const PASSOS = ['Sessão', 'Agenda do Dia', 'Ata e correspondência', 'Ocorrências', 'Presença', 'Doença e Boas Novas', 'Conclusão', 'Revisar e gerar'];

  const estado = { vista: 'lista', sessaoId: null, passo: 0, abaCadastro: 'irmaos', excluindo: null };

  /* ---------------- utilidades de interface ---------------- */
  function h(tag, props, ...filhos) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === false) return;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    filhos.flat(Infinity).forEach((f) => { if (f === null || f === undefined || f === false) return; el.append(f instanceof Node ? f : document.createTextNode(String(f))); });
    return el;
  }
  const app = () => document.getElementById('app');
  function aviso(msg, tipo) {
    const a = document.getElementById('aviso');
    a.textContent = msg; a.className = 'aviso-flutuante visivel ' + (tipo || '');
    clearTimeout(aviso.t); aviso.t = setTimeout(() => { a.className = 'aviso-flutuante'; }, 3500);
  }
  function rotuloGrau(g) { return (F.GRAUS[g] && F.GRAUS[g].abrev) || ''; }

  let timerSessao = null, timerLista = {}, timerConfig = null;
  function salvarSessaoDepois() {
    clearTimeout(timerSessao);
    marcarStatus('salvando');
    timerSessao = setTimeout(async () => { const s = sessaoAtual(); if (s) await S.salvarSessao(s); marcarStatus(); }, 900);
    atualizarPrevias();
  }
  function atualizarPrevias() {
    const s = sessaoAtual(); if (!s) return;
    document.querySelectorAll('.previa[data-item]').forEach((el) => {
      const it = (s.agenda || []).find((x) => x.id === el.dataset.item);
      if (it) el.textContent = F.agendaTexto(it);
    });
  }
  function salvarListaDepois(nome) {
    clearTimeout(timerLista[nome]); marcarStatus('salvando');
    timerLista[nome] = setTimeout(async () => { await S.salvarLista(nome); marcarStatus(); }, 900);
  }
  function salvarConfigDepois() {
    clearTimeout(timerConfig); marcarStatus('salvando');
    timerConfig = setTimeout(async () => { await S.salvarConfig(); marcarStatus(); }, 900);
  }

  function marcarStatus(tmp) {
    const b = document.getElementById('status');
    if (tmp === 'salvando') { b.textContent = 'Salvando…'; b.className = 'status salvando'; return; }
    if (S.status === 'google') { b.textContent = S.pendentes.length ? 'Planilha · ' + S.pendentes.length + ' a enviar' : 'Salvo na planilha'; b.className = 'status ok'; }
    else if (S.status === 'offline') { b.textContent = 'Sem conexão · salvo no aparelho'; b.className = 'status alerta'; }
    else { b.textContent = 'Salvo só neste aparelho'; b.className = 'status local'; }
  }

  /* ---------------- campos ---------------- */
  function campo(rotulo, controle, ajuda) {
    return h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, rotulo), controle, ajuda ? h('span', { class: 'ajuda' }, ajuda) : null);
  }
  function texto(obj, chave, rotulo, op = {}) {
    const props = {
      value: obj[chave] || '', placeholder: op.placeholder || '', type: op.tipo || 'text',
      oninput: (e) => { if (op.tipo === 'date' && !dataCompleta(e.target.value)) return; obj[chave] = op.tipo === 'number' ? Number(e.target.value) : e.target.value; (op.salvar || salvarSessaoDepois)(); if (op.aoMudar) op.aoMudar(); }
    };
    const ctl = op.area ? h('textarea', Object.assign(props, { rows: op.linhas || 3 })) : h('input', props);
    if (op.area) ctl.value = obj[chave] || '';
    return rotulo === null ? ctl : campo(rotulo, ctl, op.ajuda);
  }
  function selecao(obj, chave, rotulo, opcoes, op = {}) {
    const ctl = h('select', {
      onchange: (e) => { obj[chave] = op.numero ? Number(e.target.value) : e.target.value; (op.salvar || salvarSessaoDepois)(); if (op.redesenhar) render(); }
    }, opcoes.map(([v, r]) => h('option', { value: v, selected: String(obj[chave] ?? '') === String(v) }, r)));
    return rotulo === null ? ctl : campo(rotulo, ctl, op.ajuda);
  }
  function marcar(obj, chave, rotulo, op = {}) {
    return h('label', { class: 'marcar' }, h('input', {
      type: 'checkbox', checked: op.padraoVerdadeiro ? obj[chave] !== false : !!obj[chave],
      onchange: (e) => { obj[chave] = e.target.checked; (op.salvar || salvarSessaoDepois)(); if (op.redesenhar) render(); }
    }), h('span', {}, rotulo));
  }
  function botoes(opcoes, valorAtual, aoEscolher) {
    return h('div', { class: 'segmentado' }, opcoes.map(([v, r]) => h('button', { type: 'button', class: String(valorAtual) === String(v) ? 'ativo' : '', onclick: () => aoEscolher(v) }, r)));
  }

  function todasPessoas() {
    const db = S.db;
    const lista = db.irmaos.filter((i) => i.ativo !== false).map((i) => ({ nome: i.nome, grau: i.grau }));
    db.visitantes.forEach((v) => lista.push({ nome: v.nome, grau: v.grau, loja: v.loja, cargo: v.cargo }));
    return lista;
  }
  function acharPessoa(nome) {
    const n = (nome || '').trim().toLowerCase();
    return todasPessoas().find((p) => p.nome.toLowerCase() === n);
  }
  /* ---------- Grau na data da sessão (aba "Graus e datas") ---------- */
  const ORDEM_GRAU = ['AM', 'CM', 'MM', 'MI'];
  const DATAS_GRAU = [['iniciacao', 'Iniciação', 0], ['passagem', 'Passagem a C∴M∴ (GLMERGS: Elevação)', 1], ['elevacao', 'Elevação a M∴M∴ (GLMERGS: Exaltação)', 2], ['instalacao', 'Instalação (M∴I∴)', 3]];
  function irmaoDoCadastro(nome) {
    const n = (nome || '').trim().toLowerCase();
    return n ? S.db.irmaos.find((i) => (i.nome || '').trim().toLowerCase() === n) : null;
  }
  /* Usa as datas registradas; sem datas, vale o grau atual do cadastro */
  function grauNaData(irmao, data) {
    let i = ORDEM_GRAU.indexOf(irmao.grau || '');
    if (!data) return irmao.grau || '';
    for (let k = DATAS_GRAU.length - 1; k >= 1; k--) {
      const [campo, , g] = DATAS_GRAU[k];
      if (!irmao[campo]) continue;
      // no dia da própria Passagem, Elevação ou Instalação o Irmão ainda tem o grau anterior (a ata registra a cerimônia)
      if (irmao[campo] < data) i = Math.max(i, g); else if (i >= g) i = g - 1;
    }
    if (i < 0 && irmao.iniciacao && irmao.iniciacao <= data) i = 0;
    return i >= 0 ? ORDEM_GRAU[i] : (irmao.grau || '');
  }
  /* Grau mais alto já alcançado até hoje, pelas datas */
  function grauAtualPelasDatas(irmao) {
    let i = ORDEM_GRAU.indexOf(irmao.grau || '');
    DATAS_GRAU.forEach(([campo, , g]) => { if (irmao[campo] && irmao[campo] <= hoje()) i = Math.max(i, g); });
    return i >= 0 ? ORDEM_GRAU[i] : '';
  }
  /* Cópia da sessão com o grau de cada Irmão do quadro na data da sessão */
  function sessaoComGrausDaData(s) {
    const c = JSON.parse(JSON.stringify(s));
    const visitar = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(visitar); return; }
      if (typeof o.nome === 'string' && 'grau' in o) {
        const irm = irmaoDoCadastro(o.nome);
        const temDatas = irm && DATAS_GRAU.some(([campo]) => irm[campo]);
        if (irm && (temDatas || !o.grau)) o.grau = grauNaData(irm, s.data);
      }
      Object.values(o).forEach(visitar);
    };
    ['vm', 'v1', 'v2', 'secretario', 'agenda', 'ocorrencias', 'presentes', 'doenca', 'boasNovas', 'palavraAberta', 'palavraAutoridade', 'ausencias'].forEach((k) => visitar(c[k]));
    return c;
  }
  /* Nominata em vigor na data: a nova administração vale a partir do dia seguinte à posse */
  function nominataNaData(data) {
    const c = S.db.config;
    const lista = (c.historico || []).concat([{ administracao: c.administracao, posse: c.posse || '', cargos: c.cargos || [] }]);
    if (c.proxima && c.proxima.posse) lista.push(c.proxima);
    const validas = lista.filter((x) => !data || !x.posse || x.posse < data).sort((a, b) => (a.posse || '').localeCompare(b.posse || ''));
    return validas[validas.length - 1] || lista[0];
  }
  function titularesNaData(data) {
    const nom = nominataNaData(data) || {};
    const pega = (cargo) => ((nom.cargos || []).find((x) => x.cargo === cargo) || {}).nome || '';
    return { administracao: nom.administracao || '', vm: pega('Venerável Mestre'), v1: pega('1º Vigilante'), v2: pega('2º Vigilante'), secretario: pega('Secretário') };
  }
  function gerarAta(s) {
    const cfg = Object.assign({}, S.db.config, { titulares: titularesNaData(s.data) });
    return F.gerar(sessaoComGrausDaData(s), cfg);
  }
  /* Ajustes da versão 2.2 nos dados já salvos */
  function migrarConfig() {
    const c = S.db.config; let mudou = false;
    const renomear = (arr) => (arr || []).forEach((x) => { if (x.cargo === 'Organista') { x.cargo = 'Mestre de Harmonia'; mudou = true; } });
    renomear(c.cargos); if (c.proxima) renomear(c.proxima.cargos); (c.historico || []).forEach((h) => renomear(h.cargos));
    if (c.proxima && c.proxima.administracao === '2026/2027' && !c.proxima.posse) { c.proxima.posse = '2026-12-09'; mudou = true; }
    if (mudou) S.salvarConfig();
  }
  function garantirDatalist() {
    let dl = document.getElementById('dl-pessoas');
    if (!dl) { dl = h('datalist', { id: 'dl-pessoas' }); document.body.append(dl); }
    dl.replaceChildren(...todasPessoas().sort(ALFA).map((p) => h('option', { value: p.nome }, rotuloGrau(p.grau) + (p.loja ? ' · ' + p.loja : ''))));
  }

  /* Pessoa = { nome, grau } com nome sugerido do cadastro */
  function pessoaCampo(obj, chave, rotulo, op = {}) {
    obj[chave] = obj[chave] || { nome: '', grau: '' };
    const p = obj[chave];
    const sel = h('select', { class: 'grau', 'aria-label': 'Grau', onchange: (e) => { p.grau = e.target.value; salvarSessaoDepois(); } },
      GRAU_OPC.map(([v, r]) => h('option', { value: v, selected: p.grau === v }, r)));
    const inp = h('input', {
      value: p.nome || '', list: 'dl-pessoas', placeholder: op.placeholder || 'Nome do Irmão', autocomplete: 'off',
      oninput: (e) => {
        p.nome = e.target.value;
        const achado = acharPessoa(p.nome);
        if (achado) {
          const irm = irmaoDoCadastro(achado.nome); const s = sessaoAtual();
          p.grau = irm && s ? grauNaData(irm, s.data) : achado.grau; sel.value = p.grau || '';
          if (op.comLoja) { if (achado.loja) p.loja = achado.loja; if (achado.cargo && !p.cargo) p.cargo = achado.cargo; }
        }
        salvarSessaoDepois();
      }
    });
    const linha = h('div', { class: 'pessoa' }, inp, sel, op.remover ? h('button', { type: 'button', class: 'icone', title: 'Remover', onclick: op.remover }, '✕') : null);
    return rotulo === null ? linha : campo(rotulo, linha, op.ajuda);
  }
  function listaPessoas(arr, rotulo, textoBotao) {
    if (!arr.length) arr.push({ nome: '', grau: '' });
    return campo(rotulo, h('div', { class: 'pilha' },
      arr.map((_, i) => pessoaCampo(arr, i, null, { remover: arr.length > 1 ? () => { arr.splice(i, 1); salvarSessaoDepois(); render(); } : null })),
      h('button', { type: 'button', class: 'link', onclick: () => { arr.push({ nome: '', grau: '' }); render(); } }, '+ ' + (textoBotao || 'outro Irmão'))));
  }
  function listaCandidatos(arr, rotulo, comResultado) {
    if (!arr.length) arr.push({ nome: '', resultado: 'aprovado' });
    return campo(rotulo, h('div', { class: 'pilha' },
      arr.map((c, i) => h('div', { class: 'pessoa' },
        h('input', { value: c.nome || '', placeholder: 'Nome completo do candidato', oninput: (e) => { c.nome = e.target.value; salvarSessaoDepois(); } }),
        comResultado ? selecao(c, 'parecer', null, [['favoravel', 'Parecer favorável'], ['contrario', 'Parecer contrário']]) : null,
        comResultado ? selecao(c, 'resultado', null, [['aprovado', 'Clara: aprovada'], ['rejeitado', 'Nublada: rejeitada'], ['novo', 'Anulada: repetir']]) : null,
        arr.length > 1 ? h('button', { type: 'button', class: 'icone', onclick: () => { arr.splice(i, 1); salvarSessaoDepois(); render(); } }, '✕') : null)),
      h('button', { type: 'button', class: 'link', onclick: () => { arr.push({ nome: '', resultado: 'aprovado' }); render(); } }, '+ outro candidato')));
  }
  function atalhos(obj, chave, frases, substituir) {
    return h('div', { class: 'atalhos' }, frases.map((f) => h('button', {
      type: 'button', class: 'chip', onclick: () => {
        const atual = (obj[chave] || '').trim().replace(/[.;]$/, '');
        obj[chave] = atual && !substituir ? atual + ', ' + f : f; salvarSessaoDepois(); render();
      }
    }, /\s$/.test(f) ? f.trim() + '…' : f)));
  }
  function cartao(titulo, corpo, aoRemover, extra) {
    return h('div', { class: 'cartao' },
      h('div', { class: 'cartao-topo' }, h('strong', {}, titulo), extra || null,
        aoRemover ? h('button', { type: 'button', class: 'icone', title: 'Remover', onclick: aoRemover }, '✕') : null),
      corpo);
  }

  /* ---------------- sessões ---------------- */
  function sessaoAtual() { return S.db.sessoes.find((x) => x.id === estado.sessaoId); }
  function ordenadas() { return S.db.sessoes.slice().sort((a, b) => (b.data || '').localeCompare(a.data || '') || (b.numero || 0) - (a.numero || 0)); }
  function pessoaDoCadastro(nome) { const p = acharPessoa(nome); return { nome: nome || '', grau: p ? p.grau : '' }; }
  function nomeDoCargo(cargo) { const c = (S.db.config.cargos || []).find((x) => x.cargo === cargo); return c ? c.nome : ''; }
  function hoje() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /* Troca para a nova administração quando a data da posse já passou */
  function ativarProxima() {
    const c = S.db.config, p = c.proxima;
    if (!p) return;
    c.historico = c.historico || [];
    c.historico.push({ administracao: c.administracao, posse: c.posse || '', cargos: c.cargos || [] });
    const pega = (cargo) => ((p.cargos || []).find((x) => x.cargo === cargo) || {}).nome || '';
    c.administracao = p.administracao; c.posse = p.posse || ''; c.cargos = p.cargos || [];
    c.vm = pega('Venerável Mestre'); c.v1 = pega('1º Vigilante'); c.v2 = pega('2º Vigilante');
    c.secretario = pega('Secretário'); c.secretarioPadrao = c.secretario;
    delete c.proxima;
    S.salvarConfig();
    // o novo Venerável Mestre passa a ser Mestre Instalado após a instalação
    const novoVM = S.db.irmaos.find((i) => i.nome.toLowerCase() === (c.vm || '').toLowerCase());
    if (novoVM && novoVM.grau === 'MM') { novoVM.grau = 'MI'; S.salvarLista('irmaos'); }
  }
  function verificarPosse() {
    const p = S.db.config.proxima;
    if (p && p.posse && hoje() > p.posse) { ativarProxima(); aviso('A Administração ' + S.db.config.administracao + ' passou a valer (posse em ' + E.dataCurta(S.db.config.posse) + ').'); }
  }

  function novaSessao() {
    verificarPosse();
    const c = S.db.config;
    const data = hoje(); const ano = data.slice(0, 4);
    // numeração por ano civil: volta ao nº 1 em 1º de janeiro
    const doAno = S.db.sessoes.filter((x) => String(x.data || '').slice(0, 4) === ano);
    const numero = doAno.reduce((m, x) => Math.max(m, Number(x.numero) || 0), 0) + 1;
    const anterior = ordenadas()[0];
    const tit = titularesNaData(data);
    const secNome = (anterior && anterior.secretario && anterior.secretario.nome) || c.secretarioPadrao || tit.secretario;
    const s = {
      id: S.novoId('s'), numero, administracao: tit.administracao || c.administracao, data, grau: 1, tipoSessao: 'Ordinária', boasNovas: [], ausencias: [],
      horaAbertura: '', horaEncerramento: '',
      vm: pessoaDoCadastro(tit.vm || c.vm), v1: pessoaDoCadastro(tit.v1 || c.v1), v2: pessoaDoCadastro(tit.v2 || c.v2),
      secretario: pessoaDoCadastro(secNome),
      agenda: [], ataAnterior: anterior ? { status: 'conhecimento', numero: anterior.numero, ano: String(anterior.data || '').slice(0, 4), meio: 'digitalmente' } : { status: 'nao_registrar', numero: '' }, expediente: [],
      ocorrencias: [], presentes: [], visitantes: [], doenca: [], palavraAberta: [], palavraAutoridade: [],
      palavraVM: { agradeceuPresenca: true, agradeceuVisitantes: true, agape: true }, status: 'rascunho'
    };
    S.salvarSessao(s).then(marcarStatus);
    estado.sessaoId = s.id; estado.passo = 0; estado.vista = 'editor';
    render();
  }

  /* ---------------- vistas ---------------- */
  function render() {
    const y = window.scrollY;
    garantirDatalist();
    document.querySelectorAll('#abas button').forEach((b) => b.classList.toggle('ativo', b.dataset.vista === (estado.vista === 'editor' ? 'lista' : estado.vista)));
    const v = { lista: vistaLista, editor: vistaEditor, cadastros: vistaCadastros, ajustes: vistaAjustes }[estado.vista]();
    app().replaceChildren(v);
    window.scrollTo(0, y);
    const ativo = document.querySelector('.passos button.ativo');
    if (ativo) { const lista = ativo.closest('.passos'); lista.scrollLeft = ativo.parentElement.offsetLeft - 24; }
    marcarStatus();
  }

  function vistaLista() {
    const lista = ordenadas();
    return h('section', {},
      S.status === 'local' ? h('div', { class: 'faixa' }, 'Os dados estão salvos só neste aparelho. Para que todos os secretários vejam as mesmas atas, conecte a planilha da Loja em ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); irPara('ajustes'); } }, 'Ajustes'), '.') : null,
      S.status === 'offline' ? h('div', { class: 'faixa alerta' }, 'Sem conexão com a planilha (' + S.ultimoErro + '). Você pode continuar; as alterações serão enviadas depois.') : null,
      h('button', { type: 'button', class: 'principal grande', onclick: novaSessao }, '+ Nova ata'),
      h('h2', {}, 'Atas registradas'),
      lista.length ? h('div', { class: 'lista-atas' }, lista.map((s) => h('div', { class: 'item-ata' },
        h('button', { type: 'button', class: 'item-ata-abrir', onclick: () => { estado.sessaoId = s.id; estado.passo = s.status === 'finalizada' ? 7 : 0; estado.vista = 'editor'; render(); window.scrollTo(0, 0); } },
          h('span', { class: 'item-num' }, 'Ata nº ' + String(s.numero || '').padStart(2, '0')),
          h('span', { class: 'item-data' }, E.dataCurta(s.data) + ' · ' + s.grau + 'º Grau · Adm. ' + (s.administracao || '')),
          h('span', { class: 'item-sec' }, (s.secretario && s.secretario.nome) || ''),
          h('span', { class: 'etiqueta ' + (s.status === 'finalizada' ? 'ok' : '') }, s.status === 'finalizada' ? 'Finalizada' : 'Rascunho')),
        estado.excluindo === s.id
          ? h('div', { class: 'confirmar' }, h('span', {}, 'Excluir esta ata?'),
            h('button', { type: 'button', class: 'perigo', onclick: async () => { estado.excluindo = null; await S.excluirSessao(s.id); render(); aviso('Ata excluída.'); } }, 'Excluir'),
            h('button', { type: 'button', onclick: () => { estado.excluindo = null; render(); } }, 'Cancelar'))
          : h('button', { type: 'button', class: 'icone', title: 'Excluir', onclick: () => { estado.excluindo = s.id; render(); } }, '🗑')
      ))) : h('p', { class: 'vazio' }, 'Nenhuma ata ainda. Toque em “Nova ata” para começar.')
    );
  }

  function vistaEditor() {
    const s = sessaoAtual();
    if (!s) { estado.vista = 'lista'; return vistaLista(); }
    const passos = [passoSessao, passoAgenda, passoAtaAnterior, passoOcorrencias, passoPresenca, passoDoenca, passoPalavra, passoRevisar];
    return h('section', { class: 'editor' },
      h('div', { class: 'editor-topo' },
        h('button', { type: 'button', class: 'link', onclick: () => { estado.vista = 'lista'; render(); } }, '← Atas'),
        h('strong', {}, 'Ata nº ' + String(s.numero || '').padStart(2, '0') + ' · ' + E.dataCurta(s.data))),
      h('ol', { class: 'passos' }, PASSOS.map((p, i) => h('li', {}, h('button', { type: 'button', class: i === estado.passo ? 'ativo' : '', onclick: () => irPasso(i) }, h('span', { class: 'n' }, i + 1), h('span', { class: 'p' }, p))))),
      caixaACompletar(s),
      h('h2', {}, (estado.passo + 1) + '. ' + PASSOS[estado.passo]),
      passos[estado.passo](s),
      h('div', { class: 'navegacao' },
        estado.passo > 0 ? h('button', { type: 'button', onclick: () => irPasso(estado.passo - 1) }, '← Voltar') : h('span'),
        estado.passo < PASSOS.length - 1 ? h('button', { type: 'button', class: 'principal', onclick: () => irPasso(estado.passo + 1) }, 'Próximo →') : h('span'))
    );
  }
  /* Itens que faltam preencher (atas antigas trazidas para o sistema) */
  function caixaACompletar(s) {
    const lista = (s.aCompletar || []);
    const abertos = lista.filter((x) => !x.feito);
    if (!lista.length) return null;
    if (!abertos.length) return h('div', { class: 'faixa' }, 'Todos os itens a completar desta ata foram resolvidos.');
    return h('div', { class: 'pendencias' }, h('strong', {}, 'A completar nesta ata (' + abertos.length + ')'),
      abertos.map((x) => h('div', { class: 'pendencia' },
        h('span', {}, (x.passo !== undefined ? 'Passo ' + (x.passo + 1) + ': ' : '') + x.texto),
        x.passo !== undefined && x.passo !== estado.passo ? h('button', { type: 'button', class: 'pequeno', onclick: () => irPasso(x.passo) }, 'Ir') : null,
        h('button', { type: 'button', class: 'pequeno', onclick: () => { x.feito = true; salvarSessaoDepois(); render(); } }, 'Resolvido'))));
  }
  function irPasso(i) { estado.passo = i; render(); window.scrollTo(0, 0); }

  /* Passo 1 */
  function passoSessao(s) {
    return h('div', { class: 'formulario' },
      h('div', { class: 'linha2' },
        texto(s, 'numero', 'Número da ata', { tipo: 'number', ajuda: 'Sugerido automaticamente.' }),
        texto(s, 'administracao', 'Administração', { placeholder: '2025/2026' })),
      texto(s, 'data', 'Data da sessão', { tipo: 'date' }),
      selecao(s, 'tipoSessao', 'Tipo de sessão', F.TIPOS_SESSAO, { ajuda: 'Iniciação, Passagem e Elevação são Sessões Magnas.' }),
      texto(s, 'nomeSessao', 'Nome da sessão no título (opcional)', { placeholder: 'Ex.: Magna Festiva, Magna Pública Branca, Administrativa', ajuda: 'Deixe em branco para o título automático. O título fica “Sessão” + este nome + o grau.' }),
      campo('Grau em que a Loja foi aberta', botoes([[1, '1º Aprendiz'], [2, '2º Companheiro'], [3, '3º Mestre']], s.grau, (v) => { s.grau = Number(v); salvarSessaoDepois(); render(); })),
      h('div', { class: 'linha2' },
        texto(s, 'horaAbertura', 'Hora da abertura', { tipo: 'time' }),
        texto(s, 'horaEncerramento', 'Hora do fechamento', { tipo: 'time', ajuda: 'Pode preencher no fim da sessão.' })),
      h('h3', {}, 'Quem ocupou as Estações'),
      pessoaCampo(s, 'vm', 'Estação do Leste: Venerável Mestre', { ajuda: 'Se não for o VM titular, a ata registra “Venerável Mestre em exercício”.' }),
      pessoaCampo(s, 'v1', 'Estação do Oeste: 1º Vigilante'),
      pessoaCampo(s, 'v2', 'Estação do Sul: 2º Vigilante'),
      h('h3', {}, 'Quem lavra a ata'),
      pessoaCampo(s, 'secretario', 'Secretário'),
      (() => {
        const t = titularesNaData(s.data);
        const linhas = [['1º Vigilante', s.v1, t.v1], ['2º Vigilante', s.v2, t.v2], ['Secretário', s.secretario, t.secretario]]
          .filter(([, p, tt]) => tt && p && p.nome && p.nome.trim().toLowerCase() !== tt.trim().toLowerCase())
          .map(([cargo, , tt]) => cargo + ' Ad Hoc (o titular é ' + tt + ')');
        return h('p', { class: 'ajuda' }, 'Administração ' + (t.administracao || s.administracao || '') + '. ' +
          (linhas.length ? 'A ata vai registrar: ' + linhas.join('; ') + '.' : 'Todos os cargos estão com os titulares.') +
          ' Quem não é o titular do cargo sai como Ad Hoc automaticamente (o V∴M∴ substituto sai como “em exercício”).');
      })()
    );
  }

  /* Passo 2 */
  function novoItem(tipo) {
    const base = { id: S.novoId('a'), tipo };
    const extras = {
      instrucao: { grauInstrucao: 'AM', codigo: '1-I', numero: 1, parte: '', irmaos: [], ministrante: { nome: '', grau: '' } },
      trabalho: { irmao: { nome: '', grau: '' }, ordinalTrabalho: '', grauTrabalho: 'AM', titulo: '', orientador: { nome: '', grau: '' }, momento: 'loja', debate: false, participantes: [] },
      palestra: { irmao: { nome: '', grau: '' }, titulo: '', convidado: false, origem: '', momento: 'descanso', debate: false, participantes: [] },
      debate: { irmao: { nome: '', grau: '' }, titulo: '', momento: 'descanso', debate: true, participantes: [], contribuicoes: '' },
      orientacoes: { natureza: 'orientacoes', irmaos: [], titulo: '', momento: 'descanso', debate: false, participantes: [] },
      leitura_proposta: { processo: 'Iniciação', leitura: 1, candidatos: [], objecao: 'sem', proponente: { nome: '', grau: '' } },
      sindicancia: { processo: 'Iniciação', fase: 'designacao', candidatos: [], comissao: [], parecer: 'favoravel' },
      escrutinio: { processo: 'Iniciação', candidatos: [], devidaForma: false },
      cerimonia: { cerimonia: 'Iniciação', parte: '', pessoas: [], designado: { nome: '', grau: '' } },
      cobertura_altar: { irmao: { nome: '', grau: 'MM' }, falecimento: '', iniciado: '', passado: '', elevado: '', instalado: '', membroHa: '', despedidaData: '', despedidaLocal: '', cobrir: true, dias: 30 },
      entrega_identidade: { entregas: [{ entrega: { nome: '', grau: '' }, recebe: { nome: '', grau: '' }, grau: 'AM' }] },
      prestacao_contas: { irmao: pessoaDoCadastro(nomeDoCargo('Tesoureiro')), periodo: '', resultado: 'informativa', ressalva: '', momento: 'descanso', debate: false, participantes: [] },
      leitura_documento: { documento: 'Decreto', numeroDoc: '', origem: '', resumo: '' },
      reuniao_administrativa: { assuntos: [''] },
      votacao: { assunto: '', resultadoTipo: 'unanimidade', resultadoVotacao: '' },
      eleicao: (() => { const p = S.db.config.proxima || {}; return { administracao: p.administracao || '', forma: 'unanimidade', posse: p.posse || '', cargos: (p.cargos || []).map((x) => ({ cargo: x.cargo, pessoa: pessoaDoCadastro(x.nome) })) }; })(),
      instalacao: (() => { const p = S.db.config.proxima || {}; const vm = ((p.cargos || []).find((x) => x.cargo === 'Venerável Mestre') || {}).nome; return { administracao: p.administracao || '', modalidade: 'ambas', vm: pessoaDoCadastro(vm || ''), instalador: { nome: '', grau: '' } }; })(),
      outro: { texto: '', observacao: '' }
    };
    return Object.assign(base, JSON.parse(JSON.stringify(extras[tipo] || {})));
  }
  /* Em loja ou no descanso, debate e quem participou */
  function blocoMomento(it) {
    if (F.MOMENTO_PADRAO[it.tipo] === undefined) return null;
    const m = it.momento = F.momentoDe(it);
    it.participantes = it.participantes || [];
    const comDebate = it.tipo !== 'debate';
    return h('div', { class: 'subcartao' },
      selecao(it, 'momento', 'Quando foi tratado', F.MOMENTOS, { redesenhar: true, ajuda: m === 'loja' ? 'Assuntos formais e protocolares, com a Loja trabalhando.' : 'Vai para a parte “Período de descanso” da ata.' }),
      ['trabalho', 'palestra', 'prestacao_contas', 'orientacoes'].includes(it.tipo) ? marcar(it, 'slides', 'Com apresentação de slides') : null,
      comDebate ? marcar(it, 'debate', it.tipo === 'prestacao_contas' ? 'Houve perguntas e esclarecimentos' : 'Houve debate (os Irmãos deram suas opiniões)', { redesenhar: true }) : null,
      it.debate || !comDebate ? [
        listaPessoas(it.participantes, 'Quem participou com opiniões e contribuições (opcional)', 'participante'),
        h('p', { class: 'ajuda' }, 'Sem nomes, a ata diz “vários Irmãos apresentaram seus pontos de vista”.'),
        texto(it, 'contribuicoes', 'Resumo das contribuições (opcional)', { area: true, linhas: 2, placeholder: 'Ex.: Foram destacados o simbolismo da dualidade e a importância da tolerância entre os Irmãos.' })] : null);
  }
  function camposItem(it) {
    const campos = camposItemBase(it);
    const bloco = blocoMomento(it);
    return bloco ? [].concat(campos, [bloco]) : campos;
  }
  function camposItemBase(it) {
    switch (it.tipo) {
      case 'instrucao': return [
        campo('Instrução de', botoes([['AM', 'A∴M∴'], ['CM', 'C∴M∴'], ['MM', 'M∴M∴']], it.grauInstrucao, (v) => { it.grauInstrucao = v; salvarSessaoDepois(); render(); })),
        (it.grauInstrucao || 'AM') === 'AM'
          ? selecao(it, 'codigo', 'Qual instrução (conforme o Ritual do 1º Grau)', F.INSTRUCOES_AM.concat([['', 'Outra (numerar)']]), { redesenhar: true })
          : null,
        (it.grauInstrucao || 'AM') !== 'AM' || !it.codigo ? h('div', { class: 'linha2' },
          selecao(it, 'numero', 'Qual instrução', [[1, '1ª'], [2, '2ª'], [3, '3ª']], { numero: true, redesenhar: true }),
          selecao(it, 'parte', 'Parte', [['', 'Inteira'], ['Parte I', 'Parte I'], ['Parte II', 'Parte II']], { redesenhar: true })) : null,
        listaPessoas(it.irmaos, 'Para o(s) Irmão(s)'),
        pessoaCampo(it, 'ministrante', 'Ministrada por (opcional)', { ajuda: 'Deixe vazio se foi o próprio V∴M∴. Se for outro Irmão, a ata registra “por designação do V∴M∴”.' })];
      case 'trabalho': return [
        pessoaCampo(it, 'irmao', 'Quem apresentou'),
        h('div', { class: 'linha2' },
          selecao(it, 'ordinalTrabalho', 'É trabalho obrigatório de grau?', [['', 'Não'], [1, '1º trabalho'], [2, '2º trabalho'], [3, '3º trabalho']], { redesenhar: true }),
          it.ordinalTrabalho ? selecao(it, 'grauTrabalho', 'Do grau', [['AM', 'A∴M∴'], ['CM', 'C∴M∴']], { redesenhar: true }) : h('span')),
        texto(it, 'titulo', F.momentoDe(it) === 'descanso' ? 'Tema (opcional)' : 'Título (opcional)', F.momentoDe(it) === 'descanso' ? { placeholder: 'Ex.: o Pavimento Mosaico' } : {}),
        pessoaCampo(it, 'orientador', 'Mestre Maçom orientador (opcional)', { ajuda: 'O V∴M∴ designa um Mestre Maçom para orientar os trabalhos de A∴M∴ e C∴M∴.' }),
        texto(it, 'observacao', 'Observação para a ata (opcional)', { placeholder: 'Ex.: O trabalho foi apresentado à frente da Estação do Oeste, voltado para o Leste.' }),
        atalhos(it, 'observacao', ['O trabalho foi apresentado à frente da Estação do Oeste, voltado para o Leste', 'O V∴M∴ parabenizou o Irmão pelo trabalho', 'O trabalho será arquivado na Secretaria'], true)];
      case 'palestra': return [
        marcar(it, 'convidado', 'Palestrante convidado (não é Irmão do quadro nem visitante)', { redesenhar: true }),
        it.convidado ? [texto(it.irmao = it.irmao || { nome: '', grau: '' }, 'nome', 'Nome do palestrante'), marcar(it, 'feminino', 'É uma palestrante (a ata diz “a palestrante convidada”)'), texto(it, 'origem', 'Quem é (opcional)', { placeholder: 'Ex.: médico cardiologista; Professor da UFRGS' })] : pessoaCampo(it, 'irmao', 'Quem apresentou'),
        texto(it, 'titulo', 'Tema', { placeholder: 'Ex.: a história da Maçonaria no Rio Grande do Sul' }), texto(it, 'observacao', 'Observação (opcional)')];
      case 'debate': return [
        texto(it, 'titulo', 'Tema do debate', { placeholder: 'Ex.: os significados do Pavimento Mosaico' }),
        pessoaCampo(it, 'irmao', 'Quem conduziu (opcional)')];
      case 'orientacoes': return [
        selecao(it, 'natureza', 'O que foi', F.NATUREZA_ORIENT),
        texto(it, 'titulo', 'Assunto (opcional)', { placeholder: 'Ex.: a frequência às sessões e a entrega dos trabalhos de grau' }),
        listaPessoas(it.irmaos = it.irmaos || [], 'Quem orientou (opcional)'),
        h('p', { class: 'ajuda' }, 'Serve também para as orientações e “puxões de orelha” coletivos dados pelos Irmãos mais antigos.'),
        texto(it, 'observacao', 'Resumo para a ata (opcional)', { area: true, linhas: 2 })];
      case 'leitura_proposta': return [
        h('div', { class: 'linha2' },
          selecao(it, 'processo', 'Processo', [['Iniciação', 'Iniciação'], ['Filiação', 'Filiação'], ['Regularização', 'Regularização']], { redesenhar: true }),
          selecao(it, 'leitura', 'Leitura', [[1, '1ª leitura'], [2, '2ª leitura'], [3, '3ª leitura']], { numero: true, redesenhar: true })),
        listaCandidatos(it.candidatos, it.processo === 'Iniciação' || !it.processo ? 'Candidatos (peticionários)' : 'Irmãos peticionários'),
        pessoaCampo(it, 'proponente', 'Proponente (opcional)'),
        selecao(it, 'objecao', 'Houve objeção?', [['sem', 'Não houve objeção'], ['com', 'Houve objeção']])];
      case 'sindicancia': return [
        h('div', { class: 'linha2' },
          selecao(it, 'fase', 'O que aconteceu', [['designacao', 'Comissão designada'], ['parecer', 'Comissão deu o parecer']], { redesenhar: true }),
          selecao(it, 'processo', 'Processo', [['Iniciação', 'Iniciação'], ['Filiação', 'Filiação'], ['Regularização', 'Regularização']], { redesenhar: true })),
        listaCandidatos(it.candidatos, 'Peticionário(s)'),
        listaPessoas(it.comissao = it.comissao || [], 'Irmãos da comissão', 'membro da comissão'),
        it.fase === 'parecer' ? selecao(it, 'parecer', 'Parecer', [['favoravel', 'Favorável'], ['contrario', 'Contrário']]) : null];
      case 'escrutinio': return [
        selecao(it, 'processo', 'Processo', [['Iniciação', 'Iniciação'], ['Filiação', 'Filiação'], ['Regularização', 'Regularização']], { redesenhar: true }),
        listaCandidatos(it.candidatos, 'Peticionários e resultado', true),
        h('p', { class: 'ajuda' }, 'Clara = aprovada. Nublada = três ou mais esferas pretas, rejeitada. Anulada = o V∴M∴ usou a prerrogativa de anular e repetir a votação.'),
        marcar(it, 'devidaForma', 'O V∴M∴ determinou a votação na devida forma (com o Sinal do Grau)')];
      case 'cerimonia': return [
        campo('Cerimônia', botoes(Object.keys(F.CERIMONIAS).map((k) => [k, k]), it.cerimonia, (v) => { it.cerimonia = v; salvarSessaoDepois(); render(); })),
        ['Iniciação', 'Passagem', 'Elevação'].includes(it.cerimonia || 'Iniciação') ? selecao(it, 'parte', 'Parte', [['', 'Cerimônia completa'], ['Primeira Seção', 'Primeira Seção'], ['Segunda Seção', 'Segunda Seção']], { redesenhar: true }) : null,
        (it.cerimonia || 'Iniciação') === 'Iniciação' ? listaCandidatos(it.pessoas, 'Candidatos iniciados') : listaPessoas(it.pessoas, 'Irmão(s)'),
        (it.cerimonia || 'Iniciação') === 'Iniciação' ? pessoaCampo(it, 'designado', 'Mestre Maçom designado para assistir o novo A∴M∴ (opcional)') : null,
        texto(it, 'observacao', 'Observação (opcional)', { placeholder: 'Ex.: Foram Condutores os Irmãos …' })];
      case 'cobertura_altar': return [
        pessoaCampo(it, 'irmao', 'Irmão falecido'),
        texto(it, 'falecimento', 'Data do passamento', { tipo: 'date' }),
        h('div', { class: 'linha2' }, texto(it, 'iniciado', 'Iniciado em', { tipo: 'date' }), texto(it, 'passado', 'Passado em', { tipo: 'date' })),
        h('div', { class: 'linha2' }, texto(it, 'elevado', 'Elevado em', { tipo: 'date' }), texto(it, 'instalado', 'Mestre Instalado em (se for)', { tipo: 'date' })),
        texto(it, 'membroHa', 'Membro da Loja há', { placeholder: 'Ex.: 8 anos, 3 meses e 12 dias' }),
        h('div', { class: 'linha2' }, texto(it, 'despedidaData', 'Despedida Maçônica em', { tipo: 'date' }), texto(it, 'despedidaLocal', 'Local da Despedida', { placeholder: 'Ex.: no Crematório Metropolitano' })),
        marcar(it, 'cobrir', 'O Altar foi coberto', { padraoVerdadeiro: true, redesenhar: true }),
        it.cobrir !== false ? texto(it, 'dias', 'Por quantos dias', { tipo: 'number', ajuda: 'Geralmente 30 dias.' }) : null];
      case 'entrega_identidade': return [
        h('div', { class: 'pilha' }, it.entregas.map((e, i) => h('div', { class: 'subcartao' },
          pessoaCampo(e, 'recebe', 'Recebeu'),
          selecao(e, 'grau', 'Identidade do grau', [['AM', 'A∴M∴'], ['CM', 'C∴M∴'], ['MM', 'M∴M∴']]),
          pessoaCampo(e, 'entrega', 'Quem entregou (opcional)'),
          it.entregas.length > 1 ? h('button', { type: 'button', class: 'link perigo-texto', onclick: () => { it.entregas.splice(i, 1); salvarSessaoDepois(); render(); } }, 'Remover esta entrega') : null))),
        h('button', { type: 'button', class: 'link', onclick: () => { it.entregas.push({ entrega: { nome: '', grau: '' }, recebe: { nome: '', grau: '' }, grau: 'AM' }); render(); } }, '+ outra entrega')];
      case 'prestacao_contas': return [
        pessoaCampo(it, 'irmao', 'Quem apresentou'), texto(it, 'periodo', 'Período (opcional)', { placeholder: 'Ex.: ao primeiro semestre de 2026' }),
        selecao(it, 'resultado', 'Resultado', [['informativa', 'Apenas apresentada aos Irmãos'], ['aprovada', 'Aprovada sem ressalvas'], ['ressalva', 'Com ressalvas']], { redesenhar: true }),
        it.resultado === 'ressalva' ? texto(it, 'ressalva', 'Quais ressalvas') : null];
      case 'leitura_documento': return [
        selecao(it, 'documento', 'Documento', ['Decreto', 'Ato', 'Lei', 'Instrução Normativa', 'Circular', 'Boletim', 'Ofício'].map((x) => [x, x]), { redesenhar: true, ajuda: 'Leis, atos e decretos são ouvidos sob o Sinal de Fidelidade; a ata registra isso.' }),
        h('div', { class: 'linha2' }, texto(it, 'numeroDoc', 'Número', { placeholder: 'Ex.: 115' }), texto(it, 'origem', 'De quem / gestão', { placeholder: 'Ex.: gestão 2024/2027, do Sereníssimo Grão-Mestre' })),
        texto(it, 'resumo', 'Resumo (opcional)', { area: true, linhas: 2 })];
      case 'reuniao_administrativa': return [
        campo('Assuntos tratados', h('div', { class: 'pilha' }, it.assuntos.map((a, i) => h('div', { class: 'pessoa' },
          h('input', { value: a, placeholder: 'Assunto ' + (i + 1), oninput: (e) => { it.assuntos[i] = e.target.value; salvarSessaoDepois(); } }),
          it.assuntos.length > 1 ? h('button', { type: 'button', class: 'icone', onclick: () => { it.assuntos.splice(i, 1); salvarSessaoDepois(); render(); } }, '✕') : null)),
          h('button', { type: 'button', class: 'link', onclick: () => { it.assuntos.push(''); render(); } }, '+ outro assunto')))];
      case 'eleicao': return [
        h('div', { class: 'linha2' }, texto(it, 'administracao', 'Administração eleita', { placeholder: '2026/2027' }), texto(it, 'posse', 'Data da posse (se já marcada)', { tipo: 'date' })),
        selecao(it, 'forma', 'Como foi eleita', [['unanimidade', 'Por unanimidade'], ['maioria', 'Pela maioria dos votos']], { ajuda: 'O Ritual do York veda a “aclamação”. São eletivos VM, Vigilantes, Tesoureiro e Secretário; os demais cargos aparecem como indicados pelo VM eleito.' }),
        campo('Nominata eleita', h('div', { class: 'pilha' }, it.cargos.map((c, i) => h('div', { class: 'subcartao' },
          h('input', { value: c.cargo, placeholder: 'Cargo', oninput: (e) => { c.cargo = e.target.value; salvarSessaoDepois(); } }),
          pessoaCampo(c, 'pessoa', null, { remover: () => { it.cargos.splice(i, 1); salvarSessaoDepois(); render(); } }))),
          h('button', { type: 'button', class: 'link', onclick: () => { it.cargos.push({ cargo: '', pessoa: { nome: '', grau: '' } }); render(); } }, '+ cargo')),
          S.db.config.proxima ? null : 'Dica: cadastre a nominata em Ajustes > Próxima administração para ela vir preenchida.')];
      case 'instalacao': return [
        texto(it, 'administracao', 'Administração', { placeholder: '2026/2027' }),
        selecao(it, 'modalidade', 'Cerimônia', [['ambas', 'Investidura do Mestre Eleito + Instalação e Posse dos Oficiais'], ['investidura', 'Só a Investidura do Mestre Eleito (restrita a Mestres Instalados)'], ['posse', 'Só a Instalação e Posse dos Oficiais (sessão pública)']], { redesenhar: true }),
        pessoaCampo(it, 'vm', 'Venerável Mestre'),
        pessoaCampo(it, 'instalador', 'Mestre Instalado que conduziu (opcional)'),
        texto(it, 'observacao', 'Observação (opcional)')];
      case 'votacao': return [
        texto(it, 'assunto', 'O que foi votado', { placeholder: 'Ex.: a alteração do valor da mensalidade' }),
        selecao(it, 'resultadoTipo', 'Resultado', [['unanimidade', 'Aprovada por unanimidade'], ['maioria', 'Aprovada pela maioria'], ['rejeitada', 'Rejeitada'], ['', 'Escrever o resultado']], { redesenhar: true }),
        !it.resultadoTipo ? texto(it, 'resultadoVotacao', 'Resultado', { placeholder: 'Ex.: foi aprovada por 15 votos a 2' }) : null];
      default: return [texto(it, 'texto', 'Como aparece na agenda do dia'), texto(it, 'observacao', 'O que registrar no desenvolvimento (opcional)', { area: true, linhas: 2 })];
    }
  }
  function passoAgenda(s) {
    const pend = F.pendencias(S.db.sessoes, s);
    const nomeTipo = (t) => (F.TIPOS_AGENDA.find((x) => x.id === t) || {}).nome || t;
    return h('div', { class: 'formulario' },
      pend.length ? h('div', { class: 'pendencias' }, h('strong', {}, 'Pendências da Loja (das sessões anteriores)'),
        pend.map((p) => h('div', { class: 'pendencia' }, h('span', {}, p.texto), h('button', {
          type: 'button', class: 'pequeno', onclick: () => {
            let it;
            if (p.tipo === 'leitura') { it = (s.agenda.find((x) => x.tipo === 'leitura_proposta' && Number(x.leitura) === p.proxima && x.processo === p.processo)); if (!it) { it = novoItem('leitura_proposta'); it.leitura = p.proxima; it.processo = p.processo; s.agenda.push(it); } }
            else if (p.tipo === 'escrutinio') { it = s.agenda.find((x) => x.tipo === 'escrutinio' && x.processo === p.processo); if (!it) { it = novoItem('escrutinio'); it.processo = p.processo; s.agenda.push(it); } }
            else { it = s.agenda.find((x) => x.tipo === 'cerimonia' && x.cerimonia === 'Iniciação'); if (!it) { it = novoItem('cerimonia'); s.agenda.push(it); } }
            const arr = p.tipo === 'iniciacao' ? it.pessoas : it.candidatos;
            const vazios = arr.findIndex((c) => !c.nome); if (vazios >= 0) arr.splice(vazios, 1);
            if (!arr.some((c) => (c.nome || '').toUpperCase() === p.nome)) arr.push({ nome: p.nome, resultado: 'aprovado' });
            salvarSessaoDepois(); render();
          }
        }, 'Incluir'))) ) : null,
      s.agenda.length ? null : h('p', { class: 'vazio' }, 'Escolha abaixo o que estava na agenda do dia, na ordem em que aconteceu.'),
      s.agenda.map((it, i) => cartao((i + 1) + ') ' + nomeTipo(it.tipo), h('div', {}, camposItem(it),
        marcar(it, 'naAgenda', 'Constou na Agenda do Dia lida na abertura', { padraoVerdadeiro: F.momentoDe(it) !== 'descanso', redesenhar: true }), (!F.naAgenda(it) ? h('p', { class: 'previa descanso', 'data-item': it.id }, F.momentoDe(it) === 'descanso' ? 'Entra na parte “Período de descanso”, sem constar na Agenda do Dia.' : 'Não consta na Agenda do Dia lida na abertura; entra só no texto da ata.') : h('p', { class: 'previa', 'data-item': it.id }, F.agendaTexto(it)))),
        () => { s.agenda.splice(i, 1); salvarSessaoDepois(); render(); },
        h('span', { class: 'ordem' },
          i > 0 ? h('button', { type: 'button', class: 'icone', title: 'Subir', onclick: () => { s.agenda.splice(i - 1, 0, s.agenda.splice(i, 1)[0]); salvarSessaoDepois(); render(); } }, '↑') : null,
          i < s.agenda.length - 1 ? h('button', { type: 'button', class: 'icone', title: 'Descer', onclick: () => { s.agenda.splice(i + 1, 0, s.agenda.splice(i, 1)[0]); salvarSessaoDepois(); render(); } }, '↓') : null))),
      h('h3', {}, 'Adicionar à agenda'),
      h('div', { class: 'grade-botoes' }, F.TIPOS_AGENDA.map((t) => h('button', { type: 'button', onclick: () => { s.agenda.push(novoItem(t.id)); salvarSessaoDepois(); render(); } }, t.nome)))
    );
  }

  /* Passo 3 */
  function passoAtaAnterior(s) {
    const c = S.db.config;
    s.ataAnterior = s.ataAnterior || { status: 'nao_registrar' };
    const TIPOS_DOC = ['Decreto', 'Ato', 'Lei', 'Circular', 'Boletim', 'Ofício', 'Carta', 'Convite', 'E-mail', 'Correspondência'];
    (s.expediente || []).forEach((e) => { if (e.tipo === 'Prancha') e.tipo = 'Ofício'; });
    if (s.ataAnterior.status === 'dispensada') s.ataAnterior.status = 'conhecimento';
    return h('div', { class: 'formulario' },
      h('h3', {}, 'Ata da última reunião'),
      c.registrarAtaAnterior !== false ? [
        selecao(s.ataAnterior, 'status', 'O que o Secretário fez', [['aprovada', 'Leu a Ata e ela foi aprovada sem manifestação'], ['conhecimento', 'A Ata foi enviada antes e o V∴M∴ perguntou se todos estavam de acordo (aprovada)'], ['aprovada_correcao', 'Houve observação, votada e corrigida (aprovada)'], ['nao_lida', 'A Ata não foi apreciada nesta sessão'], ['nao_registrar', 'Não registrar na ata']], { redesenhar: true }),
        s.ataAnterior.status !== 'nao_registrar' ? texto(s.ataAnterior, 'numero', 'Número da ata anterior', { tipo: 'number' }) : null,
        s.ataAnterior.status === 'conhecimento' ? [texto(s.ataAnterior, 'meio', 'Como foi disponibilizada', { placeholder: 'digitalmente' }), atalhos(s.ataAnterior, 'meio', ['digitalmente', 'por e-mail', 'pelo grupo de mensagens da Loja', 'em cópia impressa'], true)] : null,
        s.ataAnterior.status === 'aprovada_correcao' ? texto(s.ataAnterior, 'correcao', 'Qual a observação/correção', { area: true, linhas: 2 }) : null
      ] : h('p', { class: 'vazio' }, 'O registro da ata anterior está desligado em Ajustes.'),
      c.registrarExpediente !== false ? [
        h('h3', {}, 'Correspondência, atos e decretos'),
        h('p', { class: 'ajuda' }, 'O V∴M∴ pergunta: “Temos correspondência, atos ou decretos?” Ordem sugerida: decretos e atos do Grão-Mestre, circulares da Grande Loja, boletins, correspondência de outras Lojas, correspondência em geral. Se não houve, deixe vazio.'),
        (s.expediente || []).map((e, i) => h('div', { class: 'pessoa' },
          selecao(e, 'tipo', null, TIPOS_DOC.map((x) => [x, x])),
          h('input', { value: e.descricao || '', placeholder: 'Ex.: nº 002/2026 da Loja Jorge Simões nº 310, convidando para sessão pública', oninput: (ev) => { e.descricao = ev.target.value; salvarSessaoDepois(); } }),
          h('button', { type: 'button', class: 'icone', onclick: () => { s.expediente.splice(i, 1); salvarSessaoDepois(); render(); } }, '✕'))),
        h('button', { type: 'button', class: 'link', onclick: () => { s.expediente = s.expediente || []; s.expediente.push({ tipo: 'Ofício', descricao: '' }); render(); } }, '+ correspondência, ato ou decreto')
      ] : null
    );
  }

  /* Passo 4 */
  function passoOcorrencias(s) {
    const tipos = F.TIPOS_OCORRENCIA;
    const nome = (t) => (tipos.find((x) => x[0] === t) || [, t])[1];
    const grauBase = Number(s.grau || 1);
    return h('div', { class: 'formulario' },
      s.ocorrencias.length ? null : h('p', { class: 'vazio' }, 'Nada fora do comum? Pode seguir. A ata dirá que os trabalhos transcorreram com regularidade e harmonia.'),
      s.ocorrencias.map((o, i) => cartao(nome(o.tipo), h('div', {},
        texto(o, 'hora', { descanso: 'Chamada para o descanso', mudanca_grau: 'Suspensão no ' + grauBase + 'º Grau' }[o.tipo] || 'Horário (opcional)', { tipo: 'time' }),
        o.tipo === 'descanso' ? [texto(o, 'horaFim', 'Chamada do descanso para o trabalho', { tipo: 'time' }), texto(o, 'motivo', 'Para quê (opcional)', { placeholder: 'Ex.: para aguardar a preparação do Candidato' }),
          atalhos(o, 'motivo', ['para aguardar a preparação do Candidato', 'enquanto o novo Aprendiz Maçom se vestia'], true),
          texto(o, 'resumo', 'Algo mais no descanso (opcional)', { area: true, linhas: 2, ajuda: 'Trabalhos, palestras, debates, contas e orientações do descanso: cadastre na Agenda do Dia marcando “No período de descanso”. Eles entram sozinhos na parte “Período de descanso”.' })] : null,
        o.tipo === 'mudanca_grau' ? [
          selecao(o, 'grauDestino', 'Loja aberta no', [[2, '2º Grau'], [3, '3º Grau']].filter((x) => x[0] > grauBase), { numero: true }),
          texto(o, 'horaFim', 'Reaberta no ' + grauBase + 'º Grau às', { tipo: 'time' }),
          marcar(o, 'voltou', 'A Loja voltou ao ' + grauBase + 'º Grau na mesma sessão (mesmo sem saber a hora)'),
          texto(o, 'motivo', 'Para quê (opcional)', { placeholder: 'Ex.: para a instrução dos Companheiros Maçons' })] : null,
        ['ingresso', 'saida', 'grandes_honras', 'exame_visitante'].includes(o.tipo) ? listaPessoas(o.pessoas = o.pessoas || [], o.tipo === 'exame_visitante' ? 'Visitante (opcional)' : 'Irmão(s)') : null,
        o.tipo === 'grao_mestre' ? [
          selecao(o, 'cargoGM', 'Quem', [['Grão-Mestre', 'Sereníssimo Grão-Mestre'], ['Grão-Mestre Adjunto', 'Grão-Mestre Adjunto'], ['Representante', 'Representante do Grão-Mestre']]),
          pessoaCampo(o.pessoas = o.pessoas && o.pessoas.length ? o.pessoas : [{ nome: '', grau: 'MI' }], 0, 'Nome'),
          texto(o, 'comitiva', 'Comitiva (opcional)', { placeholder: 'Ex.: dos Grandes Oficiais Irmãos …' }),
          selecao(o, 'malhete', 'Malhete', [['devolveu', 'Ofereceu o malhete, que foi devolvido'], ['aceitou', 'Ofereceu o malhete, que foi aceito'], ['nao', 'Não registrar']])] : null,
        o.tipo === 'exame_visitante' ? selecao(o, 'resultado', 'Resultado', [['admitido', 'Qualificado e admitido'], ['retirou', 'Não qualificado, convidado a retirar-se']]) : null,
        ['saida', 'retirada_aprendizes', 'grandes_honras'].includes(o.tipo) ? texto(o, 'motivo', 'Motivo (opcional)') : null,
        o.tipo === 'outro' ? texto(o, 'texto', 'O que aconteceu', { area: true, linhas: 2 }) : null),
        () => { s.ocorrencias.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('h3', {}, 'Adicionar ocorrência'),
      h('div', { class: 'grade-botoes' }, tipos.map(([t, r]) => h('button', { type: 'button', onclick: () => { s.ocorrencias.push({ tipo: t, hora: '', pessoas: [] }); salvarSessaoDepois(); render(); } }, r)))
    );
  }

  /* Passo 5 */
  function passoPresenca(s) {
    const irmaos = S.db.irmaos.filter((i) => i.ativo !== false);
    const marcados = new Set((s.presentes || []).map((p) => p.id));
    const alternar = (i, on) => {
      s.presentes = (s.presentes || []).filter((p) => p.id !== i.id);
      if (on) s.presentes.push({ id: i.id, nome: i.nome, grau: grauNaData(i, s.data) });
      salvarSessaoDepois();
    };
    const total = F.contarPresenca(s);
    const anterior = ordenadas().find((x) => x.id !== s.id && (x.data || '') <= (s.data || '') && (x.presentes || []).length);
    return h('div', { class: 'formulario' },
      h('div', { class: 'contador' }, h('strong', {}, total.total + ' Irmãos do quadro'), ' · ' + ['MI', 'MM', 'CM', 'AM'].map((g) => total[g] + ' ' + rotuloGrau(g)).join(' · '), ' · ' + (s.visitantes || []).filter((v) => v.nome).length + ' visitantes'),
      marcar(s, 'presencaManual', 'Prefiro digitar só as quantidades (sem marcar nomes)', { redesenhar: true }),
      s.presencaManual
        ? h('div', { class: 'linha4' }, ['MI', 'MM', 'CM', 'AM'].map((g) => { s.contagem = s.contagem || {}; return texto(s.contagem, g, rotuloGrau(g), { tipo: 'number', aoMudar: () => { clearTimeout(passoPresenca.t); passoPresenca.t = setTimeout(render, 600); } }); }))
        : [
          h('div', { class: 'acoes-linha' },
            h('button', { type: 'button', class: 'pequeno', onclick: () => { s.presentes = irmaos.map((i) => ({ id: i.id, nome: i.nome, grau: grauNaData(i, s.data) })); salvarSessaoDepois(); render(); } }, 'Marcar todos'),
            h('button', { type: 'button', class: 'pequeno', onclick: () => { s.presentes = []; salvarSessaoDepois(); render(); } }, 'Desmarcar todos'),
            anterior ? h('button', { type: 'button', class: 'pequeno', onclick: () => { s.presentes = anterior.presentes.filter((p) => irmaos.some((i) => i.id === p.id)).map((p) => Object.assign({}, p)); salvarSessaoDepois(); render(); } }, 'Os mesmos da Ata nº ' + anterior.numero) : null),
          h('div', { class: 'lista-presenca' }, irmaos.slice().sort(ALFA).map((i) => { const g = grauNaData(i, s.data); return h('label', { class: 'marcar presenca' }, h('input', { type: 'checkbox', checked: marcados.has(i.id), onchange: (e) => { alternar(i, e.target.checked); render(); } }), h('span', {}, i.nome), h('span', { class: 'etiqueta' }, rotuloGrau(g) || 'sem grau')); })),
          h('p', { class: 'ajuda' }, 'Faltou alguém na lista? Cadastre na aba Irmãos.')
        ],
      h('h3', {}, 'Irmãos visitantes'),
      (s.visitantes || []).map((v, i) => h('div', { class: 'subcartao' },
        pessoaCampo(s.visitantes, i, null, { placeholder: 'Nome do visitante', comLoja: true, remover: () => { s.visitantes.splice(i, 1); salvarSessaoDepois(); render(); } }),
        h('div', { class: 'linha2' },
          texto(v, 'loja', null, { placeholder: 'Loja e número (ex.: Loja David nº 176)' }),
          texto(v, 'cargo', null, { placeholder: 'Cargo, se houver (ex.: VM da Loja David)' })),
        marcar(v, 'leste', 'Convidado a sentar-se no Leste'))),
      h('button', { type: 'button', class: 'link', onclick: () => { s.visitantes = s.visitantes || []; s.visitantes.push({ nome: '', grau: '', loja: '', cargo: '' }); render(); } }, '+ visitante'),
      h('p', { class: 'ajuda' }, 'Visitantes novos são guardados no cadastro ao gerar a ata. CIM, Potência, telefone e e-mail ficam em Cadastro › Visitantes.')
    );
  }

  /* Passo 6 */
  function passoDoenca(s) {
    s.doenca = s.doenca || []; s.boasNovas = s.boasNovas || [];
    const nada = 'Sem relatos? A ata registra que, consultados o Oeste, o Sul e os Irmãos presentes, nada houve a relatar.';
    return h('div', { class: 'formulario' },
      h('h3', {}, 'Em Doença e Aflição'),
      h('p', { class: 'ajuda' }, 'O V∴M∴ consulta o 1º Vigilante (Oeste), o 2º Vigilante (Sul) e os Irmãos. Registre de forma discreta: quem relatou e por quem. Evite detalhes de diagnóstico.'),
      s.doenca.length ? null : h('p', { class: 'vazio' }, nada),
      s.doenca.map((d, i) => cartao('Relato ' + (i + 1), h('div', {},
        pessoaCampo(d, 'quem', 'Quem relatou'),
        texto(d, 'porQuem', 'Por quem', { placeholder: 'Ex.: pelo Ir∴ Mauro de Almeida / pela esposa do Ir∴ Rodrigo' }),
        atalhos(d, 'porQuem', F.ATALHOS.doencaPorQuem, true),
        texto(d, 'detalhe', 'Situação (opcional)', { placeholder: 'Ex.: que se recupera de uma cirurgia' }),
        atalhos(d, 'detalhe', F.ATALHOS.doencaSituacao, true)),
        () => { s.doenca.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.doenca.push({ quem: { nome: '', grau: '' }, porQuem: '', detalhe: '' }); salvarSessaoDepois(); render(); } }, '+ relato em Doença e Aflição'),

      h('h3', {}, 'Boas Novas'),
      h('p', { class: 'ajuda' }, 'Logo depois de Doença e Aflição, o V∴M∴ pergunta se algum Irmão tem Boas Novas a compartilhar: nascimentos, aniversários, formaturas, recuperações, conquistas.'),
      s.boasNovas.length ? null : h('p', { class: 'vazio' }, nada),
      s.boasNovas.map((d, i) => cartao('Boa nova ' + (i + 1), h('div', {},
        pessoaCampo(d, 'quem', 'Quem compartilhou'),
        texto(d, 'texto', 'O que compartilhou (começando por “o/a…”)', { placeholder: 'Ex.: o nascimento de seu neto Pedro' }),
        atalhos(d, 'texto', F.ATALHOS.boasNovas, true)),
        () => { s.boasNovas.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.boasNovas.push({ quem: { nome: '', grau: '' }, texto: '' }); salvarSessaoDepois(); render(); } }, '+ boa nova')
    );
  }

  /* Passo 7 */
  function passoPalavra(s) {
    const pv = s.palavraVM = s.palavraVM || {};
    s.ausencias = s.ausencias || [];
    return h('div', { class: 'formulario' },
      h('h3', {}, 'Conclusão da Reunião'),
      h('p', { class: 'ajuda' }, 'O V∴M∴ pergunta ao Oeste, ao Sul e aos Irmãos se têm algum assunto para trazer perante a Loja antes do fechamento.'),
      s.palavraAberta.length ? null : h('p', { class: 'vazio' }, 'Ninguém se manifestou? A ata registra “não houve manifestações”.'),
      s.palavraAberta.map((p, i) => cartao('Manifestação ' + (i + 1), h('div', {},
        pessoaCampo(p, 'quem', 'Quem falou', { comLoja: true }),
        texto(p, 'texto', 'O que disse (resumo, começando pelo verbo)', { area: true, linhas: 2, placeholder: 'Ex.: parabenizou os Irmãos que apresentaram trabalhos' }),
        atalhos(p, 'texto', F.ATALHOS.conclusao)),
        () => { s.palavraAberta.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.palavraAberta.push({ quem: { nome: '', grau: '' }, texto: '' }); salvarSessaoDepois(); render(); } }, '+ manifestação'),
      h('h3', {}, 'Ausências justificadas (opcional)'),
      s.ausencias.map((_, i) => pessoaCampo(s.ausencias, i, null, { remover: () => { s.ausencias.splice(i, 1); salvarSessaoDepois(); render(); } })),
      h('button', { type: 'button', class: 'link', onclick: () => { s.ausencias.push({ nome: '', grau: '' }); render(); } }, '+ Irmão com ausência justificada'),

      h('h3', {}, 'Palavra de autoridade (opcional)'),
      h('p', { class: 'ajuda' }, 'Ex.: Grão-Mestre, Grandes Vigilantes, Assessor Regional. Vira um parágrafo próprio, “PALAVRA DO 1º GRANDE VIGILANTE”.'),
      s.palavraAutoridade.map((p, i) => cartao('Autoridade ' + (i + 1), h('div', {},
        pessoaCampo(p, 'quem', 'Quem'), texto(p, 'cargo', 'Cargo', { placeholder: 'Ex.: 1º Grande Vigilante da GLMERGS' }),
        texto(p, 'texto', 'O que disse', { area: true, linhas: 2, placeholder: 'Ex.: trouxe a saudação fraterna do Sereníssimo Grão-Mestre e agradeceu o convite' }),
        atalhos(p, 'texto', F.ATALHOS.autoridade)),
        () => { s.palavraAutoridade.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.palavraAutoridade.push({ quem: { nome: '', grau: '' }, cargo: '', texto: '' }); salvarSessaoDepois(); render(); } }, '+ autoridade'),

      h('h3', {}, 'Palavra do V∴M∴'),
      marcar(pv, 'agradeceuPresenca', 'Agradeceu a presença de todos', { padraoVerdadeiro: true }),
      marcar(pv, 'agradeceuVisitantes', 'Agradeceu nominalmente aos visitantes'),
      marcar(pv, 'agape', 'Convidou para o ágape'),
      texto(pv, 'proximaSessao', 'Lembrou de algo? (opcional)', { placeholder: 'Ex.: a próxima sessão, que será Sessão Magna de Iniciação' }),
      texto(pv, 'texto', 'Outra fala do V∴M∴ (opcional)', { area: true, linhas: 2, placeholder: 'Ex.: parabenizou os Oficiais pela execução do Ritual' }),
      atalhos(pv, 'texto', F.ATALHOS.vm)
    );
  }

  /* Passo 8 */
  function passoRevisar(s) {
    const avisos = F.verificar(s, S.db.sessoes);
    const ata = gerarAta(s);
    return h('div', { class: 'formulario' },
      avisos.length ? h('div', { class: 'faixa alerta' }, h('strong', {}, 'Confira antes de gerar:'), h('ul', {}, avisos.map((a) => h('li', {}, a)))) : h('div', { class: 'faixa ok' }, 'Tudo preenchido. Revise o texto abaixo.'),
      h('div', { class: 'acoes-gerar' },
        h('button', { type: 'button', class: 'principal', onclick: () => baixarWord(s) }, 'Baixar Word'),
        h('button', { type: 'button', onclick: () => imprimir(s) }, 'Imprimir / PDF'),
        S.modoGoogle() ? h('button', { type: 'button', onclick: () => salvarDrive(s) }, 'Salvar no Drive da Loja') : null),
      h('div', { class: 'acoes-linha' },
        s.status === 'finalizada'
          ? h('button', { type: 'button', class: 'pequeno', onclick: () => { s.status = 'rascunho'; salvarSessaoDepois(); render(); } }, 'Reabrir para edição')
          : h('button', { type: 'button', class: 'pequeno', onclick: () => { s.status = 'finalizada'; guardarVisitantes(s); salvarSessaoDepois(); render(); aviso('Ata marcada como finalizada.'); } }, 'Marcar como finalizada')),
      h('div', { class: 'folha' }, folhaHTML(ata))
    );
  }

  function folhaHTML(ata) {
    const frag = h('div', { class: 'folha-conteudo' },
      h('div', { class: 'timbre' },
        h('img', { src: 'img/logo-gl.png', alt: 'GLMERGS' }),
        h('div', { class: 'timbre-texto' },
          h('div', { class: 'tb' }, 'À G∴D∴G∴A∴D∴U∴'), h('div', { class: 'tb' }, 'Aug∴ e Res∴ Loj∴ Simb∴ Caritas N.º 268'),
          h('div', { class: 'tb' }, 'Fundada em 04 de maio de 2016'), h('div', {}, 'Rua Barão do Amazonas, n.º 2316 - Partenon'),
          h('div', {}, 'Porto Alegre - RS, CEP 90660-001.'), h('div', { class: 'tb' }, 'Sessões: quartas-feiras 20h - Rito de York Americano'),
          h('div', { class: 'pequena' }, 'Jurisdicionada à M∴ R∴ Grande Loja Maçônica do Estado do Rio Grande do Sul')),
        h('img', { src: 'img/logo-caritas.jpg', alt: 'Cáritas 268' })),
      ata.paragrafos.map((p) => p.vazio ? h('p', { class: 'vazio-linha' }, '\u00a0') : h('p', { class: p.titulo ? 'titulo-ata' : '' }, p.runs.map((r) => r.b || r.i ? h(r.b ? 'strong' : 'em', {}, r.i && r.b ? h('em', {}, r.t) : r.t) : r.t))),
      h('div', { class: 'assinaturas' },
        h('div', {}, h('div', { class: 'traco' }), h('div', {}, ata.assinatura.vm), h('div', {}, 'Venerável Mestre')),
        h('div', {}, h('div', { class: 'traco' }), h('div', {}, ata.assinatura.sec), h('div', {}, ata.assinatura.funcao)))
    );
    return frag;
  }

  function guardarVisitantes(s) {
    let mudou = false;
    (s.visitantes || []).filter((v) => v.nome).forEach((v) => {
      const ex = S.db.visitantes.find((x) => x.nome.toLowerCase() === v.nome.trim().toLowerCase());
      if (!ex) { S.db.visitantes.push({ id: S.novoId('v'), nome: v.nome.trim(), grau: v.grau || '', cim: '', loja: v.loja || '', potencia: '', cargo: v.cargo || '', celular: '', email: '', observacoes: '' }); mudou = true; }
    });
    if (mudou) salvarListaDepois('visitantes');
  }

  async function gerarBlob(s) {
    const ata = gerarAta(s);
    return Word.gerarDocx(ata, 'modelo-ata.docx');
  }
  async function baixarWord(s) {
    try {
      guardarVisitantes(s);
      const blob = await gerarBlob(s);
      const a = h('a', { href: URL.createObjectURL(blob), download: Word.nomeArquivo(s) });
      document.body.append(a); a.click(); a.remove();
      aviso('Arquivo Word baixado.');
    } catch (e) { aviso('Erro ao gerar o Word: ' + e.message, 'erro'); }
  }
  async function salvarDrive(s) {
    try {
      aviso('Enviando para o Drive…');
      const url = await S.salvarArquivoNoDrive(Word.nomeArquivo(s), await gerarBlob(s));
      aviso('Salvo na pasta “Atas Caritas - Geradas” do Drive.');
      s.arquivoDrive = url; salvarSessaoDepois(); render();
    } catch (e) { aviso('Não foi possível salvar no Drive: ' + e.message, 'erro'); }
  }
  function imprimir(s) {
    const div = document.getElementById('impressao');
    div.replaceChildren(folhaHTML(gerarAta(s)));
    setTimeout(() => window.print(), 150);
  }

  /* ---------------- Cadastros ---------------- */
  function vistaCadastros() {
    const aba = estado.abaCadastro;
    return h('section', {},
      h('div', { class: 'segmentado largo' }, [['irmaos', 'Quadro da Loja'], ['graus', 'Graus e datas'], ['visitantes', 'Visitantes']].map(([v, r]) => h('button', { type: 'button', class: aba === v ? 'ativo' : '', onclick: () => { estado.abaCadastro = v; render(); } }, r))),
      aba === 'irmaos' ? tabelaIrmaos() : aba === 'graus' ? tabelaGraus() : tabelaVisitantes());
  }
  const ALFA = (a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt', { sensitivity: 'base' });
  function tabelaIrmaos() {
    const lista = S.db.irmaos;
    const conferir = lista.filter((i) => i.conferir).length;
    const ordem = lista.slice().sort((a, b) => (!a.nome) - (!b.nome) || ALFA(a, b));
    return h('div', { class: 'formulario' },
      conferir ? h('div', { class: 'faixa alerta' }, conferir + ' nomes vieram das atas antigas e precisam ser conferidos (grau e grafia). ',
        h('button', { type: 'button', class: 'pequeno', onclick: () => { lista.forEach((i) => delete i.conferir); salvarListaDepois('irmaos'); render(); } }, 'Já conferi todos')) : null,
      S.modoGoogle() ? h('p', { class: 'ajuda' }, 'Dica: você também pode editar esta lista direto na aba “Irmaos” da planilha da Loja.') : null,
      h('div', { class: 'tabela' }, h('div', { class: 'linha-tabela cabecalho' }, h('span', {}, 'CIM'), h('span', {}, 'Nome'), h('span', {}, 'Grau'), h('span', {}, '')),
        ordem.map((i) => h('div', { class: 'linha-tabela' + (i.ativo === false ? ' inativo' : '') },
        h('input', { class: 'cim', value: i.matricula || '', placeholder: 'CIM', 'aria-label': 'CIM (identidade maçônica)', inputmode: 'numeric', oninput: (e) => { i.matricula = e.target.value.trim(); salvarListaDepois('irmaos'); } }),
        h('input', { value: i.nome, 'aria-label': 'Nome', oninput: (e) => { i.nome = e.target.value; delete i.conferir; salvarListaDepois('irmaos'); } }),
        h('select', { 'aria-label': 'Grau', onchange: (e) => { i.grau = e.target.value; delete i.conferir; salvarListaDepois('irmaos'); } }, GRAU_OPC.map(([v, r]) => h('option', { value: v, selected: i.grau === v }, r))),
        h('label', { class: 'marcar mini' }, h('input', { type: 'checkbox', checked: i.ativo !== false, onchange: (e) => { i.ativo = e.target.checked; salvarListaDepois('irmaos'); render(); } }), h('span', {}, 'Ativo')),
        h('button', { type: 'button', class: 'pequeno', 'aria-expanded': String(estado.fichaIrmao === i.id), onclick: () => { estado.fichaIrmao = estado.fichaIrmao === i.id ? null : i.id; render(); } }, estado.fichaIrmao === i.id ? 'Fechar' : 'Ficha'),
        i.conferir ? h('span', { class: 'etiqueta' }, 'conferir') : null,
        estado.fichaIrmao === i.id ? fichaIrmao(i) : null))),
      h('button', { type: 'button', class: 'secundario', onclick: () => { lista.push({ id: S.novoId('i'), nome: '', grau: 'AM', ativo: true, matricula: '' }); render(); } }, '+ Irmão'),
      h('p', { class: 'ajuda' }, 'CIM é a identidade maçônica (matrícula) dada pela GLMERGS. Irmão que saiu do quadro: desmarque “Ativo”. Ele continua nas atas antigas, mas some da lista de presença.')
    );
  }
  /* Ficha com os dados pessoais do Irmão (vindos da GLMERGS ou digitados). Nada disto sai na ata. */
  const CAMPOS_FICHA = [
    ['nascimento', 'Data de nascimento', { type: 'date' }], ['cpf', 'CPF', { inputmode: 'numeric' }],
    ['celular', 'Celular / WhatsApp', { type: 'tel' }], ['telefone', 'Outros telefones', { type: 'tel' }],
    ['email', 'E-mail', { type: 'email' }], ['profissao', 'Profissão', {}], ['empresa', 'Empresa', {}]
  ];
  function fichaIrmao(i) {
    const alterar = (c, v) => { i[c] = v; salvarListaDepois('irmaos'); };
    return h('div', { class: 'ficha-irmao' },
      h('div', { class: 'visit-campos' }, CAMPOS_FICHA.map(([c, rot, op]) => h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, rot),
        h('input', Object.assign({ value: i[c] || '', oninput: (e) => { if (op.type === 'date' && !dataCompleta(e.target.value)) return; alterar(c, e.target.value); } }, op))))),
      h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Endereço'), h('input', { value: i.endereco || '', oninput: (e) => alterar('endereco', e.target.value) })),
      h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Família (cônjuge e filhos, com datas de nascimento)'), h('textarea', { rows: 2, value: i.familia || '', oninput: (e) => alterar('familia', e.target.value) })),
      h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Anotações'), h('textarea', { rows: 2, value: i.anotacoes || '', oninput: (e) => alterar('anotacoes', e.target.value) })),
      h('p', { class: 'ajuda' }, 'As datas de Iniciação, Passagem, Elevação e Instalação ficam na aba “Graus e datas”. Nada desta ficha aparece na ata.'));
  }
  /* Campo de data: só vale quando o ano tem 4 algarismos (evita gravar 0002 enquanto se digita 2022) */
  function dataCompleta(v) { return !v || /^(19|20)\d\d-\d\d-\d\d$/.test(v); }
  /* Registro das datas de Iniciação, Passagem, Elevação e Instalação de cada Irmão */
  function tabelaGraus() {
    const busca = (estado.buscaGraus || '').trim().toLowerCase();
    const lista = S.db.irmaos.filter((i) => i.ativo !== false && (!busca || i.nome.toLowerCase().includes(busca)))
      .sort(ALFA);
    return h('div', { class: 'formulario' },
      h('p', { class: 'ajuda' }, 'Registre as datas conforme forem acontecendo. A ata usa o grau que cada Irmão tinha na data da sessão. Sem datas, vale o grau do Quadro da Loja.'),
      S.modoGoogle() ? h('p', { class: 'ajuda' }, 'As datas também ficam nas colunas da aba “Irmaos” da planilha.') : null,
      h('input', { type: 'search', placeholder: 'Procurar Irmão', value: estado.buscaGraus || '', oninput: (e) => { estado.buscaGraus = e.target.value; const pos = e.target.selectionStart; render(); const el = app().querySelector('input[type=search]'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } }),
      h('div', { class: 'pilha' }, lista.map((i) => h('div', { class: 'subcartao graus' },
        h('div', { class: 'graus-topo' }, h('strong', {}, i.nome), h('span', { class: 'etiqueta' }, rotuloGrau(i.grau) || 'sem grau')),
        h('div', { class: 'graus-datas' }, DATAS_GRAU.map(([campo, rotulo]) => h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, rotulo),
          h('input', { type: 'date', value: i[campo] || '', min: '1900-01-01', max: '2099-12-31', oninput: (e) => {
            if (!dataCompleta(e.target.value)) return;
            i[campo] = e.target.value;
            const g = grauAtualPelasDatas(i);
            if (g && g !== i.grau) { i.grau = g; aviso(i.nome + ' agora consta como ' + rotuloGrau(g) + '.'); const et = e.target.closest('.graus').querySelector('.etiqueta'); if (et) et.textContent = rotuloGrau(g); }
            salvarListaDepois('irmaos');
          } }))))))),
      lista.length ? null : h('p', { class: 'vazio' }, 'Nenhum Irmão encontrado.'));
  }
  /* Cadastro completo dos visitantes. Na ata saem só nome, grau, cargo e Loja; o resto fica guardado. */
  const CAMPOS_VISITANTE = [
    ['cim', 'CIM (opcional)', { placeholder: 'Se o Irmão souber', inputmode: 'numeric' }],
    ['loja', 'Loja e nº', { placeholder: 'Ex.: Loja Acácia nº 12' }],
    ['potencia', 'Potência', { placeholder: 'Ex.: GLMERGS, GORGS, GOB-RS' }],
    ['cargo', 'Cargo (se for autoridade)', { placeholder: 'Ex.: 1º Grande Vigilante da GLMERGS' }],
    ['celular', 'Celular / WhatsApp', { placeholder: '(51) 99999-9999', type: 'tel' }],
    ['email', 'E-mail', { placeholder: 'nome@exemplo.com', type: 'email' }]
  ];
  function tabelaVisitantes() {
    const lista = S.db.visitantes;
    const busca = (estado.buscaVisit || '').trim().toLowerCase();
    const vistos = lista.filter((v) => !busca || [v.nome, v.loja, v.potencia, v.cim].join(' ').toLowerCase().includes(busca))
      .sort((a, b) => (!a.nome) - (!b.nome) || ALFA(a, b));
    const alterar = (v, c, val) => { v[c] = val; salvarListaDepois('visitantes'); };
    return h('div', { class: 'formulario' },
      h('p', { class: 'ajuda' }, 'Cadastre aqui os visitantes do Livro de Presenças. Na ata saem só o nome, o grau, o cargo e a Loja; CIM, Potência, telefone, e-mail e observações ficam guardados no sistema. Ao digitar o nome na presença da ata, os dados vêm sozinhos.'),
      S.modoGoogle() ? h('p', { class: 'ajuda' }, 'Tudo fica também na aba “Visitantes” da planilha.') : null,
      h('div', { class: 'linha-botoes' },
        h('input', { type: 'search', placeholder: 'Procurar por nome, Loja, Potência ou CIM', value: estado.buscaVisit || '', oninput: (e) => { estado.buscaVisit = e.target.value; const pos = e.target.selectionStart; render(); const el = app().querySelector('input[type=search]'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } }),
        h('button', { type: 'button', class: 'secundario', onclick: () => { estado.buscaVisit = ''; lista.push({ id: S.novoId('v'), nome: '', grau: 'MM', cim: '', loja: '', potencia: '', cargo: '', celular: '', email: '', observacoes: '' }); render(); const el = app().querySelector('.cartao-visitante input'); if (el) el.focus(); } }, '+ Visitante')),
      h('p', { class: 'ajuda' }, lista.length + (lista.length === 1 ? ' visitante cadastrado' : ' visitantes cadastrados')),
      h('div', { class: 'pilha' }, vistos.map((v) => h('div', { class: 'subcartao cartao-visitante' },
        h('div', { class: 'visit-topo' },
          h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Nome completo'), h('input', { value: v.nome || '', placeholder: 'Nome completo', oninput: (e) => alterar(v, 'nome', e.target.value) })),
          h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Grau'), h('select', { onchange: (e) => alterar(v, 'grau', e.target.value) }, GRAU_OPC.map(([g, r]) => h('option', { value: g, selected: v.grau === g }, r))))),
        h('div', { class: 'visit-campos' }, CAMPOS_VISITANTE.map(([c, rot, op]) => h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, rot),
          h('input', Object.assign({ value: v[c] || '', oninput: (e) => alterar(v, c, e.target.value) }, op))))),
        h('label', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Outras informações'), h('textarea', { rows: 2, value: v.observacoes || '', placeholder: 'Ex.: Loja visitada junto com o Ir∴ Fulano; aniversário; profissão', oninput: (e) => alterar(v, 'observacoes', e.target.value) })),
        h('div', { class: 'linha-botoes' }, h('button', { type: 'button', class: 'link perigo-texto', onclick: () => { if (confirm('Excluir ' + (v.nome || 'este visitante') + ' do cadastro? As atas já feitas não mudam.')) { lista.splice(lista.indexOf(v), 1); salvarListaDepois('visitantes'); render(); } } }, 'Excluir do cadastro'))))),
      vistos.length ? null : h('p', { class: 'vazio' }, busca ? 'Nenhum visitante encontrado.' : 'Nenhum visitante cadastrado ainda.'));
  }


  /* ---------------- Ajustes ---------------- */
  function vistaAjustes() {
    const c = S.db.config;
    const conn = { url: S.conexao.url, pin: S.conexao.pin };
    const sc = { salvar: salvarConfigDepois };
    return h('section', { class: 'formulario' },
      h('h2', {}, 'Planilha da Loja (onde as atas ficam guardadas)'),
      h('p', { class: 'ajuda' }, 'Cole aqui o endereço do “App da Web” criado na planilha da Loja e o PIN combinado. Cada secretário faz isso uma vez no seu celular ou computador.'),
      texto(conn, 'url', 'Endereço da planilha (URL do App da Web)', { salvar: () => {}, placeholder: 'https://script.google.com/macros/s/…/exec' }),
      texto(conn, 'pin', 'PIN da Loja', { salvar: () => {}, tipo: 'password' }),
      h('div', { class: 'acoes-linha' },
        h('button', { type: 'button', class: 'principal', onclick: async () => {
          S.salvarConexao(conn.url, conn.pin); aviso('Conectando…');
          await S.carregar(); render();
          aviso(S.status === 'google' ? 'Conectado à planilha da Loja.' : 'Não conectou: ' + S.ultimoErro, S.status === 'google' ? '' : 'erro');
        } }, 'Conectar'),
        S.modoGoogle() ? h('button', { type: 'button', onclick: async () => { S.salvarConexao('', ''); await S.carregar(); render(); aviso('Desconectado. Usando só este aparelho.'); } }, 'Desconectar') : null),

      h('h2', {}, 'Backup'),
      h('p', { class: 'ajuda' }, 'Baixe uma cópia de tudo (atas, quadro, ajustes) em um arquivo. Guarde no Drive da Loja de tempos em tempos.'),
      h('div', { class: 'acoes-linha' },
        h('button', { type: 'button', onclick: () => {
          const blob = new Blob([S.exportarBackup()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'backup-atas-caritas-' + hoje() + '.json' }); document.body.append(a); a.click(); a.remove();
        } }, 'Baixar backup'),
        h('label', { class: 'botao-arquivo' }, 'Restaurar backup…', h('input', { type: 'file', accept: '.json,application/json', onchange: async (e) => {
          const f = e.target.files[0]; if (!f) return;
          try { await S.importarBackup(await f.text()); render(); aviso('Backup restaurado.'); } catch (err) { aviso('Não foi possível restaurar: ' + err.message, 'erro'); }
        } }))),

      h('h2', {}, 'Administração atual'),
      h('h3', {}, 'Nominata de cargos'),
      h('div', { class: 'tabela' }, (c.cargos = c.cargos || []).map((x, i) => h('div', { class: 'pessoa' },
        h('input', { value: x.cargo, 'aria-label': 'Cargo', style: 'flex:0 0 42%', oninput: (e) => { x.cargo = e.target.value; salvarConfigDepois(); } }),
        h('input', { value: x.nome, list: 'dl-pessoas', 'aria-label': 'Irmão', oninput: (e) => { x.nome = e.target.value; salvarConfigDepois(); } }),
        h('button', { type: 'button', class: 'icone', title: 'Remover', onclick: () => { c.cargos.splice(i, 1); salvarConfigDepois(); render(); } }, '✕')))),
      h('button', { type: 'button', class: 'link', onclick: () => { c.cargos.push({ cargo: '', nome: '' }); render(); } }, '+ cargo'),
      h('h2', {}, 'Próxima administração (já eleita)'),
      c.proxima ? [
        h('p', { class: 'ajuda' }, 'Passa a valer sozinha no dia seguinte à posse. Até lá, as atas usam a administração atual.'),
        h('div', { class: 'linha2' },
          texto(c.proxima, 'administracao', 'Administração', sc),
          texto(c.proxima, 'posse', 'Data da posse', Object.assign({ tipo: 'date', ajuda: 'Preencha quando a sessão de posse for marcada.' }, sc))),
        h('div', { class: 'tabela' }, (c.proxima.cargos = c.proxima.cargos || []).map((x, i) => h('div', { class: 'pessoa' },
          h('input', { value: x.cargo, 'aria-label': 'Cargo', style: 'flex:0 0 42%', oninput: (e) => { x.cargo = e.target.value; salvarConfigDepois(); } }),
          h('input', { value: x.nome, list: 'dl-pessoas', 'aria-label': 'Irmão', oninput: (e) => { x.nome = e.target.value; salvarConfigDepois(); } }),
          h('button', { type: 'button', class: 'icone', title: 'Remover', onclick: () => { c.proxima.cargos.splice(i, 1); salvarConfigDepois(); render(); } }, '✕')))),
        h('div', { class: 'acoes-linha' },
          h('button', { type: 'button', class: 'link', onclick: () => { c.proxima.cargos.push({ cargo: '', nome: '' }); render(); } }, '+ cargo'),
          estado.ativando
            ? [h('span', {}, 'Trocar agora para ' + c.proxima.administracao + '?'), h('button', { type: 'button', class: 'principal pequeno', onclick: () => { estado.ativando = false; ativarProxima(); render(); aviso('Nova administração ativada.'); } }, 'Sim, trocar'), h('button', { type: 'button', class: 'pequeno', onclick: () => { estado.ativando = false; render(); } }, 'Cancelar')]
            : h('button', { type: 'button', class: 'pequeno', onclick: () => { estado.ativando = true; render(); } }, 'Ativar agora'))
      ] : h('button', { type: 'button', class: 'secundario', onclick: () => { c.proxima = { administracao: '', posse: '', cargos: (c.cargos || []).map((x) => ({ cargo: x.cargo, nome: '' })) }; salvarConfigDepois(); render(); } }, '+ Cadastrar próxima administração'),
      h('h3', {}, 'Titulares usados na ata'),
      texto(c, 'administracao', 'Administração', Object.assign({ placeholder: '2025/2026', ajuda: 'A numeração das atas recomeça a cada administração.' }, sc)),
      texto(c, 'vm', 'Venerável Mestre titular', sc),
      texto(c, 'v1', '1º Vigilante titular', sc),
      texto(c, 'v2', '2º Vigilante titular', sc),
      texto(c, 'secretario', 'Secretário titular', sc),
      texto(c, 'secretarioPadrao', 'Quem costuma lavrar as atas agora', Object.assign({ ajuda: 'Se for diferente do titular, a ata sai como “Secretário Ad Hoc”.' }, sc)),

      h('h2', {}, 'Texto fixo da ata'),
      texto(c, 'lojaNome', 'Nome da Loja', sc),
      texto(c, 'potencia', 'Potência', sc),
      texto(c, 'local', 'Local das sessões (como entra na abertura)', Object.assign({ area: true, linhas: 4 }, sc)),
      texto(c, 'registroPresenca', 'Onde a presença é registrada (entra como “conforme registro …”)', Object.assign({ placeholder: 'no Livro de Presenças da Loja' }, sc)),
      marcar(c, 'registrarAtaAnterior', 'Registrar a Ata da última reunião', { salvar: salvarConfigDepois, padraoVerdadeiro: true }),
      marcar(c, 'registrarExpediente', 'Registrar a correspondência, atos e decretos', { salvar: salvarConfigDepois, padraoVerdadeiro: true }),
      texto(c, 'tituloOrdinaria', 'Nome da sessão ordinária no título da ata', Object.assign({ placeholder: 'Econômica', ajuda: 'O título fica “Ata nº 06 / 2026 – Sessão Econômica A∴M∴”.' }, sc)),
      marcar(c, 'aberturaRitual', 'Registrar as formalidades de abertura (Loja coberta e Palavra recebida pelos Diáconos)', { salvar: salvarConfigDepois, padraoVerdadeiro: true }),
      marcar(c, 'fechamentoRitual', 'Registrar o fechamento completo (“assim permanecendo até a próxima sessão ordinária…”)', { salvar: salvarConfigDepois, padraoVerdadeiro: true }),
      marcar(c, 'abrevPontos', 'Usar os três pontos nas abreviações (V∴M∴, Ir∴). Desmarque para o estilo do Ritual do York: VM, Ir., MM', { salvar: salvarConfigDepois, padraoVerdadeiro: true }),
      h('p', { class: 'ajuda versao' }, 'Sistema de Atas Cáritas 268 · versão 2.6 (Rito de York)')
    );
  }

  function irPara(v) { estado.vista = v; render(); window.scrollTo(0, 0); }

  /* ---------------- início ---------------- */
  document.querySelectorAll('#abas button').forEach((b) => b.addEventListener('click', () => irPara(b.dataset.vista)));
  document.getElementById('status').addEventListener('click', async () => {
    if (!S.modoGoogle()) { irPara('ajustes'); return; }
    try { await S.sincronizar(); await S.carregar(); render(); aviso('Sincronizado com a planilha.'); } catch (e) { aviso(e.message, 'erro'); marcarStatus(); }
  });
  window.addEventListener('beforeunload', () => { const s = sessaoAtual(); if (timerSessao && s) { S.salvarSessao(s); } });
  S.carregar().then(() => { migrarConfig(); verificarPosse(); render(); });
})();
