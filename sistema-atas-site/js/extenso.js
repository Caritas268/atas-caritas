/* Números, datas e horários por extenso (português do Brasil). */
(function () {
  const UNID = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  function feminino(w) {
    return w.replace(/\bum\b/g, 'uma').replace(/\bdois\b/g, 'duas').replace(/entos\b/g, 'entas');
  }

  function numero(n, fem) {
    n = Math.floor(Number(n));
    let w;
    if (n < 20) w = UNID[n];
    else if (n < 100) { const r = n % 10; w = DEZ[Math.floor(n / 10)] + (r ? ' e ' + UNID[r] : ''); }
    else if (n === 100) w = 'cem';
    else if (n < 1000) { const r = n % 100; w = CEM[Math.floor(n / 100)] + (r ? ' e ' + numero(r) : ''); }
    else if (n < 1000000) {
      const k = Math.floor(n / 1000), r = n % 1000;
      w = (k === 1 ? 'mil' : numero(k) + ' mil');
      if (r) w += (r < 100 || r % 100 === 0 ? ' e ' : ' ') + numero(r);
    } else w = String(n);
    return fem ? feminino(w) : w;
  }

  function hora(hhmm) {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return hhmm || '';
    const [h, m] = hhmm.split(':').map(Number);
    let t = numero(h, true) + (h === 1 ? ' hora' : ' horas');
    if (m) t += ' e ' + numero(m) + (m === 1 ? ' minuto' : ' minutos');
    return t;
  }

  function partesData(iso) {
    const [a, m, d] = iso.split('-').map(Number);
    return { ano: a, mes: m, dia: d };
  }

  /* "Aos vinte e oito dias do mês de janeiro do ano de dois mil e vinte e seis" */
  function dataAbertura(iso) {
    const { ano, mes, dia } = partesData(iso);
    const inicio = dia === 1 ? 'Ao primeiro dia' : 'Aos ' + numero(dia) + ' dias';
    return { inicio: inicio + ' do mês de ' + MESES[mes - 1], ano: 'do ano de ' + numero(ano) };
  }

  function dataCurta(iso) {
    if (!iso) return '';
    const { ano, mes, dia } = partesData(iso);
    return String(dia).padStart(2, '0') + '/' + String(mes).padStart(2, '0') + '/' + ano;
  }

  function dataArquivo(iso) {
    const { ano, mes, dia } = partesData(iso);
    return String(dia).padStart(2, '0') + ' ' + MESES_ABREV[mes - 1] + ' ' + ano;
  }

  function ordinal(n, fem) { return n + (fem ? 'ª' : 'º'); }

  window.Extenso = { numero, hora, dataAbertura, dataCurta, dataArquivo, ordinal, MESES };
})();
