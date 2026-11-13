/* Valores padrão do sistema. Os nomes dos Irmãos NÃO ficam aqui (este site é público):
   eles ficam na planilha privada da Loja, criados pela função "configurar" do Apps Script. */
(function () {
  const config = {
    lojaNome: 'Augusta e Respeitável Loja Simbólica Caritas nº 268',
    potencia: 'Mui Respeitável Grande Loja Maçônica do Estado do Rio Grande do Sul',
    local: 'na Sala de Loja da Benemérita e Cinquentenária Augusta e Respeitável Loja Simbólica Concórdia et Humanitas nº 56, localizada na Rua Barão do Amazonas nº 2316, bairro Partenon, em Porto Alegre, Estado do Rio Grande do Sul, República Federativa do Brasil',
    administracao: '2025/2026',
    vm: '', v1: '', v2: '', secretario: '', secretarioPadrao: '',
    registrarAtaAnterior: true,
    registrarExpediente: true
  };
  window.DadosIniciais = { irmaos: [], visitantes: [], config };
})();
