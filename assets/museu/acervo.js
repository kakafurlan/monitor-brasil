/* ACERVO DO MUSEU — fotos e capas de jornal licenciadas.
 *
 * Por que está vazio? Fotografias e capas de jornal têm autor e licença; o museu não embute imagens de terceiros
 * sem autorização. As salas usam ilustrações originais e apontam para os acervos oficiais.
 *
 * Como adicionar uma imagem:
 *   1) Salve o arquivo em  assets/museu/img/  (ex.: fila-banco-1990.jpg)
 *   2) Acrescente uma linha na lista abaixo, com crédito e licença corretos.
 *   3) Recarregue o site: a imagem aparece na moldura da sala indicada.
 *
 *   sala:    "confisco" (sala do confisco de 1990)
 *   src:     caminho do arquivo local
 *   titulo:  legenda curta ("Fila na agência, 19/03/1990")
 *   credito: autor e licença ("Foto: Nome / Agência — licença CC BY 4.0")
 *   link:    (opcional) página de origem da imagem
 */
MB.ACERVO = [
  // { sala: "confisco", src: "assets/museu/img/fila-banco-1990.jpg", titulo: "Fila na agência, 19/03/1990", credito: "Foto: Fulano / Agência X — licença …", link: "https://…" },
];
/* true = mostra uma moldura pontilhada (“espaço para o seu acervo”) enquanto não houver imagens; use false ao publicar. */
MB.ACERVO_DICA = true;
