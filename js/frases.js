/* Monta o texto padronizado da ata a partir dos dados da sessão.
   Todas as frases-modelo da Loja ficam neste arquivo.
   Linguagem conforme o Ritual do Grau de Aprendiz Maçom do Rito de York (Blue Lodge),
   GLMERGS, edição 2020: Estação do Leste/Oeste/Sul, Agenda do Dia, Ata da última reunião,
   Correspondência, atos e decretos, Em Doença e Aflição, Boas Novas, Conclusão da Reunião,
   Fechamento da Loja. Sem termos de outros Ritos (balaústre, prancha, expediente decifrado,
   tronco, aclamação, cadeia de união, neófito etc.). */
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

  const TIPOS_SESSAO = [
    ['Ordinária', 'Sessão Ordinária'],
    ['Magna', 'Sessão Magna (Iniciação, Passagem ou Elevação)'],
    ['Especial', 'Sessão especialmente convocada'],
    ['Pública', 'Sessão Pública (Instalação e Posse, Loja de Mesa, Despedida)']
  ];

  /* Tipos de item da Agenda do Dia (o que aparece na lista de escolha) */
  const TIPOS_AGENDA = [
    { id: 'instrucao', nome: 'Instrução do Grau' },
    { id: 'trabalho', nome: 'Apresentação de trabalho' },
    { id: 'palestra', nome: 'Palestra (Irmão ou convidado)' },
    { id: 'debate', nome: 'Debate ou roda de conversa' },
    { id: 'orientacoes', nome: 'Orientações gerais, avisos ou treinamento' },
    { id: 'leitura_proposta', nome: 'Leitura de petição (proposta)' },
    { id: 'sindicancia', nome: 'Comissão de sindicância' },
    { id: 'escrutinio', nome: 'Escrutínio (votação com esferas)' },
    { id: 'cerimonia', nome: 'Cerimônia (Iniciação, Passagem, Elevação, Filiação...)' },
    { id: 'cobertura_altar', nome: 'Falecimento – Cobertura do Altar' },
    { id: 'entrega_identidade', nome: 'Entrega de identidade maçônica' },
    { id: 'prestacao_contas', nome: 'Prestação de contas' },
    { id: 'leitura_documento', nome: 'Leitura de leis, atos e decretos' },
    { id: 'reuniao_administrativa', nome: 'Assuntos administrativos' },
    { id: 'votacao', nome: 'Votação de moção (mão esquerda)' },
    { id: 'eleicao', nome: 'Eleição da Administração' },
    { id: 'instalacao', nome: 'Investidura e Instalação e Posse' },
    { id: 'outro', nome: 'Outro assunto' }
  ];

  /* Em que momento o assunto foi tratado. Em loja = formal e protocolar;
     no descanso = informal (slides, debates, palestras, contas, orientações). */
  const MOMENTOS = [
    ['loja', 'Em loja, com a Loja trabalhando'],
    ['descanso', 'No período de descanso (informal)'],
    ['apos', 'Em loja, depois do descanso']
  ];
  /* Tipos que podem acontecer no descanso e o momento padrão de cada um */
  const MOMENTO_PADRAO = { trabalho: 'loja', palestra: 'descanso', debate: 'descanso', orientacoes: 'descanso', prestacao_contas: 'descanso', reuniao_administrativa: 'loja', instrucao: 'loja', outro: 'loja' };
  /* Entra na Agenda do Dia lida na abertura? Em loja sempre; no descanso só se marcado */
  const naAgenda = (it) => (momentoDe(it) === 'descanso' ? !!it.naAgenda : it.naAgenda !== false);
  const momentoDe = (it) => (MOMENTO_PADRAO[it.tipo] !== undefined ? (it.momento || MOMENTO_PADRAO[it.tipo]) : 'loja');
  const NATUREZA_ORIENT = [
    ['orientacoes', 'Orientações gerais aos Irmãos'],
    ['treinamento', 'Treinamento'],
    ['avisos', 'Avisos e informes'],
    ['ritualistica', 'Orientações sobre a ritualística']
  ];

  /* Instruções do 1º Grau, conforme o Ritual (Segunda e Terceira Seções) */
  const INSTRUCOES_AM = [
    ['sala', 'Apresentação da Sala da Loja ao Aprendiz Maçom recém-Iniciado'],
    ['1-I', '1ª Instrução – Parte I: Palestra sobre as Formas e Cerimônias'],
    ['1-II', '1ª Instrução – Parte II: Palestra sobre as Razões'],
    ['2-I', '2ª Instrução – Parte I: Palestra Histórica'],
    ['2-II', '2ª Instrução – Parte II: Exortação']
  ];

  const CERIMONIAS = {
    'Iniciação': {
      agenda: (n) => 'Cerimônia de Iniciação ' + (n.length > 1 ? 'dos Senhores ' : 'do Senhor ') + lista(n),
      narr: (n, it) => {
        const pl = n.length > 1;
        return 'Foi realizada a Cerimônia de Iniciação ' + (pl ? 'dos Senhores ' : 'do Senhor ') + lista(n) +
          ', que, ' + (pl ? 'tendo sido devidamente aceitos' : 'tendo sido devidamente aceito') + ' e não havendo objeção, ' +
          (pl ? 'receberam' : 'recebeu') + ' o 1º Grau da Maçonaria, prestando sua Obrigação sobre as Três Grandes Luzes, ' +
          (pl ? 'sendo-lhes entregue o Avental' : 'sendo-lhe entregue o Avental') +
          ' e apresentadas as ferramentas de trabalho do Grau, a Régua de Vinte e Quatro Polegadas e o Martelo de Corte, conforme o Ritual.' +
          (it && it.designado && it.designado.nome ? ' Concluída a Cerimônia, o ' + VM + ' designou o ' + pessoa(it.designado) + ' para assistir ' + (pl ? 'os novos Aprendizes Maçons' : 'o novo Aprendiz Maçom') + ' no canto Nordeste da Loja.' : '');
      }
    },
    'Passagem': {
      agenda: (n) => 'Cerimônia de Passagem ao 2º Grau ' + doIr(n),
      narr: (n) => 'Foi realizada a Cerimônia de Passagem ' + doIr(n) + ', ' + (nomes(n).length > 1 ? 'que receberam' : 'que recebeu') + ' o 2º Grau da Maçonaria, Companheiro Maçom, conforme o Ritual.'
    },
    'Elevação': {
      agenda: (n) => 'Cerimônia de Elevação ao 3º Grau ' + doIr(n),
      narr: (n) => 'Foi realizada a Cerimônia de Elevação ' + doIr(n) + ' ao 3º Grau da Maçonaria, Mestre Maçom, conforme o Ritual.'
    },
    'Filiação': {
      agenda: (n) => 'Filiação ' + doIr(n) + ' ao quadro da Loja',
      narr: (n) => (nomes(n).length > 1 ? 'Os Irmãos ' + lista(semIr(n)) + ', conduzidos' : 'O ' + lista(nomes(n)) + ', conduzido') +
        ' ao Altar pelo Ir∴ Marechal, ' + (nomes(n).length > 1 ? 'ratificaram' : 'ratificou') + ' solenemente a Obrigação do seu Grau, ' +
        (nomes(n).length > 1 ? 'sendo filiados' : 'sendo filiado') + ' ao quadro da Loja.'
    },
    'Regularização': {
      agenda: (n) => 'Regularização ' + doIr(n),
      narr: (n) => (nomes(n).length > 1 ? 'Os Irmãos ' + lista(semIr(n)) + ', conduzidos' : 'O ' + lista(nomes(n)) + ', conduzido') +
        ' ao Altar pelo Ir∴ Marechal, ' + (nomes(n).length > 1 ? 'renovaram' : 'renovou') + ' integralmente a Obrigação do Grau em que ' +
        (nomes(n).length > 1 ? 'estão colados, sendo regularizados' : 'está colado, sendo regularizado') + '.'
    },
    'Reintegração': {
      agenda: (n) => 'Reintegração ' + doIr(n) + ' ao quadro da Loja',
      narr: (n) => 'Foi realizada a Reintegração ' + doIr(n) + ' ao quadro da Loja.'
    }
  };

  /* ---------- Atalhos de redação (botões de preenchimento rápido nas telas) ---------- */
  const ATALHOS = {
    doencaSituacao: ['que se recupera de uma cirurgia', 'que está hospitalizado', 'que está em tratamento de saúde', 'que passa por um momento difícil', 'pelo falecimento de seu pai', 'pelo falecimento de sua mãe', 'que necessita da ajuda e solidariedade da Loja'],
    doencaPorQuem: ['pelo Ir∴ ', 'pela esposa do Ir∴ ', 'pelo pai do Ir∴ ', 'pela mãe do Ir∴ ', 'pelo filho do Ir∴ ', 'pela família do Ir∴ ', 'pelo amigo '],
    boasNovas: ['o nascimento de seu filho ', 'o nascimento de seu neto ', 'o seu aniversário natalício', 'o seu aniversário de casamento', 'o aniversário de sua Iniciação', 'a formatura de ', 'a recuperação de saúde do Ir∴ ', 'a sua aprovação em concurso', 'a sua promoção profissional', 'a conquista de '],
    conclusao: ['parabenizou os Irmãos que apresentaram trabalhos', 'agradeceu a acolhida fraterna da Loja', 'convidou os Irmãos para a sessão da sua Loja', 'registrou o aniversário do Ir∴ ', 'lembrou que os trabalhos de grau devem ser entregues à Secretaria', 'informou sobre a próxima confraternização da Loja', 'convidou os Irmãos para a Instalação e Posse dos Oficiais'],
    autoridade: ['trouxe a saudação fraterna do Sereníssimo Grão-Mestre', 'agradeceu o convite e a acolhida da Loja', 'parabenizou a Loja pela correta execução do Ritual', 'destacou a importância da frequência às sessões', 'convidou os Irmãos para os eventos da Grande Loja'],
    vm: ['parabenizou os Oficiais pela execução do Ritual', 'lembrou a todos o lema Amor Fraternal, Amparo e Verdade', 'pediu empenho dos Oficiais na memorização das falas do Ritual', 'informou a programação das próximas sessões', 'convidou os Irmãos a apresentarem candidatos dignos']
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
  function nomes(ps) { return (ps || []).filter((p) => p && (typeof p === 'string' ? p.trim() : p.nome)).map(pessoa); }
  function semIr(ps) { return nomes(ps).map((x) => x.replace(/^Ir∴ /, '')); }
  function doIr(ps) {
    const n = nomes(ps);
    if (!n.length) return '';
    return n.length > 1 ? 'dos Irmãos ' + lista(semIr(ps)) : 'do ' + n[0];
  }
  function aoIr(ps) {
    const n = nomes(ps);
    if (!n.length) return '';
    return n.length > 1 ? 'aos Irmãos ' + lista(semIr(ps)) : 'ao ' + n[0];
  }
  function paraIr(ps) {
    const n = nomes(ps);
    if (!n.length) return '';
    return n.length > 1 ? 'para os Irmãos ' + lista(semIr(ps)) : 'para o ' + n[0];
  }
  function ponto(s) {
    s = (s || '').trim();
    if (!s) return '';
    return /[.!?;:]$/.test(s) ? s : s + '.';
  }
  function semPonto(s) { return (s || '').trim().replace(/[.;,]+$/, ''); }
  function aspas(s) { return '“' + semPonto(s).replace(/^["“]|["”]$/g, '') + '”'; }
  function maiuscula(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function minuscula(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function nomeDe(c) { return String(typeof c === 'string' ? c : ((c && c.nome) || '')).trim(); }
  function cand(nomesCand) { return (nomesCand || []).map((c) => nomeDe(c).toUpperCase()).filter(Boolean); }
  /* "do Senhor" (Iniciação) ou "do Ir∴" (Filiação, Regularização) */
  function peticionario(processo, n) {
    if ((processo || 'Iniciação') === 'Iniciação') return (n > 1 ? 'dos Senhores ' : 'do Senhor ');
    return (n > 1 ? 'dos Irmãos ' : 'do Ir∴ ');
  }
  function nomeInstrucao(it) {
    if ((it.grauInstrucao || 'AM') === 'AM' && it.codigo) {
      const x = INSTRUCOES_AM.find((i) => i[0] === it.codigo);
      if (x) return x[1];
    }
    const g = GRAUS[it.grauInstrucao || 'AM'];
    return (it.parte ? it.parte + ' da ' : '') + E.ordinal(it.numero || 1, true) + ' Instrução de ' + g.abrev;
  }
  function convidadoNome(it) {
    const p = it.irmao || {};
    return 'o palestrante convidado ' + (p.nome || '[nome]') + (it.origem ? ', ' + semPonto(it.origem) : '');
  }
  function quemPalestra(it) { return it.convidado ? convidadoNome(it) : 'o ' + pessoa(it.irmao); }
  /* "…, no qual os Irmãos A e B apresentaram seus pontos de vista sobre o tema" */
  function quemOpinou(it) {
    const ps = nomes(it.participantes);
    if (!ps.length) return 'vários Irmãos apresentaram seus pontos de vista';
    if (ps.length === 1) return 'o ' + ps[0] + ' apresentou seu ponto de vista';
    return 'os Irmãos ' + lista(semIr(it.participantes)) + ' apresentaram seus pontos de vista';
  }
  function complemento(it) {
    let t = '';
    if (it.contribuicoes) t += ' ' + maiuscula(ponto(it.contribuicoes));
    if (it.observacao) t += ' ' + maiuscula(ponto(it.observacao));
    return t;
  }

  const DOC_FEM = ['Lei', 'Circular', 'Instrução Normativa', 'Carta', 'Comunicação'];
  const docNome = (d) => (d === 'Prancha' ? 'Ofício' : d);

  /* ---------- Itens da agenda: texto curto (abertura) e narrativa (desenvolvimento) ---------- */
  function agendaTexto(it) {
    switch (it.tipo) {
      case 'instrucao':
        return nomeInstrucao(it) + (nomes(it.irmaos).length ? ' ' + paraIr(it.irmaos) : '');
      case 'trabalho': {
        let t;
        if (it.ordinalTrabalho) t = 'Apresentação do ' + E.ordinal(it.ordinalTrabalho) + ' Trabalho de ' + GRAUS[it.grauTrabalho || 'AM'].abrev + ' do Ir' + T + ' ' + ((it.irmao && it.irmao.nome) || '');
        else t = 'Apresentação de trabalho pelo ' + pessoa(it.irmao);
        if (it.titulo) t += ', intitulado ' + aspas(it.titulo);
        return t;
      }
      case 'palestra':
        return 'Palestra apresentada ' + (it.convidado ? 'por ' + convidadoNome(it) : 'pelo ' + pessoa(it.irmao)) + (it.titulo ? ', sobre o tema ' + aspas(it.titulo) : '');
      case 'debate':
        return 'Debate' + (it.titulo ? ' sobre ' + semPonto(it.titulo) : '');
      case 'orientacoes':
        return (NATUREZA_ORIENT.find((x) => x[0] === (it.natureza || 'orientacoes')) || NATUREZA_ORIENT[0])[1] + (it.titulo ? ' sobre ' + semPonto(it.titulo) : '');
      case 'leitura_proposta': {
        const c = cand(it.candidatos);
        return E.ordinal(it.leitura || 1, true) + ' leitura ' + (c.length > 1 ? 'das petições' : 'da petição') + ' de ' + (it.processo || 'Iniciação') + (c.length ? ' ' + peticionario(it.processo, c.length) + lista(c) : '');
      }
      case 'sindicancia': {
        const c = cand(it.candidatos);
        return (it.fase === 'parecer' ? 'Parecer da comissão de sindicância' : 'Designação de comissão de sindicância') + ' sobre ' + (c.length > 1 ? 'as petições' : 'a petição') + ' de ' + (it.processo || 'Iniciação') + (c.length ? ' ' + peticionario(it.processo, c.length) + lista(c) : '');
      }
      case 'escrutinio': {
        const c = cand(it.candidatos);
        return 'Escrutínio ' + (c.length > 1 ? 'das petições' : 'da petição') + ' de ' + (it.processo || 'Iniciação') + (c.length ? ' ' + peticionario(it.processo, c.length) + lista(c) : '');
      }
      case 'cerimonia': {
        const c = CERIMONIAS[it.cerimonia || 'Iniciação'];
        const ps = (it.cerimonia || 'Iniciação') === 'Iniciação' ? cand(it.pessoas) : it.pessoas;
        return (it.parte ? it.parte + ' da ' : '') + c.agenda(ps);
      }
      case 'cobertura_altar':
        return 'Comunicação do passamento do ' + pessoa(it.irmao) + ' e Cobertura do Altar';
      case 'entrega_identidade':
        return 'Entrega de identidades maçônicas';
      case 'prestacao_contas':
        return 'Prestação de contas da Loja' + (it.periodo ? ' referente ' + semPonto(it.periodo) : '') + (it.irmao && it.irmao.nome ? ', apresentada pelo ' + pessoa(it.irmao) : '');
      case 'leitura_documento': {
        const doc = docNome(it.documento || 'Decreto');
        return 'Leitura ' + (DOC_FEM.includes(doc) ? 'da ' : 'do ') + doc + (it.numeroDoc ? ' nº ' + it.numeroDoc : '') + (it.origem ? ', ' + semPonto(it.origem) : '');
      }
      case 'reuniao_administrativa':
        return 'Assuntos administrativos' + ((it.assuntos || []).filter(Boolean).length ? ': ' + it.assuntos.filter(Boolean).map((a, i) => String.fromCharCode(97 + i) + ') ' + semPonto(a)).join('; ') : '');
      case 'votacao':
        return 'Votação sobre ' + semPonto(it.assunto || 'assunto da Loja');
      case 'eleicao':
        return 'Eleição da Administração ' + (it.administracao || '');
      case 'instalacao': {
        const m = it.modalidade || 'ambas';
        if (m === 'investidura') return 'Investidura do Mestre Eleito da Administração ' + (it.administracao || '');
        if (m === 'posse') return 'Instalação e Posse dos Oficiais da Administração ' + (it.administracao || '');
        return 'Investidura do Mestre Eleito e Instalação e Posse dos Oficiais da Administração ' + (it.administracao || '');
      }
      default:
        return semPonto(it.texto || '');
    }
  }

  function narrativa(it) {
    switch (it.tipo) {
      case 'instrucao': {
        if (!nomes(it.irmaos).length && !it.observacao) return '';
        const am = (it.grauInstrucao || 'AM') === 'AM';
        let t = 'Foi ministrada a ' + nomeInstrucao(it) + (nomes(it.irmaos).length ? ' ' + aoIr(it.irmaos) : '');
        if (it.ministrante && it.ministrante.nome) t += ', pelo ' + pessoa(it.ministrante) + ', por designação do ' + VM;
        if (am && ['1-I', '1-II'].includes(it.codigo)) t += ', sob a forma de perguntas e respostas';
        t += '.';
        if (am && it.codigo === '2-II') t += ' Com ela foram concluídas as instruções obrigatórias do 1º Grau da Maçonaria.';
        if (it.observacao) t += ' ' + maiuscula(ponto(it.observacao));
        return t;
      }
      case 'trabalho': {
        let t = '';
        const desc = momentoDe(it) === 'descanso';
        if (it.irmao && it.irmao.nome) {
          t = 'O ' + pessoa(it.irmao) + ' apresentou' + (it.slides ? ', com o apoio de slides,' : '') + ' ' +
            (it.ordinalTrabalho ? 'o seu ' + E.ordinal(it.ordinalTrabalho) + ' Trabalho de ' + GRAUS[it.grauTrabalho || 'AM'].abrev : 'um trabalho') +
            (it.titulo ? (desc ? ' sobre ' + semPonto(it.titulo) : ', intitulado ' + aspas(it.titulo)) : '');
          t += it.debate ? ' e conduziu um debate, no qual ' + quemOpinou(it) + (it.titulo ? ' sobre o tema' : '') + '.' : '.';
        } else if (it.debate) t = 'Realizou-se um debate, no qual ' + quemOpinou(it) + '.';
        if (it.orientador && it.orientador.nome) t += (t ? ' ' : '') + 'O trabalho foi elaborado sob a orientação do ' + pessoa(it.orientador) + ', designado pelo ' + VM + '.';
        return (t + complemento(it)).trim();
      }
      case 'palestra': {
        if (!(it.irmao && it.irmao.nome) && !it.titulo) return complemento(it).trim();
        let t = maiuscula(quemPalestra(it)) + ' proferiu palestra' + (it.slides ? ', com o apoio de slides,' : '') + (it.titulo ? ' sobre ' + semPonto(it.titulo) : '');
        t += it.debate ? ', seguida de debate, no qual ' + quemOpinou(it) + '.' : '.';
        return (t + complemento(it)).trim();
      }
      case 'debate': {
        const c = it.irmao && it.irmao.nome ? ', conduzido pelo ' + pessoa(it.irmao) + ',' : '';
        const t = 'Realizou-se um debate' + (it.titulo ? ' sobre ' + semPonto(it.titulo) : '') + c + ' no qual ' + quemOpinou(it) + '.';
        return (t.replace(',, no', ', no') + complemento(it)).trim();
      }
      case 'orientacoes': {
        const verbo = { orientacoes: 'transmitiu orientações gerais aos Irmãos', treinamento: 'conduziu um treinamento com os Irmãos', avisos: 'transmitiu avisos e informes aos Irmãos', ritualistica: 'transmitiu aos Irmãos orientações sobre a ritualística' }[it.natureza || 'orientacoes'];
        const quem = nomes(it.irmaos);
        let t = quem.length > 1 ? 'Os Irmãos ' + lista(semIr(it.irmaos)) + ' ' + verbo.replace('transmitiu', 'transmitiram').replace('conduziu', 'conduziram')
          : quem.length ? 'O ' + quem[0] + ' ' + verbo
          : ({ orientacoes: 'Foram transmitidas orientações gerais aos Irmãos', treinamento: 'Foi realizado um treinamento com os Irmãos', avisos: 'Foram transmitidos avisos e informes aos Irmãos', ritualistica: 'Foram transmitidas aos Irmãos orientações sobre a ritualística' }[it.natureza || 'orientacoes']);
        t += (it.titulo ? ' sobre ' + semPonto(it.titulo) : '') + (it.debate ? ', seguindo-se um debate, no qual ' + quemOpinou(it) : '') + '.';
        return (t + complemento(it)).trim();
      }
      case 'leitura_proposta': {
        const c = cand(it.candidatos);
        if (!c.length) return '';
        let t = 'Foi realizada a ' + E.ordinal(it.leitura || 1, true) + ' leitura ' + (c.length > 1 ? 'das petições' : 'da petição') + ' de ' + (it.processo || 'Iniciação').toLowerCase() + ' ' + peticionario(it.processo, c.length) + lista(c) +
          (it.proponente && it.proponente.nome ? ', ' + (c.length > 1 ? 'propostos' : 'proposto') + ' pelo ' + pessoa(it.proponente) : '') + ', de um total de três leituras anteriores ao escrutínio.';
        if (it.objecao === 'com') t += ' Houve manifestação de objeção, que ficou sob a apreciação do ' + VM + '.';
        else t += ' Consultados os Irmãos, não houve objeção.';
        return t;
      }
      case 'sindicancia': {
        const c = cand(it.candidatos);
        const quem = peticionario(it.processo, c.length) + lista(c);
        const com = semIr(it.comissao);
        const peti = (c.length > 1 ? 'as petições' : 'a petição') + ' de ' + (it.processo || 'Iniciação').toLowerCase() + ' ' + quem;
        if (it.fase === 'parecer') return 'A comissão designada para examinar ' + peti + (com.length ? ', composta pelos Irmãos ' + lista(com) + ',' : '') + ' apresentou parecer ' + (it.parecer === 'contrario' ? 'contrário' : 'favorável') + '.';
        return 'O ' + VM + ' designou ' + (com.length ? 'os Irmãos ' + lista(com) + ' para comporem a comissão incumbida' : 'comissão incumbida') + ' de examinar ' + peti + ', nos termos do Regulamento Geral da Grande Loja.';
      }
      case 'escrutinio': {
        const proc = (it.processo || 'Iniciação').toLowerCase();
        const cs = (it.candidatos || []).filter((c) => c.nome);
        if (!cs.length) return '';
        let t = 'O Ir∴ 1º Diácono preparou a votação e apresentou a caixa de votação ao Sul, ao Oeste e ao Leste, ' +
          (it.devidaForma ? 'votando os Irmãos na devida forma' : 'procedendo os Irmãos à votação') + ' com esferas brancas e pretas.';
        // agrupa os peticionários com o mesmo parecer e o mesmo resultado
        const grupos = [];
        cs.forEach((c) => {
          const k = (c.resultado || 'aprovado') + '|' + (c.parecer === 'contrario' ? 'contrario' : 'favoravel');
          let g = grupos.find((x) => x.k === k);
          if (!g) { g = { k, resultado: c.resultado || 'aprovado', parecer: c.parecer === 'contrario' ? 'contrário' : 'favorável', nomes: [] }; grupos.push(g); }
          g.nomes.push(c.nome.toUpperCase());
        });
        grupos.forEach((g) => {
          const pl = g.nomes.length > 1;
          const quem = (proc === 'iniciação' ? (pl ? 'dos Senhores ' : 'do Senhor ') : (pl ? 'dos Irmãos ' : 'do Ir∴ ')) + lista(g.nomes);
          const base = ' No escrutínio ' + (pl ? 'das petições' : 'da petição') + ' de ' + proc + ' ' + quem + ', ' + (pl ? 'que receberam' : 'que recebeu') + ' parecer ' + g.parecer + ' da comissão designada para examiná-' + (pl ? 'las' : 'la') + ',';
          if (g.resultado === 'rejeitado') t += base + (pl ? ' as votações mostraram-se nubladas,' : ' a votação mostrou-se nublada,') + ' tendo o ' + VM + ' declarado ' + (pl ? 'rejeitadas as petições' : 'rejeitada a petição') + ' e determinado ao Ir∴ Secretário que informasse o resultado ' + (pl ? 'aos peticionários' : 'ao peticionário') + '.';
          else if (g.resultado === 'novo') t += base + ' o ' + VM + ', no uso de sua prerrogativa, anulou ' + (pl ? 'as votações, que deverão ser repetidas.' : 'a votação, que deverá ser repetida.');
          else t += base + (pl ? ' as votações mostraram-se claras' : ' a votação mostrou-se clara') + ' no Sul, no Oeste e no Leste, tendo o ' + VM + ' declarado ' + (pl ? 'aprovadas as petições' : 'aprovada a petição') + ' e determinado ao Ir∴ Secretário que informasse o resultado ' + (pl ? 'aos peticionários' : 'ao peticionário') + '.';
        });
        return t;
      }
      case 'cerimonia': {
        const nome = it.cerimonia || 'Iniciação';
        const c = CERIMONIAS[nome];
        const ps = nome === 'Iniciação' ? cand(it.pessoas) : it.pessoas;
        if (!(nome === 'Iniciação' ? ps.length : nomes(ps).length)) return '';
        let t = c.narr(ps, it);
        if (it.parte) t = t.replace(/^Foi realizada a Cerimônia/, 'Foi realizada a ' + it.parte.toLowerCase() + ' da Cerimônia');
        if (it.observacao) t += ' ' + maiuscula(ponto(it.observacao));
        return t;
      }
      case 'cobertura_altar': {
        const p = it.irmao || {};
        const datas = [['iniciado em', it.iniciado], ['passado em', it.passado], ['elevado em', it.elevado], ['instalado em', it.instalado]]
          .filter((x) => x[1]).map((x) => x[0] + ' ' + E.dataCurta(x[1]));
        let t = 'O ' + VM + ' cumpriu o doloroso dever de anunciar o passamento do ' + pessoa(p) + (it.falecimento ? ', ocorrido em ' + E.dataCurta(it.falecimento) : '') +
          (datas.length ? ', que foi ' + lista(datas) : '') + (it.membroHa ? ', membro da Loja há ' + semPonto(it.membroHa) : '') + '.';
        if (it.despedidaData || it.despedidaLocal) t += ' A Despedida Maçônica ocorreu' + (it.despedidaData ? ' no dia ' + E.dataCurta(it.despedidaData) : '') + (it.despedidaLocal ? ', ' + semPonto(it.despedidaLocal) : '') + '.';
        if (it.cobrir !== false) t += ' Por ordem do ' + VM + ', o Ir∴ 1º Diácono, auxiliado pelos Irmãos Mestres de Cerimônias, providenciou a cobertura do Altar, que assim permanecerá pelo período de ' + E.numero(Number(it.dias) || 30) + ' dias.';
        t += ' Em seguida, o Ir∴ Capelão proferiu a oração, estando todos sob o Sinal de Fidelidade.';
        return t;
      }
      case 'entrega_identidade':
        return (it.entregas || []).filter((e) => e.recebe && e.recebe.nome).map((e) => {
          const g = GRAUS[e.grau] ? ' de ' + GRAUS[e.grau].abrev : '';
          if (e.entrega && e.entrega.nome) return 'O ' + VM + ' convidou o ' + pessoa(e.entrega) + ' a entregar ao ' + pessoa(e.recebe) + ' sua identidade maçônica' + g + '.';
          return 'Foi entregue ao ' + pessoa(e.recebe) + ' sua identidade maçônica' + g + '.';
        }).join(' ');
      case 'prestacao_contas': {
        const quem = it.irmao && it.irmao.nome ? 'O ' + pessoa(it.irmao) + ' apresentou' : 'Foi apresentada';
        let t = quem + ' a prestação de contas da Loja' + (it.periodo ? ' referente ' + semPonto(it.periodo) : '') + (it.slides ? ', com o apoio de slides' : '');
        if (it.resultado === 'informativa') t += ', para conhecimento dos Irmãos';
        else if (it.resultado === 'ressalva') t += ', com as seguintes ressalvas: ' + semPonto(it.ressalva);
        else t += ', que foi aprovada, sem contestação ou ressalva por parte dos presentes';
        t += it.debate ? ', esclarecendo as dúvidas apresentadas' + (nomes(it.participantes).length ? ' pelos Irmãos ' + lista(semIr(it.participantes)) : '') + '.' : '.';
        return (t + complemento(it)).trim();
      }
      case 'reuniao_administrativa': {
        const as = (it.assuntos || []).filter((a) => a && a.trim());
        let t = as.length ? 'Foram tratados os seguintes assuntos administrativos: ' + as.map((a, i) => String.fromCharCode(97 + i) + ') ' + semPonto(a)).join('; ') + '.' : '';
        if (it.debate) t += (t ? ' ' : '') + 'Sobre eles, ' + quemOpinou(it) + '.';
        return (t + complemento(it)).trim();
      }
      case 'leitura_documento': {
        const doc = docNome(it.documento || 'Decreto');
        let t = '';
        if (['Decreto', 'Lei', 'Ato'].includes(doc)) t = (DOC_FEM.includes(doc) ? 'A ' : 'O ') + doc + ' foi ' + (DOC_FEM.includes(doc) ? 'lida' : 'lido') + ' estando os Irmãos sob o Sinal de Fidelidade.';
        if (it.resumo) t += (t ? ' ' : '') + maiuscula(ponto(it.resumo));
        return t;
      }
      case 'eleicao': {
        const forma = { unanimidade: 'por unanimidade', maioria: 'pela maioria dos votos' }[it.forma] || 'por unanimidade';
        const ELETIVOS = ['venerável mestre', '1º vigilante', '2º vigilante', 'tesoureiro', 'secretário'];
        const validos = (it.cargos || []).filter((c) => c.cargo && c.pessoa && c.pessoa.nome);
        const eh = (c) => ELETIVOS.includes(c.cargo.trim().toLowerCase());
        const eleitos = validos.filter(eh).map((c) => c.cargo + ', ' + pessoa(c.pessoa));
        const nomeados = validos.filter((c) => !eh(c)).map((c) => c.cargo + ', ' + pessoa(c.pessoa));
        let t = 'Procedeu-se à eleição da Administração ' + (it.administracao || '') + ', votando os Mestres Maçons do quadro da Loja, sendo ' + (eleitos.length ? 'eleitos, ' + forma + ', para os cargos eletivos: ' + eleitos.join('; ') : 'eleita, ' + forma + ', a nova Administração') + '.';
        if (nomeados.length) t += ' Para os demais cargos, o Venerável Mestre eleito indicou: ' + nomeados.join('; ') + '.';
        if (it.posse) t += ' A Instalação e Posse ficou marcada para ' + E.dataCurta(it.posse) + '.';
        return t;
      }
      case 'instalacao': {
        const m = it.modalidade || 'ambas';
        const vm = it.vm && it.vm.nome ? pessoa(it.vm) : '[nome]';
        const instPor = it.instalador && it.instalador.nome ? ', pelo ' + pessoa(it.instalador) + ',' : '';
        const adm = it.administracao || '';
        const inv = 'Foi realizada, em sessão restrita aos Mestres Instalados, a Investidura do Mestre Eleito, sendo investido' + instPor + ' no cargo de Venerável Mestre o ' + vm + ', conforme o Ritual Especial.';
        const pos = 'Foi realizada, em sessão pública, a Instalação e Posse dos Oficiais da Administração ' + adm + ', sendo empossados o Venerável Mestre ' + vm + ' e os demais Oficiais' + (it.instalador && it.instalador.nome && m === 'posse' ? ', pelo ' + pessoa(it.instalador) : '') + ', conforme o Ritual Especial.';
        let t = m === 'investidura' ? inv : m === 'posse' ? pos : inv + ' ' + pos;
        if (it.observacao) t += ' ' + maiuscula(ponto(it.observacao));
        return t;
      }
      case 'votacao': {
        const r = { unanimidade: 'foi aprovada por unanimidade', maioria: 'foi aprovada pela maioria dos presentes', rejeitada: 'foi rejeitada' }[it.resultadoTipo || ''];
        return 'Posta em votação a moção sobre ' + semPonto(it.assunto || 'o assunto') + ', manifestando-se os Irmãos pelo sinal de votação, com a mão esquerda levantada, ' +
          (it.resultadoVotacao ? semPonto(it.resultadoVotacao) : (r || 'foi aprovada pela maioria dos presentes')) + '.';
      }
      default:
        return it.observacao ? maiuscula(ponto(it.observacao)) : '';
    }
  }

  /* ---------- Ocorrências ---------- */
  const TIPOS_OCORRENCIA = [
    ['descanso', 'Chamada do trabalho para o descanso'],
    ['ingresso', 'Pedido de ingresso (retardatário)'],
    ['saida', 'Saída antecipada'],
    ['mudanca_grau', 'Mudança de Grau (suspensão do trabalho)'],
    ['retirada_aprendizes', 'Retirada dos Aprendizes'],
    ['purgacao', 'Purgação da Loja'],
    ['grao_mestre', 'Ingresso do Grão-Mestre ou Adjunto'],
    ['grandes_honras', 'Grandes Honras'],
    ['exame_visitante', 'Visitante examinado por comissão'],
    ['outro', 'Outra ocorrência']
  ];

  function ocorrenciaTexto(o, s) {
    const h = o.hora ? 'Às ' + E.hora(o.hora) + ', ' : '';
    const grauBase = Number((s && s.grau) || 1);
    switch (o.tipo) {
      case 'descanso':
        // o retorno ao trabalho é registrado na parte PERÍODO DE DESCANSO
        return maiuscula(h + 'por ordem do ' + VM + ', o Ir∴ 2º Vigilante chamou os Irmãos do trabalho para o descanso' + (o.motivo ? ', ' + semPonto(o.motivo) : '') + '.');
      case 'ingresso': {
        const v = nomes(o.pessoas);
        if (!v.length) return '';
        return maiuscula(h + 'havendo alarme na porta externa, ' + (v.length > 1 ? 'os Irmãos ' + lista(semIr(o.pessoas)) + ', devidamente paramentados e reconhecidos, solicitaram' : 'o ' + v[0] + ', devidamente paramentado e reconhecido, solicitou') +
          ' ingresso, ' + (v.length > 1 ? 'sendo admitidos' : 'sendo admitido') + ' por ordem do ' + VM + ' e saudando-o junto ao Altar.');
      }
      case 'saida': {
        const v = nomes(o.pessoas);
        if (!v.length) return '';
        return maiuscula(h + (v.length > 1 ? 'os Irmãos ' + lista(semIr(o.pessoas)) + ' retiraram-se' : 'o ' + v[0] + ' retirou-se') + ' da Sala da Loja' + (o.motivo ? ', ' + semPonto(o.motivo) : '') + ', com a devida autorização do ' + VM + '.');
      }
      case 'mudanca_grau': {
        const g = Number(o.grauDestino) || Math.min(grauBase + 1, 3);
        let t = h + 'o ' + VM + ' determinou ao Ir∴ 1º Diácono que retirasse os Irmãos não qualificados para o ' + g + 'º Grau e, renunciando a todos os Sinais e Cerimônias, declarou os trabalhos suspensos no ' + grauBase + 'º Grau e a Loja aberta no ' + g + 'º Grau para trabalho e instrução' + (o.motivo ? ', ' + semPonto(o.motivo) : '') + '.';
        if (o.horaFim) t += ' Às ' + E.hora(o.horaFim) + ', concluída essa parte, os trabalhos foram encerrados no ' + g + 'º Grau e a Loja reaberta no ' + grauBase + 'º Grau, sendo readmitidos os Irmãos que aguardavam.';
        return maiuscula(t);
      }
      case 'retirada_aprendizes':
        return maiuscula(h + 'os Aprendizes Maçons foram retirados da Sala da Loja pelo Ir∴ 1º Diácono' + (o.motivo ? ', ' + semPonto(o.motivo) : '') + ' e, ao final, readmitidos para a continuidade dos trabalhos.');
      case 'purgacao':
        return maiuscula(h + 'por determinação do ' + VM + ', procedeu-se à Purgação da Loja, tendo os Irmãos Diáconos assegurado ao Ir∴ 1º Vigilante, e este ao ' + VM + ', que todos os presentes tinham o direito de ali permanecer.');
      case 'grao_mestre': {
        const quem = o.cargoGM || 'Grão-Mestre';
        const titulo = quem === 'Grão-Mestre' ? 'o Sereníssimo Grão-Mestre' : quem === 'Grão-Mestre Adjunto' ? 'o Grão-Mestre Adjunto' : 'o Representante do Sereníssimo Grão-Mestre';
        const p = (o.pessoas || [])[0];
        let t = h + 'anunciado pelo Ir∴ Marechal, ingressou na Sala da Loja ' + titulo + ' da Grande Loja Maçônica do Estado do Rio Grande do Sul, Respeitabilíssimo Irmão ' + ((p && p.nome) || '[nome]') +
          (o.comitiva ? ', acompanhado de ' + semPonto(o.comitiva) : '') + ', sendo recebido com Grandes Honras.';
        if (o.malhete === 'aceitou') t += ' O ' + VM + ' ofereceu-lhe o malhete, que foi aceito, passando a dirigir os trabalhos.';
        else if (o.malhete !== 'nao') t += ' O ' + VM + ' ofereceu-lhe o malhete, que foi fraternalmente devolvido.';
        return maiuscula(t);
      }
      case 'grandes_honras':
        return maiuscula(h + 'o ' + VM + ' determinou que fossem prestadas Grandes Honras' + (nomes(o.pessoas).length ? ' ' + aoIr(o.pessoas) : '') + (o.motivo ? ', ' + semPonto(o.motivo) : '') + '.');
      case 'exame_visitante': {
        const v = nomes(o.pessoas);
        const quem = v.length ? 'o ' + v[0].replace(/^Ir∴ /, 'Sr. ') : 'um visitante';
        return maiuscula(h + 'não tendo sido possível reconhecer ' + quem + ' como Maçom regular, foi examinado por comissão de dois Irmãos designada para esse fim' +
          (o.resultado === 'retirou' ? ', não apresentando a qualificação necessária, sendo convidado a retirar-se.' : ', sendo considerado qualificado e admitido na Sala da Loja.'));
      }
      default:
        return maiuscula(ponto(h + (o.texto || '')));
    }
  }

  /* ---------- Montagem da ata completa ---------- */
  const TITULO_SESSAO = { 'Ordinária': 'Sessão Econômica', 'Magna': 'Sessão Magna', 'Especial': 'Sessão Especial', 'Pública': 'Sessão Pública' };
  const ABREV_GRAU = { 1: 'A∴M∴', 2: 'C∴M∴', 3: 'M∴M∴' };

  function gerar(s, cfg) {
    cfg = cfg || {};
    const P = [];
    const par = (...runs) => P.push({ runs: runs.filter((r) => r && r.t) });
    // cada parte da ata é separada por uma linha em branco
    const parte = (...runs) => { P.push({ vazio: true, runs: [] }); par(...runs); };
    const n = (t) => ({ t });
    const b = (t) => ({ t, b: true });
    const grau = Number(s.grau || 1);

    // Título: "Ata nº 06 / 2026 – Sessão Econômica A∴M∴"
    const ano = (s.data || '').slice(0, 4);
    const tipoSessao = s.tipoSessao || 'Ordinária';
    let nomeTitulo = tipoSessao === 'Ordinária' && cfg.tituloOrdinaria ? 'Sessão ' + cfg.tituloOrdinaria : TITULO_SESSAO[tipoSessao];
    let sufixo = ' ' + ABREV_GRAU[grau];
    const cer = (s.agenda || []).find((it) => it.tipo === 'cerimonia' && ['Iniciação', 'Passagem', 'Elevação'].includes(it.cerimonia || 'Iniciação'));
    if (tipoSessao === 'Magna' && cer) nomeTitulo = 'Sessão Magna de ' + (cer.cerimonia || 'Iniciação');
    if (tipoSessao === 'Pública' && (s.agenda || []).some((it) => it.tipo === 'instalacao')) { nomeTitulo = 'Sessão Pública de Instalação e Posse'; sufixo = ''; }
    P.push({ titulo: true, runs: [n('Ata nº ' + String(s.numero || '').padStart(2, '0') + (ano ? ' / ' + ano : '') + ' – ' + nomeTitulo + sufixo)] });

    // Separa o que foi tratado em loja, no descanso e depois do descanso
    const ag = s.agenda || [];
    const itLoja = ag.filter((it) => momentoDe(it) === 'loja');
    const itDesc = ag.filter((it) => momentoDe(it) === 'descanso');
    const itApos = ag.filter((it) => momentoDe(it) === 'apos');

    // Abertura
    const d = s.data ? E.dataAbertura(s.data) : { inicio: '[data]', ano: '' };
    const tit = titulares(cfg);
    const mesmo = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
    const vmTitular = !tit.vm || mesmo(tit.vm, s.vm && s.vm.nome);
    const adHoc = (cargo, p) => (tit[cargo] && p && p.nome && !mesmo(tit[cargo], p.nome) ? ' Ad Hoc' : '');
    const agenda = ag.filter(naAgenda).map(agendaTexto).filter(Boolean);
    const tipo = { 'Ordinária': 'Sessão Ordinária', 'Magna': 'Sessão Magna', 'Especial': 'sessão especialmente convocada', 'Pública': 'Sessão Pública' }[tipoSessao];
    const local = String(cfg.local || '').replace(/Sala de Loja/g, 'Sala da Loja');
    const registro = semPonto(cfg.registroPresenca || 'no Livro de Presenças da Loja');
    par(
      b(d.inicio), n(' '), b(d.ano), n(', '), { t: 'Era Vulgar', b: true, i: true },
      n(', os Irmãos da ' + cfg.lojaNome + ', jurisdicionada à ' + cfg.potencia + ', reuniram-se em ' + tipo + ', ' + semPonto(local) + ', conforme registro ' + registro + ', tendo na Estação do Leste, ' + (vmTitular ? 'como Venerável Mestre, o Irmão ' : 'como Venerável Mestre em exercício, o Irmão ')),
      b(nomeOficial(s.vm)), n(', na Estação do Oeste, como 1º Vigilante' + adHoc('v1', s.v1) + ', o Irmão '), b(nomeOficial(s.v1)), n(', e na Estação do Sul, como 2º Vigilante' + adHoc('v2', s.v2) + ', o Irmão '), b(nomeOficial(s.v2)), n('.')
    );
    const hAb = E.hora(s.horaAbertura) || '[hora]';
    const abertura = cfg.aberturaRitual !== false
      ? 'Cumpridas todas as formalidades ritualísticas, com a Loja devidamente coberta e a Palavra de ' + GRAU_SESSAO[grau] + ' recebida dos Irmãos presentes pelos Irmãos Diáconos, às ' + hAb + ' a Loja foi aberta no ' + grau + 'º Grau da Maçonaria'
      : 'Às ' + hAb + ', a Loja foi aberta no ' + grau + 'º Grau da Maçonaria';
    const vis = (s.visitantes || []).filter((v) => v.nome);
    const leste = vis.filter((v) => v.leste);
    par(
      n(abertura + ', para tratar dos assuntos que regular e constitucionalmente se apresentassem, com a seguinte '),
      b('Agenda do Dia:'),
      n((agenda.length ? ' ' + agenda.map((a, i) => (i + 1) + ') ' + a).join('; ') + '.' : ' sem matérias específicas.') +
        (leste.length ? ' O ' + VM + ' convidou a tomar assento no Leste ' + (leste.length === 1 ? 'o ' + pessoa(leste[0]) : 'os Irmãos ' + lista(semIr(leste))) + '.' : ''))
    );

    // Ata da última reunião
    if (cfg.registrarAtaAnterior !== false && s.ataAnterior && s.ataAnterior.status && s.ataAnterior.status !== 'nao_registrar') {
      const a = s.ataAnterior; const num = a.numero ? 'nº ' + String(a.numero).padStart(2, '0') + (a.ano && String(a.ano) !== ano ? ' / ' + a.ano : '') + ' ' : '';
      let t;
      if (a.status === 'aprovada') t = 'Por ordem do ' + VM + ', o Ir∴ Secretário fez a leitura da Ata ' + num + 'da última reunião, que, não havendo manifestação, foi declarada aprovada.';
      else if (a.status === 'conhecimento' || a.status === 'dispensada') t = 'O ' + VM + ' perguntou aos Irmãos se todos estavam de acordo com a Ata ' + num + 'da última reunião, previamente disponibilizada ' + semPonto(a.meio || 'digitalmente') + ' para leitura, a qual, não havendo manifestação, foi declarada aprovada.';
      else if (a.status === 'aprovada_correcao') t = 'Por ordem do ' + VM + ', o Ir∴ Secretário deu conhecimento da Ata ' + num + 'da última reunião, que, submetida à votação a seguinte observação: ' + semPonto(a.correcao) + ', foi declarada aprovada com a correção feita.';
      else t = 'A Ata ' + num + 'da última reunião não foi apreciada nesta sessão, ficando para a próxima.';
      parte(b('ATA DA ÚLTIMA REUNIÃO:'), n(' ' + t));
    }
    // Correspondência, atos e decretos
    if (cfg.registrarExpediente !== false) {
      const ex = (s.expediente || []).filter((e) => e.descricao);
      const t = ex.length ? 'O Ir∴ Secretário deu conhecimento à Loja da seguinte correspondência, atos e decretos: ' + ex.map((e) => (e.tipo ? docNome(e.tipo) + ' ' : '') + semPonto(e.descricao)).join('; ') + '.' : 'Não houve correspondência, atos ou decretos a dar conhecimento.';
      parte(b('CORRESPONDÊNCIA, ATOS E DECRETOS:'), n(' ' + t));
    }

    // Desenvolvimento dos trabalhos (em loja) e ocorrências
    const ordem = (s.ocorrencias || []).slice().sort((x, y) => (x.hora || '99').localeCompare(y.hora || '99'));
    const desc = ordem.find((o) => o.tipo === 'descanso');
    const temDescanso = !!(desc || itDesc.length || itApos.length);
    const retorno = desc && desc.horaFim;
    // ocorrências depois da volta do descanso entram na parte do descanso
    const depois = (o) => retorno && o !== desc && o.hora && o.hora >= retorno;
    const ocsAntes = ordem.filter((o) => !depois(o)).map((o) => ocorrenciaTexto(o, s)).filter(Boolean);
    const ocsDepois = ordem.filter(depois).map((o) => ocorrenciaTexto(o, s)).filter(Boolean);
    const narrs = itLoja.map(narrativa).filter(Boolean);
    let dev = 'Os trabalhos transcorreram com regularidade e harmonia.';
    if (narrs.length) dev += ' Cumprindo a Agenda do Dia, ' + narrs.map((x, i) => i === 0 ? minuscula(x) : x).join(' ');
    if (ocsAntes.length) dev += ' ' + ocsAntes.join(' ');
    if (temDescanso && !desc) dev += ' Por ordem do ' + VM + ', o Ir∴ 2º Vigilante chamou os Irmãos do trabalho para o descanso.';
    parte(b('DESENVOLVIMENTO DOS TRABALHOS:'), n(' ' + dev));

    // Período de descanso (informal): apresentações, debates, palestras, contas, orientações
    if (temDescanso) {
      const nd = itDesc.map(narrativa).filter(Boolean);
      let t = nd.length ? 'Durante o período de descanso, ' + nd.map((x, i) => i === 0 ? minuscula(x) : x).join(' ') : '';
      if (desc && desc.resumo) t += (t ? ' ' : '') + maiuscula(ponto(desc.resumo));
      if (!t) t = 'O período de descanso transcorreu em fraterno convívio entre os Irmãos.';
      t += ' ' + (retorno ? 'Às ' + E.hora(retorno) + ', os' : 'Em seguida, os') + ' Irmãos foram chamados do descanso para o trabalho, ao som do malhete no Leste.';
      const na = itApos.map(narrativa).filter(Boolean);
      if (na.length) t += ' Retomados os trabalhos, ' + na.map((x, i) => i === 0 ? minuscula(x) : x).join(' ');
      if (ocsDepois.length) t += ' ' + ocsDepois.join(' ');
      parte(b('PERÍODO DE DESCANSO:'), n(' ' + t));
    }

    // Presença
    const pres = contarPresenca(s);
    let tp = 'A sessão contou com a presença de ' + (pres.total ? E.numero(pres.total) : '[informar o número de]') + (pres.total === 1 ? ' Irmão do quadro da Loja' : ' Irmãos do quadro da Loja');
    const partes = ['MI', 'MM', 'CM', 'AM'].filter((g) => pres[g]).map((g) => E.numero(pres[g]) + ' ' + GRAUS[g].abrev);
    if (partes.length && pres.total) tp += ', sendo ' + lista(partes);
    tp += '.';
    if (vis.length) {
      tp += ' Houve ainda a presença de ' + (vis.length === 1 ? 'um Irmão visitante: ' : E.numero(vis.length) + ' Irmãos visitantes: ') +
        vis.map((v) => pessoa(v) + (v.cargo ? ', ' + semPonto(v.cargo) : '') + (v.loja ? ', da ' + semPonto(v.loja) : '')).join('; ') +
        (vis.length === 1 ? ', devidamente registrado' : ', devidamente registrados') + ' no Livro de Visitantes da Loja.';
    } else tp += ' Não houve Irmãos visitantes.';
    parte(b('PRESENÇA DOS OBREIROS DA LOJA E VISITANTES:'), n(' ' + tp));

    // Doença e Aflição
    const nada = 'Consultados o Ir∴ 1º Vigilante, no Oeste, o Ir∴ 2º Vigilante, no Sul, e os Irmãos presentes, nada houve a relatar.';
    const da = (s.doenca || []).filter((x) => (x.quem && x.quem.nome) || x.porQuem);
    parte(b('DOENÇA E AFLIÇÃO:'), n(' ' + (da.length ? da.map((x) => {
      const quem = x.quem && x.quem.nome ? 'o ' + pessoa(x.quem) : '';
      return maiuscula((quem ? quem + ' pediu' : 'foram pedidas') + ' as orações e a solidariedade dos Irmãos ' + semPonto(x.porQuem) + (x.detalhe ? ', ' + semPonto(x.detalhe) : '') + '.');
    }).join(' ') : nada)));

    // Boas Novas
    const bn = (s.boasNovas || []).filter((x) => x.texto && x.texto.trim());
    parte(b('BOAS NOVAS:'), n(' ' + (bn.length ? bn.map((x) => (x.quem && x.quem.nome
      ? 'O ' + pessoa(x.quem) + ' compartilhou com a Loja ' + ponto(x.texto)
      : 'Foi compartilhada com a Loja a boa nova d' + (/^[oa]s? /.test(x.texto.trim()) ? '' : 'e ') + ponto(x.texto))).join(' ') : nada)));

    // Conclusão da Reunião (assuntos trazidos perante a Loja antes do fechamento)
    const pa = (s.palavraAberta || []).filter((x) => x.quem && x.quem.nome && x.texto);
    const aus = nomes(s.ausencias || []);
    let tc = 'Consultados o Ir∴ 1º Vigilante, no Oeste, o Ir∴ 2º Vigilante, no Sul, e os Irmãos presentes sobre assuntos a trazer perante a Loja antes do fechamento, ';
    tc += pa.length
      ? (pa.length > 1 ? 'houve as seguintes manifestações: ' : 'houve a seguinte manifestação: ') + pa.map((x, i) => (i + 1) + ') o ' + pessoa(x.quem) + (x.quem.loja ? ', da ' + semPonto(x.quem.loja) + ',' : '') + ' ' + semPonto(x.texto)).join('; ') + '.'
      : 'não houve manifestações.';
    if (aus.length) tc += ' ' + (aus.length > 1 ? 'Foram justificadas as ausências dos Irmãos ' + lista(semIr(s.ausencias)) : 'Foi justificada a ausência do ' + aus[0]) + '.';
    parte(b('CONCLUSÃO DA REUNIÃO:'), n(' ' + tc));

    // Palavra de autoridades
    (s.palavraAutoridade || []).filter((x) => x.quem && x.quem.nome).forEach((x) => {
      parte(b('PALAVRA DO ' + (x.cargo || 'IRMÃO VISITANTE').toUpperCase() + ':'), n(' O ' + pessoa(x.quem) + (x.cargo ? ', ' + semPonto(x.cargo) + ',' : '') + ' ' + ponto(x.texto || 'saudou os Irmãos presentes')));
    });

    // Palavra do VM
    const pv = s.palavraVM || {};
    const acoes = [];
    if (pv.agradeceuPresenca !== false) acoes.push('agradeceu a presença de todos os Irmãos');
    if (pv.agradeceuVisitantes && vis.length) acoes.push('agradeceu nominalmente ' + (vis.length === 1 ? 'ao Irmão visitante' : 'aos Irmãos visitantes') + ' pela presença');
    if (pv.proximaSessao) acoes.push('lembrou ' + semPonto(pv.proximaSessao));
    if (pv.texto) acoes.push(semPonto(pv.texto));
    if (pv.agape) acoes.push('convidou os Irmãos para participarem e desfrutarem do ágape');
    parte(b('PALAVRA DO ' + VM + ':'), n(' ' + (acoes.length ? 'O ' + VM + ' ' + lista(acoes) + '.' : 'O ' + VM + ' agradeceu a presença de todos.')));

    // Fechamento
    const sec = s.secretario || {};
    const hf = E.hora(s.horaEncerramento) || '[hora]';
    const fech = cfg.fechamentoRitual !== false
      ? 'Nada mais havendo a trazer perante a Loja, o ' + VM + ' procedeu ao fechamento conforme o Ritual e declarou a Loja devidamente fechada às ' + hf + ', assim permanecendo até a próxima sessão ordinária, a menos que ocorra antes sessão extraordinária, especialmente convocada, em cuja emergência a devida notificação será dada em tempo hábil.'
      : 'Nada mais havendo a trazer perante a Loja, o ' + VM + ' declarou a Loja devidamente fechada às ' + hf + '.';
    const grauSec = GRAUS[sec.grau] ? GRAUS[sec.grau].nome + ', ' : '';
    parte(b('FECHAMENTO:'), n(' ' + fech + ' Para constar, eu, ' + (sec.nome || '[secretário]') + ', ' + grauSec + funcaoSecretario(s, cfg) +
      ', fazendo um justo registro de tudo o que é apropriado para ser escrito, lavrei a presente Ata, que, depois de lida e achada conforme, vai assinada pelo ' + VM + ' ' + ((s.vm && s.vm.nome) || '') + ' e por mim.'));

    // assinaturas no estilo posto e graduação: "NOME - CM"
    const assina = (p) => ((p && p.nome) || '').toUpperCase() + (p && GRAUS[p.grau] ? '\u00a0-\u00a0' + GRAUS[p.grau].abrev : '');
    const ata = { paragrafos: P, assinatura: { vm: assina(s.vm), sec: assina(sec), funcao: funcaoSecretario(s, cfg) } };
    if (cfg.abrevPontos === false) semPontos(ata);
    return ata;
  }

  /* Abreviações sem os três pontos, como no Ritual (VM, Ir., AM, CM, MM, MI) */
  function semPontos(ata) {
    ata.paragrafos.forEach((p) => p.runs.forEach((r) => {
      r.t = r.t.replace(/Ir∴/g, 'Ir.').replace(/∴/g, '');
    }));
    ata.assinatura.vm = ata.assinatura.vm.replace(/∴/g, '');
    ata.assinatura.sec = ata.assinatura.sec.replace(/∴/g, '');
  }

  function nomeOficial(p) {
    if (!p || !p.nome) return '[nome]';
    const g = GRAUS[p.grau];
    return (g ? g.abrev + ' ' : '') + p.nome.toUpperCase();
  }
  /* Titulares dos cargos na data da sessão (o app calcula pela nominata vigente) */
  function titulares(cfg) {
    const t = (cfg && cfg.titulares) || {};
    return { vm: t.vm || (cfg && cfg.vm) || '', v1: t.v1 || (cfg && cfg.v1) || '', v2: t.v2 || (cfg && cfg.v2) || '', secretario: t.secretario || (cfg && cfg.secretario) || '' };
  }
  /* Quem não é o titular do cargo na administração da data da sessão é Ad Hoc */
  function funcaoSecretario(s, cfg) {
    const tit = titulares(cfg).secretario;
    const nome = (s.secretario && s.secretario.nome) || '';
    const adhoc = tit && nome ? tit.trim().toLowerCase() !== nome.trim().toLowerCase() : !!s.adhoc;
    return adhoc ? 'Secretário Ad Hoc' : 'Secretário';
  }

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
    (s.aCompletar || []).filter((x) => !x.feito).forEach((x) => av.push('A completar: ' + x.texto));
    if (!s.data) av.push('Informe a data da sessão.');
    if (!s.horaAbertura) av.push('Informe a hora de abertura.');
    if (!s.horaEncerramento) av.push('Informe a hora do fechamento.');
    if (s.horaAbertura && s.horaEncerramento && s.horaEncerramento <= s.horaAbertura) av.push('A hora do fechamento está antes da abertura.');
    (s.ocorrencias || []).forEach((o) => {
      if (o.hora && s.horaAbertura && o.hora < s.horaAbertura) av.push('Há uma ocorrência às ' + o.hora + ', antes da abertura (' + s.horaAbertura + ').');
      if (o.hora && s.horaEncerramento && o.hora > s.horaEncerramento) av.push('Há uma ocorrência às ' + o.hora + ', depois do fechamento.');
      if ((o.tipo === 'descanso' || o.tipo === 'mudanca_grau') && o.hora && o.horaFim && o.horaFim <= o.hora) av.push('Um retorno aos trabalhos está antes do seu início.');
    });
    ['vm', 'v1', 'v2', 'secretario'].forEach((k) => { if (!s[k] || !s[k].nome) av.push('Falta o nome do ' + { vm: 'Venerável Mestre (Estação do Leste)', v1: '1º Vigilante (Estação do Oeste)', v2: '2º Vigilante (Estação do Sul)', secretario: 'Secretário' }[k] + '.'); });
    if (!(s.agenda || []).length) av.push('A Agenda do Dia está vazia.');
    if ((s.agenda || []).some((it) => momentoDe(it) !== 'loja') && !(s.ocorrencias || []).some((o) => o.tipo === 'descanso')) av.push('Há assunto tratado no descanso, mas falta registrar em Ocorrências a chamada para o descanso, com os horários.');
    if (!contarPresenca(s).total) av.push('Nenhum Irmão do quadro foi marcado como presente.');
    if ((s.agenda || []).some((it) => it.tipo === 'cerimonia' && ['Iniciação', 'Passagem', 'Elevação'].includes(it.cerimonia || 'Iniciação')) && (s.tipoSessao || 'Ordinária') !== 'Magna') av.push('Há Cerimônia de Iniciação, Passagem ou Elevação na agenda: o tipo de sessão não deveria ser “Sessão Magna”?');
    const anoDe = (x) => String(x.data || '').slice(0, 4);
    const dup = (todas || []).find((o) => o.id !== s.id && anoDe(o) === anoDe(s) && Number(o.numero) === Number(s.numero));
    if (dup) av.push('Já existe a Ata nº ' + s.numero + ' de ' + anoDe(s) + ' (sessão de ' + E.dataCurta(dup.data) + ').');
    return av;
  }

  /* ---------- Pendências que atravessam sessões (petições e escrutínios) ---------- */
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
      if (!c.escrutinio && c.leituras < 3) out.push({ tipo: 'leitura', nome: c.nome, processo: c.processo, proxima: c.leituras + 1, texto: c.nome + ': ' + c.leituras + 'ª leitura da petição feita. Próxima: ' + (c.leituras + 1) + 'ª leitura.' });
      else if (!c.escrutinio) out.push({ tipo: 'escrutinio', nome: c.nome, processo: c.processo, texto: c.nome + ': 3 leituras feitas. Próximo passo: escrutínio.' });
      else if (c.escrutinio === 'novo') out.push({ tipo: 'escrutinio', nome: c.nome, processo: c.processo, texto: c.nome + ': votação anulada, aguarda novo escrutínio.' });
      else if (c.processo === 'Iniciação') out.push({ tipo: 'iniciacao', nome: c.nome, processo: c.processo, texto: c.nome + ': petição aprovada em escrutínio. Aguarda a Iniciação.' });
    });
    return out;
  }

  window.Frases = { naAgenda, funcaoSecretario, MOMENTOS, MOMENTO_PADRAO, NATUREZA_ORIENT, momentoDe, GRAUS, GRAU_SESSAO, TIPOS_SESSAO, TIPOS_AGENDA, TIPOS_OCORRENCIA, INSTRUCOES_AM, CERIMONIAS, ATALHOS, gerar, verificar, pendencias, agendaTexto, pessoa, contarPresenca, lista };
})();
