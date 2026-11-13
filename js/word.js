/* Gera o arquivo Word (.docx) usando o modelo timbrado da Loja (modelo-ata.docx). */
(function () {
  const FONTE = 'Ebrima';
  const SIMBOLO = 'Noto Sans Symbols';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function run(texto, b, i) {
    // separa o "∴" para usar a fonte de símbolos embutida no modelo (como nas atas originais)
    return String(texto).split(/(∴+)/).filter((x) => x !== '').map((parte) => {
      const fonte = /^∴+$/.test(parte) ? SIMBOLO : FONTE;
      return '<w:r><w:rPr><w:rFonts w:ascii="' + fonte + '" w:cs="' + fonte + '" w:eastAsia="' + fonte + '" w:hAnsi="' + fonte + '"/>' +
        (b ? '<w:b w:val="1"/><w:bCs w:val="1"/>' : '') + (i ? '<w:i w:val="1"/><w:iCs w:val="1"/>' : '') +
        '<w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">' + esc(parte) + '</w:t></w:r>';
    }).join('');
  }

  function paragrafo(p) {
    const pPr = p.titulo
      ? '<w:pPr><w:spacing w:before="0" w:after="240" w:line="360" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr>'
      : '<w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>';
    return '<w:p>' + pPr + p.runs.map((r) => run(r.t, r.b, r.i)).join('') + '</w:p>';
  }

  async function gerarDocx(ata, urlModelo) {
    const resp = await fetch(urlModelo || 'modelo-ata.docx');
    if (!resp.ok) throw new Error('Não foi possível carregar o modelo da ata.');
    const zip = await JSZip.loadAsync(await resp.arrayBuffer());
    let xml = await zip.file('word/document.xml').async('string');
    const corpo = ata.paragrafos.map(paragrafo).join('');
    xml = xml.replace('<w:p><w:r><w:t>{{CORPO}}</w:t></w:r></w:p>', corpo)
      .replace('{{VM_NOME}}', esc(ata.assinatura.vm))
      .replace('{{SEC_NOME}}', esc(ata.assinatura.sec))
      .replace('{{SEC_FUNCAO}}', esc(ata.assinatura.funcao));
    zip.file('word/document.xml', xml);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  function nomeArquivo(s) {
    return 'Ata Nr ' + String(s.numero || '').padStart(2, '0') + ' - ' + (s.data ? Extenso.dataArquivo(s.data) : 'sem data') + '.docx';
  }

  window.Word = { gerarDocx, nomeArquivo };
})();
