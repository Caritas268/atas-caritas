/* Onde os dados ficam.
   - Modo "Google": planilha da Loja no Google Drive, via Apps Script (compartilhado entre secretários).
   - Modo "Só neste aparelho": navegador do próprio computador/celular (para teste ou sem conexão).
   Em ambos os modos há uma cópia local, para abrir rápido e não perder nada se a internet cair. */
(function () {
  const CHAVE_DB = 'atasCaritas.db.v1';
  const CHAVE_CONEXAO = 'atasCaritas.conexao.v1';
  const CHAVE_PENDENTES = 'atasCaritas.pendentes.v1';

  function ler(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { return false; }
  }

  function novoId(prefixo) { return (prefixo || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  const Store = {
    db: null,
    conexao: ler(CHAVE_CONEXAO, { url: '', pin: '' }),
    pendentes: ler(CHAVE_PENDENTES, []),
    status: 'local',
    ultimoErro: '',

    modoGoogle() { return !!(this.conexao && this.conexao.url); },

    salvarConexao(url, pin) {
      if (!this.modoGoogle() && url) this.migrarLocal = true;
      this.conexao = { url: (url || '').trim(), pin: (pin || '').trim() };
      gravar(CHAVE_CONEXAO, this.conexao);
    },

    async chamar(dados) {
      const r = await fetch(this.conexao.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ pin: this.conexao.pin }, dados)),
        redirect: 'follow'
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.erro || 'Erro no servidor da planilha.');
      return j;
    },

    async carregar() {
      const local = ler(CHAVE_DB, null);
      if (this.modoGoogle()) {
        try {
          await this.sincronizar();
          const j = await this.chamar({ acao: 'carregar' });
          const base = local || this.inicial();
          this.db = {
            config: Object.assign({}, base.config, j.config || {}),
            irmaos: j.irmaos && j.irmaos.length ? j.irmaos : base.irmaos,
            visitantes: j.visitantes || base.visitantes,
            sessoes: j.sessoes || []
          };
          // primeira conexão deste aparelho: envia as atas feitas só aqui
          if (this.migrarLocal && local) {
            const novas = (local.sessoes || []).filter((x) => !this.db.sessoes.some((y) => y.id === x.id));
            for (const x of novas) { await this.chamar({ acao: 'salvarSessao', registro: x }); this.db.sessoes.push(x); }
            this.migrarLocal = false;
          }
          // planilha nova e vazia: envia os dados iniciais
          if (!j.irmaos || !j.irmaos.length) await this.chamar({ acao: 'salvarLista', lista: 'irmaos', registros: this.db.irmaos });
          if (!j.configSalva) await this.chamar({ acao: 'salvarConfig', config: this.db.config });
          this.status = 'google';
          this.ultimoErro = '';
          gravar(CHAVE_DB, this.db);
          return this.db;
        } catch (e) {
          this.status = 'offline';
          this.ultimoErro = e.message;
        }
      } else {
        this.status = 'local';
      }
      this.db = local || this.inicial();
      gravar(CHAVE_DB, this.db);
      return this.db;
    },

    inicial() {
      const D = window.DadosIniciais;
      return { config: JSON.parse(JSON.stringify(D.config)), irmaos: JSON.parse(JSON.stringify(D.irmaos)), visitantes: JSON.parse(JSON.stringify(D.visitantes)), sessoes: [] };
    },

    gravarLocal() { gravar(CHAVE_DB, this.db); },

    async enviar(op) {
      this.gravarLocal();
      if (!this.modoGoogle()) return true;
      try {
        await this.chamar(op);
        this.status = 'google';
        return true;
      } catch (e) {
        this.status = 'offline';
        this.ultimoErro = e.message;
        // guarda para enviar depois (substitui operação igual mais antiga)
        const chave = op.acao + ':' + (op.registro ? op.registro.id : op.lista || op.id || '');
        this.pendentes = this.pendentes.filter((p) => p.chave !== chave);
        this.pendentes.push({ chave, op });
        gravar(CHAVE_PENDENTES, this.pendentes);
        return false;
      }
    },

    async sincronizar() {
      if (!this.modoGoogle() || !this.pendentes.length) return;
      const restantes = [];
      for (const p of this.pendentes) {
        try { await this.chamar(p.op); } catch (e) { restantes.push(p); }
      }
      this.pendentes = restantes;
      gravar(CHAVE_PENDENTES, this.pendentes);
      if (restantes.length) throw new Error('Ainda há alterações não enviadas para a planilha.');
    },

    salvarSessao(s) {
      s.atualizadoEm = new Date().toISOString();
      const i = this.db.sessoes.findIndex((x) => x.id === s.id);
      if (i >= 0) this.db.sessoes[i] = s; else this.db.sessoes.push(s);
      return this.enviar({ acao: 'salvarSessao', registro: s });
    },

    excluirSessao(id) {
      this.db.sessoes = this.db.sessoes.filter((x) => x.id !== id);
      return this.enviar({ acao: 'excluirSessao', id });
    },

    salvarLista(nome) {
      return this.enviar({ acao: 'salvarLista', lista: nome, registros: this.db[nome] });
    },

    salvarConfig() {
      return this.enviar({ acao: 'salvarConfig', config: this.db.config });
    },

    async salvarArquivoNoDrive(nome, blob) {
      if (!this.modoGoogle()) throw new Error('Conecte a planilha da Loja para salvar no Drive.');
      const b64 = await new Promise((ok, erro) => {
        const fr = new FileReader();
        fr.onload = () => ok(String(fr.result).split(',')[1]);
        fr.onerror = erro;
        fr.readAsDataURL(blob);
      });
      const j = await this.chamar({ acao: 'salvarArquivo', nome, conteudo: b64 });
      return j.url;
    },

    exportarBackup() {
      return JSON.stringify({ sistema: 'Atas Caritas 268', versao: 1, exportadoEm: new Date().toISOString(), dados: this.db }, null, 2);
    },

    async importarBackup(texto) {
      const j = JSON.parse(texto);
      const d = j.dados || j;
      if (!d.sessoes || !d.irmaos) throw new Error('Arquivo de backup inválido.');
      this.db = { config: d.config || this.db.config, irmaos: d.irmaos, visitantes: d.visitantes || [], sessoes: d.sessoes };
      this.gravarLocal();
      if (this.modoGoogle()) {
        await this.chamar({ acao: 'restaurar', dados: this.db });
      }
    },

    novoId
  };

  window.Store = Store;
})();
