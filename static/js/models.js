/** Valores monetários são inteiros em centavos em toda a aplicação. */
export const moeda = centavos => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);

export class Carrinho {
  #itens = [];
  get itens() { return this.#itens.map(item => ({ ...item })); }
  get total() { return this.#itens.reduce((soma, item) => soma + item.preco_centavos * item.quantidade, 0); }
  get quantidade() { return this.#itens.reduce((soma, item) => soma + item.quantidade, 0); }
  adicionar(prato) {
    const item = this.#itens.find(atual => atual.prato_id === prato.id);
    if (item && item.quantidade >= 99) throw new Error('O limite é de 99 unidades por prato.');
    if (item) item.quantidade += 1;
    else this.#itens.push({ prato_id: prato.id, nome: prato.nome, preco_centavos: prato.preco_centavos, quantidade: 1 });
  }
  alterar(pratoId, variacao) {
    const item = this.#itens.find(atual => atual.prato_id === pratoId);
    if (!item) return;
    if (item.quantidade + variacao > 99) throw new Error('O limite é de 99 unidades por prato.');
    item.quantidade += variacao;
    if (item.quantidade <= 0) this.remover(pratoId);
  }
  remover(pratoId) { this.#itens = this.#itens.filter(item => item.prato_id !== pratoId); }
  limpar() { this.#itens = []; }
  payload() { return this.#itens.map(({ prato_id, quantidade }) => ({ prato_id, quantidade })); }
  atualizarCatalogo(pratos) {
    const alteracoes = [];
    for (const item of this.itens) {
      const atual = pratos.find(prato => prato.id === item.prato_id && prato.ativo);
      if (!atual) { this.remover(item.prato_id); alteracoes.push(`${item.nome} saiu do cardápio.`); }
      else {
        const interno = this.#itens.find(linha => linha.prato_id === item.prato_id);
        if (interno.preco_centavos !== atual.preco_centavos) alteracoes.push(`O preço de ${atual.nome} foi atualizado.`);
        interno.preco_centavos = atual.preco_centavos;
        interno.nome = atual.nome;
      }
    }
    return alteracoes;
  }
}

export function validarCampos(campos) {
  const limites = { nome: [2, 100], email: [5, 254], endereco: [8, 250] };
  const nomes = { nome: 'Nome', email: 'E-mail', endereco: 'Endereço' };
  // for...in percorre as regras de um objeto, e não os índices de um array.
  for (const campo in limites) {
    const [minimo, maximo] = limites[campo];
    const valor = campos[campo]?.trim() || '';
    if (valor.length < minimo || valor.length > maximo) throw new Error(`${nomes[campo]} deve ter entre ${minimo} e ${maximo} caracteres.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.trim())) throw new Error('Informe um e-mail válido.');
}
