/* Monta o texto padronizado da ata a partir dos dados da sessão.
   Todas as frases-modelo da Loja ficam neste arquivo. */
(function () {
  const E = window.Extenso;
  const T = '∴';
  const GRAUS = {
    AM: { abrev: 'A∴M∴', nome: 'Aprendiz Maçom' },
    CM: { abrev: 'C∴M∴', nome: 'Companheiro Maçom' },
    MM: { abrev: 'M∴M∴', nome: 'Mestre Maçom' },
    MI: { abrev: 'M∴I∴', nome: 'Mestre Instalado' }
  };
  const GRAU_SESSAO = { 1: 'Aprendiz Maçom', 2: 'Companheiro Maçom', 3: 'Mestre Maçom' };
  const VM = 'V∴M∴';

  /* Tipos de item da agenda do dia (o que aparece na lista de escolha) */
  const TIPOS_AGENDA = [
    { id: 'instrucao', nome: 'Instrução de grau' },
    { id: 'trabalho', nome: 'Apresentação de trabalho' },
    { id: 'palestra', nome: 'Palestra / docência' },
    { id: 'leitura_proposta', nome: 'Leitura de proposta de candidato' },
    { id: 'escrutinio', nome: 'Escrutínio' },
    { id: 'cerimonia', nome: 'Cerimônia (Iniciação, Passagem, Elevação...)' },
    { id: 'entrega_identidade', nome: 'Entrega de identidade maçônica' },
    { id: 'prestacao_contas', nome: 'Prestação de contas' },
    { id: 'leitura_documento', nome: 'Leitura de decreto / prancha / circular' },
    { id: 'reuniao_administrativa', nome: 'Reunião administrativa' },
    { id: 'votacao', nome: 'Votação de assunto da Loja' },
    { id: 'eleicao', nome: 'Eleição da Administração' },
    { id: 'instalacao', nome: 'Instalação e Posse' },
    { id: 'outro', nome: 'Outro assunto' }
  ];

  const CERIMONIAS = {
    'Iniciação': { agenda: (n) => 'Sessão de Iniciação ' + (n.length > 1 ? 'dos candidatos ' : 'do candidato ') + lista(n), narr: (n) => 'Foi realizada a cerimônia de Iniciação ' + (n.length > 1 ? 'dos candidatos ' : 'do candidato ') + lista(n) + ', conforme o ritual, sendo ' + (n.length > 1 ? 'os neófitos recebidos' : 'o neófito recebido') + ' como Aprendiz' + (n.length > 1 ? 'es Maçons' : ' Maçom') + ' do quadro da Loja.' },
    'Passagem': { agenda: (n) => 'Passagem ao Grau de Companheiro Maçom ' + doIr(n), narr: (n) => 'Foi realizada a cerimônia de Passagem ao Grau de Companheiro Maçom ' + doIr(n) + ', conforme o ritual.' },
    'Elevação': { agenda: (n) => 'Elevação ao Grau de Mestre Maçom ' + doIr(n), narr: (n) => 'Foi realizada a cerimônia de Elevação ao Grau de Mestre Maçom ' + doIr(n) + ', conforme o ritual.' },
    'Filiação': { agenda: (n) => 'Filiação ' + doIr(n) + ' ao quadro da Loja', narr: (n) => 'Foi realizada a Filiação ' + doIr(n) + ' ao quadro da Loja.' },
    'Regularização': { agenda: (n) => 'Regularização ' + doIr(n), narr: (n) => 'Foi realizada a Regularização ' + doIr(n) + '.' },
    'Reintegração': { agenda: (n) => 'Reintegração ' + doIr(n), narr: (n) => 'Foi realizada a Reintegração ' + doIr(n) + ' ao quadro da Loja.' }
  };

  function lista(arr) {
    arr = (arr || []).filter((x) => x && String(x).trim());
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
  }
  function pessoa(p) {
    if (!p) return '';
    if (typeof p === 'string') return p;
    const g = GRAUS[p.grau];
    return 'Ir' + T + ' ' + (g ? g.abrev + ' ' : '') + (p.nome || '');
  }
  function nomes(ps) { return (ps || []).filter((p) => p && p.nome).map(pessoa); }
  function doIr(ps) {
    const n = nomes(ps);
    if (!n.length) return '';
    return (n.length > 1 ? 'dos Irmãos ' : 'do ') + lista(n.length > 1 ? n.map((x) => x.replace(/^Ir∴ /, '')) : n);
  }
  function paraIr(ps) {
    const n = nomes(ps);
    if (!n.length) return '';
    return n.length > 1 ? 'para os Irmãos ' + lista(n.map((x) => x.replace(/^Ir∴ /, ''))) : 'para o ' + n[0];
  }
  function ponto(s) {
    s = (s || '').trim();
    if (!s) return '';
    return /[.!?;:]$/.test(s) ? s : s + '.';
  }
  function semPonto(s) { return (s || '').trim().replace(/[.;]+$/, ''); }
  function aspas(s) { return '“' + semPonto(s).replace(/^["“]|["”]$/g, '') + '”'; }
  function maiuscula(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function nomeDe(c) { return String(typeof c === 'string' ? c : ((c && c.nome) || '')).trim(); }
  function cand(nomesCand) { return (nomesCand || []).map((c) => nomeDe(c).toUpperCase()).filter(Boolean); }

  /* ---------- Itens da agenda: texto curto (abertura) e narrativa (desenvolvimento) ---------- */
  function agendaTexto(it) {
    switch (it.tipo) {
      case 'instrucao': {
        const g = GRAUS[it.grauInstrucao || 'AM'];
        return (it.parte ? it.parte + ' da ' : '') + E.ordinal(it.numero || 1, true) + ' Instrução de ' + g.abrev + ' ' + paraIr(it.irmaos);
      }
      case 'trabalho': {
        let t;
        if (it.ordinalTrabalho) t = 'Apresentação do ' + E.ordinal(it.ordinalTrabalho) + ' Trabalho de ' + GRAUS[it.grauTrabalho || 'AM'].abrev + ' do Ir' + T + ' ' + ((it.irmao && it.irmao.nome) || '');
        else t = 'Apresentação de trabalho pelo ' + pessoa(it.irmao);
        if (it.titulo) t += ', intitulado ' + aspas(it.titulo);
        return t;
      }
      case 'palestra':
        return 'Palestra apresentada pelo ' + pessoa(it.irmao) + (it.titulo ? ', sobre o tema ' + aspas(it.titulo) : '');
      case 'leitura_proposta':
        return E.ordinal(it.leitura || 1, true) + ' leitura de propostas de ' + (it.processo || 'Iniciação').toLowerCase();
      case 'escrutinio':
        return 'Escrutínio' + ((it.candidatos || []).length > 1 ? ' dos candidatos' : ' do candidato') + ' ' + lista(cand(it.candidatos));
      case 'cerimonia': {
        const c = CERIMONIAS[it.cerimonia || 'Iniciação'];
        const ps = it.cerimonia === 'Iniciação' ? cand(it.pessoas) : it.pessoas;
        return (it.parte ? it.parte + " da " : "") + c.agenda(ps);
      }
      case 'entrega_identidade':
        return 'Entrega de identidades maçônicas';
      case 'prestacao_contas':
        return 'Prestação de contas da Loja' + (it.periodo ? ' referente a ' + semPonto(it.periodo) : '') + (it.irmao && it.irmao.nome ? ', apresentada pelo ' + pessoa(it.irmao) : '');
      case 'leitura_documento':
        return 'Leitura ' + (it.documento === 'Prancha' || it.documento === 'Circular' ? 'da ' : 'do ') + (it.documento || 'Decreto') + (it.numeroDoc ? ' nº ' + it.numeroDoc : '') + (it.origem ? ', ' + semPonto(it.origem) : '');
      case 'reuniao_administrativa':
        return 'Reunião administrativa' + ((it.assuntos || []).length ? ' para tratar de: ' + it.assuntos.filter(Boolean).map((a, i) => String.fromCharCode(97 + i) + ') ' + semPonto(a)).join('; ') : '');
      case 'votacao':
        return 'Votação sobre ' + semPonto(it.assunto || 'assunto da Loja');
      case 'eleicao':
        return 'Eleição da Administração ' + (it.administracao || '');
      case 'instalacao':
        return 'Sessão de Instalação e Posse da Administração ' + (it.administracao || '');
      default:
        return semPonto(it.texto || '');
    }
  }

  function narrativa(it) {
    switch (it.tipo) {
      case 'trabalho':
      case 'palestra':
        return it.observacao ? maiuscula(ponto(it.observacao)) : '';
      case 'leitura_proposta': {
        const c = cand(it.candidatos);
        if (!c.length) return '';
        let t = 'Foi realizada a ' + E.ordinal(it.leitura || 1, true) + ' leitura ' + (c.length > 1 ? 'das propostas' : 'da proposta') + ' de ' + (it.processo || 'Iniciação').toLowerCase() + (c.length > 1 ? ' dos candidatos ' : ' do candidato ') + lista(c) + ', de um total de três leituras em sessões consecutivas anteriores ao escrutínio.';
        if (it.objecao === 'com') t += ' Houve manifestação de objeção, que ficou sob malhete do ' + VM + '.';
        else t += ' Consultados os Irmãos, não houve objeção.';
        return t;
      }
      case 'escrutinio': {
        const proc = (it.processo || 'Iniciação').toLowerCase();
        return (it.candidatos || []).filter((c) => c.nome).map((c) => {
          const n = c.nome.toUpperCase();
          if (c.resultado === 'rejeitado') return 'Procedeu-se ao escrutínio secreto do candidato ' + n + ', para ' + proc + ', não tendo sido aprovado, nos termos do Regulamento Geral.';
          if (c.resultado === 'novo') return 'Procedeu-se ao escrutínio secreto do candidato ' + n + ', para ' + proc + ', sendo necessário novo escrutínio, nos termos do Regulamento Geral.';
          return 'Procedeu-se ao escrutínio secreto do candidato ' + n + ', para ' + proc + ', sendo o resultado claro e seu ingresso aprovado pelo ' + VM + '.';
        }).join(' ');
      }
      case 'cerimonia': {
        const c = CERIMONIAS[it.cerimonia || 'Iniciação'];
        const ps = it.cerimonia === 'Iniciação' ? cand(it.pessoas) : it.pessoas;
        let t = c.narr(ps);
        if (it.parte) t = t.replace(/^Foi realizada a cerimônia/, 'Foi realizada a ' + it.parte.toLowerCase() + ' da cerimônia');
        return t;
      }
      case 'entrega_identidade':
        return (it.entregas || []).filter((e) => e.recebe && e.recebe.nome).map((e) => {
          const g = GRAUS[e.grau] ? ' de ' + GRAUS[e.grau].abrev : '';
          if (e.entrega && e.entrega.nome) return 'O ' + VM + ' convidou o ' + pessoa(e.entrega) + ' a entregar ao ' + pessoa(e.recebe) + ' sua identidade maçônica' + g + '.';
          return 'Foi entregue ao ' + pessoa(e.recebe) + ' sua identidade maçônica' + g + '.';
        }).join(' ');
      case 'prestacao_contas':
        return 'A prestação de contas foi ' + (it.resultado === 'ressalva' ? 'apresentada, com as seguintes ressalvas: ' + semPonto(it.ressalva) + '.' : 'apresentada e aprovada, sem contestação ou ressalva por parte dos presentes.');
      case 'leitura_documento':
        return it.resumo ? maiuscula(ponto(it.resumo)) : '';
      case 'eleicao': {
        const forma = { unanimidade: 'por unanimidade', maioria: 'pela maioria dos votos', aclamacao: 'por aclamação' }[it.forma || 'unanimidade'];
        const nom = (it.cargos || []).filter((c) => c.cargo && c.pessoa && c.pessoa.nome).map((c) => c.cargo + ', ' + pessoa(c.pessoa));
        return 'Procedeu-se à eleição da Administração ' + (it.administracao || '') + ', sendo eleita, ' + forma + ', a seguinte nominata' + (nom.length ? ': ' + nom.join('; ') : '') + '.' + (it.posse ? ' A posse ficou marcada para ' + E.dataCurta(it.posse) + '.' : '');
      }
      case 'instalacao':
        return 'Foi realizada a Sessão de Instalação e Posse da Administração ' + (it.administracao || '') + ', sendo instalado no cargo de Venerável Mestre o ' + (it.vm && it.vm.nome ? pessoa(it.vm) : '[nome]') + (it.instalador && it.instalador.nome ? ', pelo ' + pessoa(it.instalador) + ',' : '') + ' e empossados os demais oficiais da nova Administração, conforme o ritual.';
      case 'votacao':
        return 'Posto em votação ' + semPonto(it.assunto || 'o assunto') + ', ' + (it.resultadoVotacao ? semPonto(it.resultadoVotacao) : 'foi aprovado pela maioria dos presentes') + '.';
      case 'outro':
        return it.observacao ? maiuscula(ponto(it.observacao)) : '';
      default:
        return it.observacao ? maiuscula(ponto(it.observacao)) : '';
    }
  }

  /* ---------- Ocorrências ---------- */
  function ocorrenciaTexto(o) {
    const h = o.hora ? 'Às ' + E.hora(o.hora) + ', ' : '';
    switch (o.tipo) {
      case 'descanso':
        return maiuscula(h + 'o ' + VM + ' colocou a Loja em descanso' + (o.motivo ? ' ' + semPonto(o.motivo) : '') + (o.horaFim ? ', retomando os trabalhos às ' + E.hora(o.horaFim) : '') + '.');
      case 'ingresso':
        return maiuscula(h + (o.pessoas && o.pessoas.length > 1 ? 'os Irmãos ' + lista(nomes(o.pessoas).map((x) => x.replace(/^Ir∴ /, ''))) + ' solicitaram' : 'o ' + pessoa((o.pessoas || [])[0]) + ' solicitou') + ' ingresso após a abertura dos trabalhos, o que foi autorizado pelo ' + VM + '.');
      case 'saida':
        return maiuscula(h + (o.pessoas && o.pessoas.length > 1 ? 'os Irmãos ' + lista(nomes(o.pessoas).map((x) => x.replace(/^Ir∴ /, ''))) + ' retiraram-se' : 'o ' + pessoa((o.pessoas || [])[0]) + ' retirou-se') + ' da sessão' + (o.motivo ? ', ' + semPonto(o.motivo) : '') + ', com a devida autorização do ' + VM + '.');
      case 'retirada_aprendizes':
        return 'Os Aprendizes mais modernos foram retirados da Sala da Loja para a realização das instruções previstas na agenda do dia e, ao final, convidados pelo ' + VM + ' a retornar para a continuidade dos trabalhos.';
      default:
        return maiuscula(ponto(h + (o.texto || '')));
    }
  }

  /* ---------- Montagem da ata completa ---------- */
  function gerar(s, cfg) {
    const P = [];
    const par = (...runs) => P.push({ runs: runs.filter((r) => r && r.t) });
    const n = (t) => ({ t });
    const b = (t) => ({ t, b: true });

    P.push({ titulo: true, runs: [n('Ata nº ' + String(s.numero || '').padStart(2, '0') + ' – Administração ' + (s.administracao || cfg.administracao))] });

    // Abertura
    const d = s.data ? E.dataAbertura(s.data) : { inicio: '[data]', ano: '' };
    const vmTitular = (cfg.vm || '').toLowerCase() === ((s.vm && s.vm.nome) || '').toLowerCase();
    const agenda = (s.agenda || []).map(agendaTexto).filter(Boolean);
    par(
      b(d.inicio), n(' '), b(d.ano), n(', '), { t: 'Era Vulgar', b: true, i: true },
      n(', os Irmãos da ' + cfg.lojaNome + ', jurisdicionada à ' + cfg.potencia + ', ' + semPonto(cfg.local) + ', tendo ' + (vmTitular ? 'como Venerável Mestre e presidindo os trabalhos o Irmão ' : 'presidindo os trabalhos, como Venerável Mestre em exercício, o Irmão ')),
      b(nomeOficial(s.vm)), n(', no segundo malhete o Irmão '), b(nomeOficial(s.v1)), n(' e no terceiro malhete o Irmão '), b(nomeOficial(s.v2)),
      n(', reuniram-se, conforme o “Ne Varietur” gravado no Livro da Loja, sendo os trabalhos abertos às ' + (E.hora(s.horaAbertura) || '[hora]') + '. A Loja foi aberta no Grau de ' + GRAU_SESSAO[s.grau || 1] + ' com a seguinte '),
      b('agenda do dia:'),
      n(agenda.length ? ' ' + agenda.map((a, i) => (i + 1) + ') ' + a).join('; ') + '.' : ' sessão ordinária, sem matérias específicas.')
    );

    // Ata anterior e expediente
    if (cfg.registrarAtaAnterior && s.ataAnterior && s.ataAnterior.status && s.ataAnterior.status !== 'nao_registrar') {
      const a = s.ataAnterior; const num = a.numero ? 'nº ' + String(a.numero).padStart(2, '0') + ' ' : '';
      let t;
      if (a.status === 'aprovada') t = 'Foi lida e aprovada, sem ressalvas, a Ata ' + num + 'da sessão anterior.';
      else if (a.status === 'aprovada_correcao') t = 'Foi lida a Ata ' + num + 'da sessão anterior, aprovada com a seguinte correção: ' + semPonto(a.correcao) + '.';
      else if (a.status === 'dispensada') t = 'Foi dispensada a leitura da Ata ' + num + 'da sessão anterior, previamente distribuída aos Irmãos, sendo a mesma aprovada.';
      else t = 'A Ata ' + num + 'da sessão anterior não foi lida nesta sessão, ficando sua apreciação para a próxima sessão.';
      par(b('ATA ANTERIOR:'), n(' ' + t));
    }
    if (cfg.registrarExpediente && s.expediente) {
      const ex = (s.expediente || []).filter((e) => e.descricao);
      const t = ex.length ? 'Foi decifrado o seguinte expediente: ' + ex.map((e) => (e.tipo ? e.tipo + ' ' : '') + semPonto(e.descricao)).join('; ') + '.' : 'Não houve expediente a decifrar.';
      par(b('EXPEDIENTE:'), n(' ' + t));
    }

    // Desenvolvimento
    const ocs = (s.ocorrencias || []).slice().sort((x, y) => (x.hora || '99').localeCompare(y.hora || '99')).map(ocorrenciaTexto).filter(Boolean);
    const narrs = (s.agenda || []).map(narrativa).filter(Boolean);
    let dev = 'Os trabalhos transcorreram com regularidade e ordem.';
    if (narrs.length) dev += ' Seguindo a agenda do dia, ' + narrs.map((x, i) => i === 0 ? x.charAt(0).toLowerCase() + x.slice(1) : x).join(' ');
    if (ocs.length) dev += ' ' + ocs.join(' ');
    par(n(dev));

    // Presença
    const pres = contarPresenca(s);
    let tp = 'A sessão contou com a presença de ' + E.numero(pres.total) + (pres.total === 1 ? ' Irmão do quadro da Loja' : ' Irmãos do quadro da Loja');
    const partes = ['MI', 'MM', 'CM', 'AM'].filter((g) => pres[g]).map((g) => E.numero(pres[g]) + ' ' + GRAUS[g].abrev);
    if (partes.length && pres.total) tp += ', sendo ' + lista(partes);
    tp += '.';
    const vis = (s.visitantes || []).filter((v) => v.nome);
    if (vis.length) {
      tp += ' Houve ainda a presença de ' + (vis.length === 1 ? 'um Irmão visitante: ' : E.numero(vis.length) + ' Irmãos visitantes: ') +
        vis.map((v) => pessoa(v) + (v.cargo ? ', ' + semPonto(v.cargo) : '') + (v.loja ? ', da ' + semPonto(v.loja) : '')).join('; ') +
        (vis.length === 1 ? ', devidamente registrado' : ', devidamente registrados') + ' no Livro de Visitantes da Loja.';
    } else tp += ' Não houve Irmãos visitantes.';
    par(b('PRESENÇA DOS OBREIROS DA LOJA E VISITANTES:'), n(' ' + tp));

    // Doença e aflição
    const da = (s.doenca || []).filter((x) => (x.quem && x.quem.nome) || x.porQuem);
    par(b('EM DOENÇA E AFLIÇÃO:'), n(' ' + (da.length ? da.map((x) => maiuscula((x.quem && x.quem.nome ? 'o ' + pessoa(x.quem) : 'foram') + (x.quem && x.quem.nome ? ' pediu' : ' pedidas') + ' vibrações e orações ' + semPonto(x.porQuem) + (x.detalhe ? ', ' + semPonto(x.detalhe) : '') + '.')).join(' ') : 'Não houve manifestações.')));

    // Palavra aberta
    const pa = (s.palavraAberta || []).filter((x) => x.quem && x.quem.nome && x.texto);
    par(b('PALAVRA ABERTA:'), n(' ' + (pa.length ? pa.map((x) => 'O ' + pessoa(x.quem) + (x.quem.loja ? ', da ' + semPonto(x.quem.loja) + ',' : '') + ' ' + ponto(x.texto)).join(' ') : 'Não houve manifestações.')));

    // Palavra de autoridades
    (s.palavraAutoridade || []).filter((x) => x.quem && x.quem.nome).forEach((x) => {
      par(b('PALAVRA DO ' + (x.cargo || 'IRMÃO VISITANTE').toUpperCase() + ':'), n(' O ' + pessoa(x.quem) + (x.cargo ? ', ' + semPonto(x.cargo) + ',' : '') + ' ' + ponto(x.texto || 'saudou os Irmãos presentes')));
    });

    // Palavra do VM
    const pv = s.palavraVM || {};
    const acoes = [];
    if (pv.agradeceuPresenca !== false) acoes.push('agradeceu a presença de todos os Irmãos');
    if (pv.agradeceuVisitantes && vis.length) acoes.push('agradeceu nominalmente ' + (vis.length === 1 ? 'ao Irmão visitante' : 'aos Irmãos visitantes') + ' pela presença');
    if (pv.proximaSessao) acoes.push('lembrou ' + semPonto(pv.proximaSessao));
    if (pv.texto) acoes.push(semPonto(pv.texto));
    if (pv.agape) acoes.push('convidou os Irmãos para o Ágape');
    par(b('PALAVRA DO ' + VM + ':'), n(' ' + (acoes.length ? 'O ' + VM + ' ' + lista(acoes) + '.' : 'O ' + VM + ' agradeceu a presença de todos.')));

    // Encerramento
    const sec = s.secretario || {};
    par(b('ENCERRAMENTO:'), n(' Como nada mais constasse e estando todos satisfeitos, foram os trabalhos encerrados às ' + (E.hora(s.horaEncerramento) || '[hora]') +
      ', sendo, posteriormente, por mim, ' + (sec.nome || '[secretário]') + ', ' + funcaoSecretario(s) +
      ', lavrada a presente Ata, longe e a coberto das indiscrições profanas, a qual, depois de lida e achada conforme, vai também assinada pelo ' + VM + ' ' + ((s.vm && s.vm.nome) || '') + ', conforme nossos usos, costumes e leis.'));

    return { paragrafos: P, assinatura: { vm: ((s.vm && s.vm.nome) || '').toUpperCase(), sec: (sec.nome || '').toUpperCase(), funcao: funcaoSecretario(s) } };
  }

  function nomeOficial(p) {
    if (!p || !p.nome) return '[nome]';
    const g = GRAUS[p.grau];
    return (g ? g.abrev + ' ' : '') + p.nome.toUpperCase();
  }
  function funcaoSecretario(s) { return s.adhoc ? 'Secretário Ad Hoc' : 'Secretário'; }

  function contarPresenca(s) {
    const r = { MI: 0, MM: 0, CM: 0, AM: 0, total: 0 };
    if (s.presencaManual) {
      ['MI', 'MM', 'CM', 'AM'].forEach((g) => { r[g] = Number(s.contagem && s.contagem[g]) || 0; r.total += r[g]; });
    } else {
      (s.presentes || []).forEach((p) => { if (r[p.grau] !== undefined) r[p.grau]++; r.total++; });
    }
    return r;
  }

  /* ---------- Verificações automáticas ---------- */
  function verificar(s, todas) {
    const av = [];
    if (!s.data) av.push('Informe a data da sessão.');
    if (!s.horaAbertura) av.push('Informe a hora de abertura.');
    if (!s.horaEncerramento) av.push('Informe a hora de encerramento.');
    if (s.horaAbertura && s.horaEncerramento && s.horaEncerramento <= s.horaAbertura) av.push('A hora de encerramento está antes da abertura.');
    (s.ocorrencias || []).forEach((o) => {
      if (o.hora && s.horaAbertura && o.hora < s.horaAbertura) av.push('Há uma ocorrência às ' + o.hora + ', antes da abertura (' + s.horaAbertura + ').');
      if (o.hora && s.horaEncerramento && o.hora > s.horaEncerramento) av.push('Há uma ocorrência às ' + o.hora + ', depois do encerramento.');
      if (o.tipo === 'descanso' && o.hora && o.horaFim && o.horaFim <= o.hora) av.push('O retorno do descanso está antes do início do descanso.');
    });
    ['vm', 'v1', 'v2', 'secretario'].forEach((k) => { if (!s[k] || !s[k].nome) av.push('Falta o nome do ' + { vm: 'Venerável Mestre', v1: 'segundo malhete (1º Vigilante)', v2: 'terceiro malhete (2º Vigilante)', secretario: 'secretário' }[k] + '.'); });
    if (!(s.agenda || []).length) av.push('A agenda do dia está vazia.');
    if (!contarPresenca(s).total) av.push('Nenhum Irmão do quadro foi marcado como presente.');
    const dup = (todas || []).find((o) => o.id !== s.id && o.administracao === s.administracao && Number(o.numero) === Number(s.numero));
    if (dup) av.push('Já existe a Ata nº ' + s.numero + ' nesta administração (sessão de ' + E.dataCurta(dup.data) + ').');
    return av;
  }

  /* ---------- Pendências que atravessam sessões (propostas e escrutínios) ---------- */
  function pendencias(sessoes, atual) {
    const cands = {};
    const ordem = (sessoes || []).filter((x) => x.id !== atual.id && (!atual.data || x.data <= atual.data)).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    ordem.forEach((x) => (x.agenda || []).forEach((it) => {
      if (it.tipo === 'leitura_proposta') (it.candidatos || []).forEach((c) => {
        const k = nomeDe(c).toUpperCase(); if (!k) return;
        cands[k] = cands[k] || { nome: k, processo: it.processo || 'Iniciação', leituras: 0, escrutinio: null, cerimonia: false };
        cands[k].leituras = Math.max(cands[k].leituras, Number(it.leitura) || 1);
      });
      if (it.tipo === 'escrutinio') (it.candidatos || []).forEach((c) => {
        const k = nomeDe(c).toUpperCase(); if (!k) return;
        cands[k] = cands[k] || { nome: k, processo: it.processo || 'Iniciação', leituras: 3, escrutinio: null, cerimonia: false };
        cands[k].escrutinio = c.resultado || 'aprovado';
      });
      if (it.tipo === 'cerimonia' && (it.cerimonia || 'Iniciação') === 'Iniciação') (it.pessoas || []).forEach((p) => {
        const k = nomeDe(p).toUpperCase(); if (cands[k]) cands[k].cerimonia = true;
      });
    }));
    const out = [];
    Object.values(cands).forEach((c) => {
      if (c.cerimonia || c.escrutinio === 'rejeitado') return;
      if (!c.escrutinio && c.leituras < 3) out.push({ tipo: 'leitura', nome: c.nome, processo: c.processo, proxima: c.leituras + 1, texto: c.nome + ': ' + c.leituras + 'ª leitura feita. Próxima: ' + (c.leituras + 1) + 'ª leitura.' });
      else if (!c.escrutinio) out.push({ tipo: 'escrutinio', nome: c.nome, processo: c.processo, texto: c.nome + ': 3 leituras feitas. Próximo passo: escrutínio.' });
      else if (c.escrutinio === 'novo') out.push({ tipo: 'escrutinio', nome: c.nome, processo: c.processo, texto: c.nome + ': aguarda novo escrutínio.' });
      else if (c.processo === 'Iniciação') out.push({ tipo: 'iniciacao', nome: c.nome, processo: c.processo, texto: c.nome + ': aprovado em escrutínio. Aguarda a Iniciação.' });
    });
    return out;
  }

  window.Frases = { GRAUS, GRAU_SESSAO, TIPOS_AGENDA, CERIMONIAS, gerar, verificar, pendencias, agendaTexto, pessoa, contarPresenca, lista };
})();
