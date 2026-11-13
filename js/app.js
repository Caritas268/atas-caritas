/* Telas do Sistema de Atas – Cáritas 268 */
(function () {
  const F = window.Frases, E = window.Extenso, S = window.Store;
  const GRAU_OPC = [['', '—'], ['AM', 'A∴M∴'], ['CM', 'C∴M∴'], ['MM', 'M∴M∴'], ['MI', 'M∴I∴']];
  const PASSOS = ['Sessão', 'Agenda do dia', 'Ata anterior', 'Ocorrências', 'Presença', 'Doença e Aflição', 'Palavra', 'Revisar e gerar'];

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
      oninput: (e) => { obj[chave] = op.tipo === 'number' ? Number(e.target.value) : e.target.value; (op.salvar || salvarSessaoDepois)(); if (op.aoMudar) op.aoMudar(); }
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
  function garantirDatalist() {
    let dl = document.getElementById('dl-pessoas');
    if (!dl) { dl = h('datalist', { id: 'dl-pessoas' }); document.body.append(dl); }
    dl.replaceChildren(...todasPessoas().map((p) => h('option', { value: p.nome }, rotuloGrau(p.grau) + (p.loja ? ' · ' + p.loja : ''))));
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
        if (achado) { p.grau = achado.grau; sel.value = achado.grau || ''; if (achado.loja && op.comLoja) p.loja = achado.loja; }
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
        comResultado ? selecao(c, 'resultado', null, [['aprovado', 'Aprovado'], ['novo', 'Novo escrutínio'], ['rejeitado', 'Não aprovado']]) : null,
        arr.length > 1 ? h('button', { type: 'button', class: 'icone', onclick: () => { arr.splice(i, 1); salvarSessaoDepois(); render(); } }, '✕') : null)),
      h('button', { type: 'button', class: 'link', onclick: () => { arr.push({ nome: '', resultado: 'aprovado' }); render(); } }, '+ outro candidato')));
  }
  function atalhos(obj, chave, frases) {
    return h('div', { class: 'atalhos' }, frases.map((f) => h('button', {
      type: 'button', class: 'chip', onclick: () => {
        const atual = (obj[chave] || '').trim().replace(/[.;]$/, '');
        obj[chave] = atual ? atual + ', ' + f : f; salvarSessaoDepois(); render();
      }
    }, f)));
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
    const daAdm = S.db.sessoes.filter((x) => x.administracao === c.administracao);
    const ultima = ordenadas()[0];
    const numero = daAdm.reduce((m, x) => Math.max(m, Number(x.numero) || 0), 0) + 1;
    const anterior = daAdm.sort((a, b) => (b.numero || 0) - (a.numero || 0))[0];
    const secNome = (ultima && ultima.secretario && ultima.secretario.nome) || c.secretarioPadrao || c.secretario;
    const s = {
      id: S.novoId('s'), numero, administracao: c.administracao, data: hoje(), grau: 1,
      horaAbertura: '', horaEncerramento: '',
      vm: pessoaDoCadastro(c.vm), v1: pessoaDoCadastro(c.v1), v2: pessoaDoCadastro(c.v2),
      secretario: pessoaDoCadastro(secNome), adhoc: (secNome || '').toLowerCase() !== (c.secretario || '').toLowerCase(),
      agenda: [], ataAnterior: { status: anterior ? 'aprovada' : 'nao_registrar', numero: anterior ? anterior.numero : '' }, expediente: [],
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
      h('h2', {}, (estado.passo + 1) + '. ' + PASSOS[estado.passo]),
      passos[estado.passo](s),
      h('div', { class: 'navegacao' },
        estado.passo > 0 ? h('button', { type: 'button', onclick: () => irPasso(estado.passo - 1) }, '← Voltar') : h('span'),
        estado.passo < PASSOS.length - 1 ? h('button', { type: 'button', class: 'principal', onclick: () => irPasso(estado.passo + 1) }, 'Próximo →') : h('span'))
    );
  }
  function irPasso(i) { estado.passo = i; render(); window.scrollTo(0, 0); }

  /* Passo 1 */
  function passoSessao(s) {
    return h('div', { class: 'formulario' },
      h('div', { class: 'linha2' },
        texto(s, 'numero', 'Número da ata', { tipo: 'number', ajuda: 'Sugerido automaticamente.' }),
        texto(s, 'administracao', 'Administração', { placeholder: '2025/2026' })),
      texto(s, 'data', 'Data da sessão', { tipo: 'date' }),
      campo('Grau em que a Loja foi aberta', botoes([[1, '1º Aprendiz'], [2, '2º Companheiro'], [3, '3º Mestre']], s.grau, (v) => { s.grau = Number(v); salvarSessaoDepois(); render(); })),
      h('div', { class: 'linha2' },
        texto(s, 'horaAbertura', 'Hora de abertura', { tipo: 'time' }),
        texto(s, 'horaEncerramento', 'Hora de encerramento', { tipo: 'time', ajuda: 'Pode preencher no fim da sessão.' })),
      h('h3', {}, 'Quem ocupou os malhetes'),
      pessoaCampo(s, 'vm', 'Venerável Mestre (presidiu)', { ajuda: 'Se não for o VM titular, a ata registra “Venerável Mestre em exercício”.' }),
      pessoaCampo(s, 'v1', '1º Vigilante (segundo malhete)'),
      pessoaCampo(s, 'v2', '2º Vigilante (terceiro malhete)'),
      h('h3', {}, 'Quem lavra a ata'),
      pessoaCampo(s, 'secretario', 'Secretário'),
      marcar(s, 'adhoc', 'Secretário Ad Hoc (substituindo o titular)')
    );
  }

  /* Passo 2 */
  function novoItem(tipo) {
    const base = { id: S.novoId('a'), tipo };
    const extras = {
      instrucao: { grauInstrucao: 'AM', numero: 1, parte: '', irmaos: [] },
      trabalho: { irmao: { nome: '', grau: '' }, ordinalTrabalho: '', grauTrabalho: 'AM', titulo: '' },
      palestra: { irmao: { nome: '', grau: '' }, titulo: '' },
      leitura_proposta: { processo: 'Iniciação', leitura: 1, candidatos: [], objecao: 'sem' },
      escrutinio: { processo: 'Iniciação', candidatos: [] },
      cerimonia: { cerimonia: 'Iniciação', parte: '', pessoas: [] },
      entrega_identidade: { entregas: [{ entrega: { nome: '', grau: '' }, recebe: { nome: '', grau: '' }, grau: 'AM' }] },
      prestacao_contas: { irmao: pessoaDoCadastro(nomeDoCargo('Tesoureiro')), periodo: '', resultado: 'aprovada', ressalva: '' },
      leitura_documento: { documento: 'Decreto', numeroDoc: '', origem: '', resumo: '' },
      reuniao_administrativa: { assuntos: [''] },
      votacao: { assunto: '', resultadoVotacao: '' },
      eleicao: (() => { const p = S.db.config.proxima || {}; return { administracao: p.administracao || '', forma: 'unanimidade', posse: p.posse || '', cargos: (p.cargos || []).map((x) => ({ cargo: x.cargo, pessoa: pessoaDoCadastro(x.nome) })) }; })(),
      instalacao: (() => { const p = S.db.config.proxima || {}; const vm = ((p.cargos || []).find((x) => x.cargo === 'Venerável Mestre') || {}).nome; return { administracao: p.administracao || '', vm: pessoaDoCadastro(vm || ''), instalador: { nome: '', grau: '' } }; })(),
      outro: { texto: '', observacao: '' }
    };
    return Object.assign(base, JSON.parse(JSON.stringify(extras[tipo] || {})));
  }
  function camposItem(it) {
    switch (it.tipo) {
      case 'instrucao': return [
        campo('Instrução de', botoes([['AM', 'A∴M∴'], ['CM', 'C∴M∴'], ['MM', 'M∴M∴']], it.grauInstrucao, (v) => { it.grauInstrucao = v; salvarSessaoDepois(); render(); })),
        h('div', { class: 'linha2' },
          selecao(it, 'numero', 'Qual instrução', [[1, '1ª'], [2, '2ª'], [3, '3ª']], { numero: true, redesenhar: true }),
          selecao(it, 'parte', 'Parte', [['', 'Inteira'], ['1ª Parte', '1ª Parte'], ['2ª Parte', '2ª Parte']], { redesenhar: true })),
        listaPessoas(it.irmaos, 'Para o(s) Irmão(s)')];
      case 'trabalho': return [
        pessoaCampo(it, 'irmao', 'Quem apresentou'),
        h('div', { class: 'linha2' },
          selecao(it, 'ordinalTrabalho', 'É trabalho obrigatório de grau?', [['', 'Não'], [1, '1º trabalho'], [2, '2º trabalho'], [3, '3º trabalho']], { redesenhar: true }),
          it.ordinalTrabalho ? selecao(it, 'grauTrabalho', 'Do grau', [['AM', 'A∴M∴'], ['CM', 'C∴M∴']], { redesenhar: true }) : h('span')),
        texto(it, 'titulo', 'Título (opcional)'),
        texto(it, 'observacao', 'Observação para a ata (opcional)', { placeholder: 'Ex.: O Irmão apresentou trabalho sobre sua Iniciação.' })];
      case 'palestra': return [pessoaCampo(it, 'irmao', 'Quem apresentou'), texto(it, 'titulo', 'Tema'), texto(it, 'observacao', 'Observação (opcional)')];
      case 'leitura_proposta': return [
        h('div', { class: 'linha2' },
          selecao(it, 'processo', 'Processo', [['Iniciação', 'Iniciação'], ['Filiação', 'Filiação'], ['Regularização', 'Regularização']], { redesenhar: true }),
          selecao(it, 'leitura', 'Leitura', [[1, '1ª leitura'], [2, '2ª leitura'], [3, '3ª leitura']], { numero: true, redesenhar: true })),
        listaCandidatos(it.candidatos, 'Candidatos'),
        selecao(it, 'objecao', 'Houve objeção?', [['sem', 'Não houve objeção'], ['com', 'Houve objeção']])];
      case 'escrutinio': return [
        selecao(it, 'processo', 'Processo', [['Iniciação', 'Iniciação'], ['Filiação', 'Filiação'], ['Regularização', 'Regularização']], { redesenhar: true }),
        listaCandidatos(it.candidatos, 'Candidatos e resultado', true)];
      case 'cerimonia': return [
        campo('Cerimônia', botoes(Object.keys(F.CERIMONIAS).map((k) => [k, k]), it.cerimonia, (v) => { it.cerimonia = v; salvarSessaoDepois(); render(); })),
        selecao(it, 'parte', 'Parte', [['', 'Cerimônia completa'], ['1ª Parte', '1ª Parte'], ['2ª Parte', '2ª Parte']], { redesenhar: true }),
        it.cerimonia === 'Iniciação' ? listaCandidatos(it.pessoas, 'Candidatos iniciados') : listaPessoas(it.pessoas, 'Irmão(s)')];
      case 'entrega_identidade': return [
        h('div', { class: 'pilha' }, it.entregas.map((e, i) => h('div', { class: 'subcartao' },
          pessoaCampo(e, 'recebe', 'Recebeu'),
          selecao(e, 'grau', 'Identidade do grau', [['AM', 'A∴M∴'], ['CM', 'C∴M∴'], ['MM', 'M∴M∴']]),
          pessoaCampo(e, 'entrega', 'Quem entregou (opcional)'),
          it.entregas.length > 1 ? h('button', { type: 'button', class: 'link perigo-texto', onclick: () => { it.entregas.splice(i, 1); salvarSessaoDepois(); render(); } }, 'Remover esta entrega') : null))),
        h('button', { type: 'button', class: 'link', onclick: () => { it.entregas.push({ entrega: { nome: '', grau: '' }, recebe: { nome: '', grau: '' }, grau: 'AM' }); render(); } }, '+ outra entrega')];
      case 'prestacao_contas': return [
        pessoaCampo(it, 'irmao', 'Quem apresentou'), texto(it, 'periodo', 'Período (opcional)', { placeholder: 'Ex.: ao primeiro semestre de 2026' }),
        selecao(it, 'resultado', 'Resultado', [['aprovada', 'Aprovada sem ressalvas'], ['ressalva', 'Com ressalvas']], { redesenhar: true }),
        it.resultado === 'ressalva' ? texto(it, 'ressalva', 'Quais ressalvas') : null];
      case 'leitura_documento': return [
        selecao(it, 'documento', 'Documento', ['Decreto', 'Ato', 'Prancha', 'Circular', 'Boletim'].map((x) => [x, x]), { redesenhar: true }),
        h('div', { class: 'linha2' }, texto(it, 'numeroDoc', 'Número', { placeholder: 'Ex.: 115' }), texto(it, 'origem', 'De quem / gestão', { placeholder: 'Ex.: gestão 2024/2027, do Sereníssimo Grão-Mestre' })),
        texto(it, 'resumo', 'Resumo (opcional)', { area: true, linhas: 2 })];
      case 'reuniao_administrativa': return [
        campo('Assuntos tratados', h('div', { class: 'pilha' }, it.assuntos.map((a, i) => h('div', { class: 'pessoa' },
          h('input', { value: a, placeholder: 'Assunto ' + (i + 1), oninput: (e) => { it.assuntos[i] = e.target.value; salvarSessaoDepois(); } }),
          it.assuntos.length > 1 ? h('button', { type: 'button', class: 'icone', onclick: () => { it.assuntos.splice(i, 1); salvarSessaoDepois(); render(); } }, '✕') : null)),
          h('button', { type: 'button', class: 'link', onclick: () => { it.assuntos.push(''); render(); } }, '+ outro assunto')))];
      case 'eleicao': return [
        h('div', { class: 'linha2' }, texto(it, 'administracao', 'Administração eleita', { placeholder: '2026/2027' }), texto(it, 'posse', 'Data da posse (se já marcada)', { tipo: 'date' })),
        selecao(it, 'forma', 'Como foi eleita', [['unanimidade', 'Por unanimidade'], ['aclamacao', 'Por aclamação'], ['maioria', 'Pela maioria dos votos']]),
        campo('Nominata eleita', h('div', { class: 'pilha' }, it.cargos.map((c, i) => h('div', { class: 'subcartao' },
          h('input', { value: c.cargo, placeholder: 'Cargo', oninput: (e) => { c.cargo = e.target.value; salvarSessaoDepois(); } }),
          pessoaCampo(c, 'pessoa', null, { remover: () => { it.cargos.splice(i, 1); salvarSessaoDepois(); render(); } }))),
          h('button', { type: 'button', class: 'link', onclick: () => { it.cargos.push({ cargo: '', pessoa: { nome: '', grau: '' } }); render(); } }, '+ cargo')),
          S.db.config.proxima ? null : 'Dica: cadastre a nominata em Ajustes > Próxima administração para ela vir preenchida.')];
      case 'instalacao': return [
        texto(it, 'administracao', 'Administração empossada', { placeholder: '2026/2027' }),
        pessoaCampo(it, 'vm', 'Venerável Mestre instalado'),
        pessoaCampo(it, 'instalador', 'Mestre Instalador (opcional)')];
      case 'votacao': return [texto(it, 'assunto', 'O que foi votado', { placeholder: 'Ex.: a proposta de alteração do valor da mensalidade' }), texto(it, 'resultadoVotacao', 'Resultado', { placeholder: 'Ex.: foi aprovada por unanimidade' })];
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
      s.agenda.map((it, i) => cartao((i + 1) + ') ' + nomeTipo(it.tipo), h('div', {}, camposItem(it), h('p', { class: 'previa', 'data-item': it.id }, F.agendaTexto(it))),
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
    return h('div', { class: 'formulario' },
      c.registrarAtaAnterior ? [
        selecao(s.ataAnterior, 'status', 'Ata da sessão anterior', [['aprovada', 'Lida e aprovada sem ressalvas'], ['aprovada_correcao', 'Lida e aprovada com correção'], ['dispensada', 'Leitura dispensada e aprovada'], ['nao_lida', 'Não foi lida nesta sessão'], ['nao_registrar', 'Não registrar na ata']], { redesenhar: true }),
        s.ataAnterior.status !== 'nao_registrar' ? texto(s.ataAnterior, 'numero', 'Número da ata anterior', { tipo: 'number' }) : null,
        s.ataAnterior.status === 'aprovada_correcao' ? texto(s.ataAnterior, 'correcao', 'Qual a correção', { area: true, linhas: 2 }) : null
      ] : h('p', { class: 'vazio' }, 'O registro da ata anterior está desligado em Ajustes.'),
      c.registrarExpediente ? [
        h('h3', {}, 'Expediente decifrado'),
        h('p', { class: 'ajuda' }, 'Ordem do Manual do Secretário: decretos e atos do Grão-Mestre, circulares da GL, boletins, correspondência maçônica, correspondência profana. Se não houve, deixe vazio.'),
        (s.expediente || []).map((e, i) => h('div', { class: 'pessoa' },
          selecao(e, 'tipo', null, ['Decreto', 'Ato', 'Circular', 'Boletim', 'Prancha', 'Convite', 'E-mail', 'Correspondência'].map((x) => [x, x])),
          h('input', { value: e.descricao || '', placeholder: 'Ex.: nº 002/2026 da Loja Jorge Simões nº 310, convidando para sessão pública', oninput: (ev) => { e.descricao = ev.target.value; salvarSessaoDepois(); } }),
          h('button', { type: 'button', class: 'icone', onclick: () => { s.expediente.splice(i, 1); salvarSessaoDepois(); render(); } }, '✕'))),
        h('button', { type: 'button', class: 'link', onclick: () => { s.expediente = s.expediente || []; s.expediente.push({ tipo: 'Prancha', descricao: '' }); render(); } }, '+ documento do expediente')
      ] : null
    );
  }

  /* Passo 4 */
  function passoOcorrencias(s) {
    const tipos = [['descanso', 'Loja em descanso'], ['ingresso', 'Ingresso após a abertura'], ['saida', 'Saída antecipada'], ['retirada_aprendizes', 'Retirada dos Aprendizes para instrução'], ['outro', 'Outra ocorrência']];
    const nome = (t) => (tipos.find((x) => x[0] === t) || [, t])[1];
    return h('div', { class: 'formulario' },
      s.ocorrencias.length ? null : h('p', { class: 'vazio' }, 'Nada fora do comum? Pode seguir. A ata dirá que os trabalhos transcorreram com regularidade e ordem.'),
      s.ocorrencias.map((o, i) => cartao(nome(o.tipo), h('div', {},
        o.tipo === 'retirada_aprendizes' ? null : texto(o, 'hora', o.tipo === 'descanso' ? 'Início do descanso' : 'Horário', { tipo: 'time' }),
        o.tipo === 'descanso' ? [texto(o, 'horaFim', 'Retorno dos trabalhos', { tipo: 'time' }), texto(o, 'motivo', 'Para quê (opcional)', { placeholder: 'Ex.: para a reunião administrativa' })] : null,
        o.tipo === 'ingresso' || o.tipo === 'saida' ? listaPessoas(o.pessoas = o.pessoas || [], 'Irmão(s)') : null,
        o.tipo === 'saida' ? texto(o, 'motivo', 'Motivo (opcional)') : null,
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
      if (on) s.presentes.push({ id: i.id, nome: i.nome, grau: i.grau });
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
            h('button', { type: 'button', class: 'pequeno', onclick: () => { s.presentes = irmaos.map((i) => ({ id: i.id, nome: i.nome, grau: i.grau })); salvarSessaoDepois(); render(); } }, 'Marcar todos'),
            h('button', { type: 'button', class: 'pequeno', onclick: () => { s.presentes = []; salvarSessaoDepois(); render(); } }, 'Desmarcar todos'),
            anterior ? h('button', { type: 'button', class: 'pequeno', onclick: () => { s.presentes = anterior.presentes.filter((p) => irmaos.some((i) => i.id === p.id)).map((p) => Object.assign({}, p)); salvarSessaoDepois(); render(); } }, 'Os mesmos da Ata nº ' + anterior.numero) : null),
          ['MI', 'MM', 'CM', 'AM', ''].map((g) => {
            const doGrau = irmaos.filter((i) => (i.grau || '') === g);
            if (!doGrau.length) return null;
            return h('fieldset', { class: 'grupo-presenca' }, h('legend', {}, g ? { MI: 'Mestres Instalados', MM: 'Mestres Maçons', CM: 'Companheiros Maçons', AM: 'Aprendizes Maçons' }[g] + ' (' + rotuloGrau(g) + ')' : 'Sem grau informado'),
              doGrau.map((i) => h('label', { class: 'marcar presenca' }, h('input', { type: 'checkbox', checked: marcados.has(i.id), onchange: (e) => { alternar(i, e.target.checked); render(); } }), h('span', {}, i.nome))));
          }),
          h('p', { class: 'ajuda' }, 'Faltou alguém na lista? Cadastre na aba Irmãos.')
        ],
      h('h3', {}, 'Irmãos visitantes'),
      (s.visitantes || []).map((v, i) => h('div', { class: 'subcartao' },
        pessoaCampo(s.visitantes, i, null, { placeholder: 'Nome do visitante', comLoja: true, remover: () => { s.visitantes.splice(i, 1); salvarSessaoDepois(); render(); } }),
        h('div', { class: 'linha2' },
          texto(v, 'loja', null, { placeholder: 'Loja e número (ex.: Loja David nº 176)' }),
          texto(v, 'cargo', null, { placeholder: 'Cargo, se houver (ex.: VM da Loja David)' })))),
      h('button', { type: 'button', class: 'link', onclick: () => { s.visitantes = s.visitantes || []; s.visitantes.push({ nome: '', grau: '', loja: '', cargo: '' }); render(); } }, '+ visitante'),
      h('p', { class: 'ajuda' }, 'Visitantes novos são guardados no cadastro ao gerar a ata, para aparecerem como sugestão nas próximas.')
    );
  }

  /* Passo 6 */
  function passoDoenca(s) {
    return h('div', { class: 'formulario' },
      h('p', { class: 'ajuda' }, 'Registre de forma discreta: quem pediu e por quem. Evite detalhes de diagnóstico.'),
      s.doenca.length ? null : h('p', { class: 'vazio' }, 'Sem pedidos? A ata registra “Não houve manifestações.”'),
      s.doenca.map((d, i) => cartao('Pedido ' + (i + 1), h('div', {},
        pessoaCampo(d, 'quem', 'Quem pediu'),
        texto(d, 'porQuem', 'Por quem', { placeholder: 'Ex.: pelo Ir∴ Mauro de Almeida / pela esposa do Ir∴ Rodrigo' }),
        h('div', { class: 'atalhos' }, ['pelo Ir∴ ', 'pela esposa do Ir∴ ', 'pelo pai do Ir∴ ', 'pela mãe do Ir∴ ', 'pelo amigo '].map((f) => h('button', { type: 'button', class: 'chip', onclick: () => { d.porQuem = f; salvarSessaoDepois(); render(); } }, f.trim() + '…'))),
        texto(d, 'detalhe', 'Complemento (opcional)', { placeholder: 'Ex.: que se recupera de uma cirurgia' })),
        () => { s.doenca.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.doenca.push({ quem: { nome: '', grau: '' }, porQuem: '', detalhe: '' }); salvarSessaoDepois(); render(); } }, '+ pedido de vibrações')
    );
  }

  /* Passo 7 */
  function passoPalavra(s) {
    const pv = s.palavraVM = s.palavraVM || {};
    return h('div', { class: 'formulario' },
      h('h3', {}, 'Palavra Aberta'),
      s.palavraAberta.length ? null : h('p', { class: 'vazio' }, 'Ninguém falou? A ata registra “Não houve manifestações.”'),
      s.palavraAberta.map((p, i) => cartao('Manifestação ' + (i + 1), h('div', {},
        pessoaCampo(p, 'quem', 'Quem falou', { comLoja: true }),
        texto(p, 'texto', 'O que disse (resumo, começando pelo verbo)', { area: true, linhas: 2, placeholder: 'Ex.: parabenizou os Irmãos que apresentaram trabalhos' }),
        atalhos(p, 'texto', ['parabenizou os Irmãos que apresentaram trabalhos', 'agradeceu a acolhida da Loja', 'convidou os Irmãos para a sessão da sua Loja', 'registrou o aniversário do Ir∴ ', 'solicitou que os trabalhos apresentados sejam entregues à Secretaria'])),
        () => { s.palavraAberta.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.palavraAberta.push({ quem: { nome: '', grau: '' }, texto: '' }); salvarSessaoDepois(); render(); } }, '+ manifestação'),

      h('h3', {}, 'Palavra de autoridade (opcional)'),
      h('p', { class: 'ajuda' }, 'Ex.: Grão-Mestre, Grandes Vigilantes, Assessor Regional. Vira um parágrafo próprio, “PALAVRA DO 1º GRANDE VIGILANTE”.'),
      s.palavraAutoridade.map((p, i) => cartao('Autoridade ' + (i + 1), h('div', {},
        pessoaCampo(p, 'quem', 'Quem'), texto(p, 'cargo', 'Cargo', { placeholder: 'Ex.: 1º Grande Vigilante da GLMERGS' }),
        texto(p, 'texto', 'O que disse', { area: true, linhas: 2, placeholder: 'Ex.: trouxe um T∴F∴A∴ do Sereníssimo Grão-Mestre e agradeceu o convite' }),
        atalhos(p, 'texto', ['trouxe um T∴F∴A∴ do Sereníssimo Grão-Mestre', 'agradeceu o convite', 'parabenizou a Loja pelos trabalhos'])),
        () => { s.palavraAutoridade.splice(i, 1); salvarSessaoDepois(); render(); })),
      h('button', { type: 'button', class: 'secundario', onclick: () => { s.palavraAutoridade.push({ quem: { nome: '', grau: '' }, cargo: '', texto: '' }); salvarSessaoDepois(); render(); } }, '+ autoridade'),

      h('h3', {}, 'Palavra do V∴M∴'),
      marcar(pv, 'agradeceuPresenca', 'Agradeceu a presença de todos', { padraoVerdadeiro: true }),
      marcar(pv, 'agradeceuVisitantes', 'Agradeceu nominalmente aos visitantes'),
      marcar(pv, 'agape', 'Convidou para o Ágape'),
      texto(pv, 'proximaSessao', 'Lembrou de algo? (opcional)', { placeholder: 'Ex.: a próxima sessão, que será Sessão de Iniciação' }),
      texto(pv, 'texto', 'Outra fala do V∴M∴ (opcional)', { area: true, linhas: 2, placeholder: 'Ex.: realizou a leitura das propostas…' })
    );
  }

  /* Passo 8 */
  function passoRevisar(s) {
    const avisos = F.verificar(s, S.db.sessoes);
    const ata = F.gerar(s, S.db.config);
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
        h('img', { src: 'img/logo-caritas.jpg', alt: '' }),
        h('div', { class: 'timbre-texto' },
          h('div', { class: 'tb' }, 'À G∴D∴G∴A∴D∴U∴'), h('div', { class: 'tb' }, 'Aug∴ e Res∴ Loj∴ Simb∴ Caritas N.º 268'),
          h('div', { class: 'tb' }, 'Fundada em 04 de maio de 2016'), h('div', {}, 'Rua Barão do Amazonas, n.º 3216 - Partenon'),
          h('div', {}, 'Porto Alegre - RS - Brasil.'), h('div', { class: 'tb' }, 'Sessões: quartas-feiras 20h - Rito de York Americano'),
          h('div', { class: 'pequena' }, 'Jurisdicionada à M∴ R∴ Grande Loja Maçônica do Estado do Rio Grande do Sul')),
        h('img', { src: 'img/logo-gl.png', alt: '' })),
      ata.paragrafos.map((p) => h('p', { class: p.titulo ? 'titulo-ata' : '' }, p.runs.map((r) => r.b || r.i ? h(r.b ? 'strong' : 'em', {}, r.i && r.b ? h('em', {}, r.t) : r.t) : r.t))),
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
      if (!ex) { S.db.visitantes.push({ id: S.novoId('v'), nome: v.nome.trim(), grau: v.grau || '', loja: v.loja || '', cargo: v.cargo || '' }); mudou = true; }
    });
    if (mudou) salvarListaDepois('visitantes');
  }

  async function gerarBlob(s) {
    const ata = F.gerar(s, S.db.config);
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
    div.replaceChildren(folhaHTML(F.gerar(s, S.db.config)));
    setTimeout(() => window.print(), 150);
  }

  /* ---------------- Cadastros ---------------- */
  function vistaCadastros() {
    const aba = estado.abaCadastro;
    return h('section', {},
      h('div', { class: 'segmentado largo' }, [['irmaos', 'Quadro da Loja'], ['visitantes', 'Visitantes']].map(([v, r]) => h('button', { type: 'button', class: aba === v ? 'ativo' : '', onclick: () => { estado.abaCadastro = v; render(); } }, r))),
      aba === 'irmaos' ? tabelaIrmaos() : tabelaVisitantes());
  }
  function tabelaIrmaos() {
    const lista = S.db.irmaos;
    const conferir = lista.filter((i) => i.conferir).length;
    const ordem = lista.slice().sort((a, b) => ['MI', 'MM', 'CM', 'AM', ''].indexOf(a.grau || '') - ['MI', 'MM', 'CM', 'AM', ''].indexOf(b.grau || '') || a.nome.localeCompare(b.nome));
    return h('div', { class: 'formulario' },
      conferir ? h('div', { class: 'faixa alerta' }, conferir + ' nomes vieram das atas antigas e precisam ser conferidos (grau e grafia). ',
        h('button', { type: 'button', class: 'pequeno', onclick: () => { lista.forEach((i) => delete i.conferir); salvarListaDepois('irmaos'); render(); } }, 'Já conferi todos')) : null,
      S.modoGoogle() ? h('p', { class: 'ajuda' }, 'Dica: você também pode editar esta lista direto na aba “Irmaos” da planilha da Loja.') : null,
      h('div', { class: 'tabela' }, ordem.map((i) => h('div', { class: 'linha-tabela' + (i.ativo === false ? ' inativo' : '') },
        h('input', { value: i.nome, 'aria-label': 'Nome', oninput: (e) => { i.nome = e.target.value; delete i.conferir; salvarListaDepois('irmaos'); } }),
        h('select', { 'aria-label': 'Grau', onchange: (e) => { i.grau = e.target.value; delete i.conferir; salvarListaDepois('irmaos'); } }, GRAU_OPC.map(([v, r]) => h('option', { value: v, selected: i.grau === v }, r))),
        h('label', { class: 'marcar mini' }, h('input', { type: 'checkbox', checked: i.ativo !== false, onchange: (e) => { i.ativo = e.target.checked; salvarListaDepois('irmaos'); render(); } }), h('span', {}, 'Ativo')),
        i.conferir ? h('span', { class: 'etiqueta' }, 'conferir') : null))),
      h('button', { type: 'button', class: 'secundario', onclick: () => { lista.push({ id: S.novoId('i'), nome: '', grau: 'AM', ativo: true }); render(); const ins = app().querySelectorAll('.linha-tabela input'); } }, '+ Irmão'),
      h('p', { class: 'ajuda' }, 'Irmão que saiu do quadro: desmarque “Ativo”. Ele continua nas atas antigas, mas some da lista de presença.')
    );
  }
  function tabelaVisitantes() {
    const lista = S.db.visitantes;
    return h('div', { class: 'formulario' },
      h('p', { class: 'ajuda' }, 'Visitantes frequentes aparecem como sugestão ao preencher a presença e a Palavra.'),
      h('div', { class: 'tabela' }, lista.map((v, idx) => h('div', { class: 'linha-tabela visit' },
        h('input', { value: v.nome, placeholder: 'Nome', oninput: (e) => { v.nome = e.target.value; salvarListaDepois('visitantes'); } }),
        h('select', { onchange: (e) => { v.grau = e.target.value; salvarListaDepois('visitantes'); } }, GRAU_OPC.map(([g, r]) => h('option', { value: g, selected: v.grau === g }, r))),
        h('input', { value: v.loja || '', placeholder: 'Loja', oninput: (e) => { v.loja = e.target.value; salvarListaDepois('visitantes'); } }),
        h('input', { value: v.cargo || '', placeholder: 'Cargo', oninput: (e) => { v.cargo = e.target.value; salvarListaDepois('visitantes'); } }),
        h('button', { type: 'button', class: 'icone', onclick: () => { lista.splice(idx, 1); salvarListaDepois('visitantes'); render(); } }, '✕')))),
      h('button', { type: 'button', class: 'secundario', onclick: () => { lista.push({ id: S.novoId('v'), nome: '', grau: 'MM', loja: '', cargo: '' }); render(); } }, '+ Visitante'));
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
      marcar(c, 'registrarAtaAnterior', 'Registrar a leitura da ata anterior', { salvar: salvarConfigDepois }),
      marcar(c, 'registrarExpediente', 'Registrar o expediente decifrado', { salvar: salvarConfigDepois }),
      h('p', { class: 'ajuda versao' }, 'Sistema de Atas Cáritas 268 · versão 1.0')
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
  S.carregar().then(() => { verificarPosse(); render(); });
})();
