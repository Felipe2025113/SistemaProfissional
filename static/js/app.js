import { Carrinho, moeda, validarCampos } from './models.js';
import { requisitar, selecionarUsuario } from './api.js';

const $ = seletor => document.querySelector(seletor);
const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]);
const carrinho = new Carrinho();
const estado = { usuarios: [], usuario: null, pratos: [], pedidos: [], tela: 'menu', categoria: 'Todos', busca: '', versao: 0 };
const nomesStatus = { aguardando: 'Aguardando', em_preparo: 'Em preparo', pronto: 'Pronto para entrega' };
const simbolos = { Refeições: '🥗', Lanches: '🥪', Sobremesas: '🍮', Bebidas: '🥤' };
let avisoTimer;
let carregando = null;

function avisar(mensagem) {
  $('#toast').textContent = mensagem;
  $('#toast').hidden = false;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => { $('#toast').hidden = true; }, 5500);
}

function mostrarErro(erro) {
  $('#global-error').innerHTML = `${escapar(erro.message)} <button id="retry">Tentar novamente</button>`;
  $('#global-error').hidden = false;
}

function desenharNavegacao() {
  const paginas = estado.usuario.perfil === 'cliente'
    ? [['menu', 'Cardápio'], ['orders', 'Meus pedidos']]
    : estado.usuario.perfil === 'administrador' ? [['admin', 'Catálogo']] : [['kitchen', 'Cozinha']];
  $('#main-nav').innerHTML = paginas.map(([id, titulo]) => `<button data-view="${id}" ${estado.tela === id ? 'aria-current="page"' : ''}>${titulo}</button>`).join('');
  document.querySelectorAll('.view').forEach(pagina => { pagina.hidden = pagina.id !== `view-${estado.tela}`; });
}

async function mudarTela(tela) {
  estado.tela = tela;
  desenharNavegacao();
  if (['orders', 'kitchen'].includes(tela)) await atualizarPedidos();
}

function desenharCardapio() {
  const busca = estado.busca.toLocaleLowerCase('pt-BR');
  const pratos = estado.pratos.filter(prato => prato.ativo)
    .filter(prato => estado.categoria === 'Todos' || prato.categoria === estado.categoria)
    .filter(prato => `${prato.nome} ${prato.descricao}`.toLocaleLowerCase('pt-BR').includes(busca));
  $('#dish-count').textContent = `${pratos.length} ${pratos.length === 1 ? 'opção' : 'opções'}`;
  $('#dish-list').innerHTML = pratos.length ? pratos.map(prato => `<article class="dish-card"><div class="dish-art"><span class="category-label">${escapar(prato.categoria)}</span><div class="mini-plate" aria-hidden="true">${simbolos[prato.categoria] || '🍽️'}</div></div><div class="dish-content"><h3>${escapar(prato.nome)}</h3><p>${escapar(prato.descricao)}</p><span class="dish-time">◷ ${prato.tempo_preparo_minutos} min de preparo estimado</span><div class="dish-bottom"><strong class="dish-price">${moeda(prato.preco_centavos)}</strong><button class="add-button" data-add="${prato.id}" aria-label="Adicionar ${escapar(prato.nome)} ao pedido">+</button></div></div></article>`).join('') : '<div class="empty-state">Nenhum prato encontrado.<br>Experimente outra categoria ou busca.</div>';
}

function desenharCarrinho() {
  $('#cart-count').textContent = carrinho.quantidade;
  $('#cart-total').textContent = moeda(carrinho.total);
  $('#checkout-open').disabled = !carrinho.quantidade;
  $('#cart-items').innerHTML = carrinho.itens.length ? carrinho.itens.map(item => `<div class="cart-item"><div class="cart-item-top"><strong>${escapar(item.nome)}</strong><span>${moeda(item.preco_centavos * item.quantidade)}</span></div><div class="cart-item-bottom"><div class="quantity"><button data-quantity="${item.prato_id}" data-delta="-1" aria-label="Diminuir ${escapar(item.nome)}">−</button><span aria-label="${item.quantidade} unidades">${item.quantidade}</span><button data-quantity="${item.prato_id}" data-delta="1" aria-label="Aumentar ${escapar(item.nome)}" ${item.quantidade >= 99 ? 'disabled' : ''}>+</button></div><button class="remove-item" data-remove="${item.prato_id}" aria-label="Remover ${escapar(item.nome)}">Remover</button></div></div>`).join('') : '<div class="empty-cart"><span class="empty-symbol" aria-hidden="true">⌑</span><strong>Seu carrinho está esperando.</strong><p>Adicione um prato do cardápio<br>para começar seu pedido.</p></div>';
}

function desenharAdmin() {
  const ativos = estado.pratos.filter(prato => prato.ativo).length;
  $('#admin-summary').innerHTML = `<span><strong>${estado.pratos.length}</strong>pratos no catálogo</span><span><strong>${ativos}</strong>disponíveis</span><span><strong>${estado.pratos.length - ativos}</strong>inativos</span>`;
  $('#admin-list').innerHTML = estado.pratos.map(prato => `<tr><td><strong>${escapar(prato.nome)}</strong><small>${escapar(prato.descricao)}</small></td><td>${escapar(prato.categoria)}</td><td>${moeda(prato.preco_centavos)}</td><td><span class="status ${prato.ativo ? 'pronto' : 'inactive'}">${prato.ativo ? 'Disponível' : 'Inativo'}</span></td><td><div class="table-actions"><button data-edit="${prato.id}" aria-label="Editar ${escapar(prato.nome)}">Editar</button><button data-toggle="${prato.id}" aria-label="${prato.ativo ? 'Inativar' : 'Ativar'} ${escapar(prato.nome)}">${prato.ativo ? 'Inativar' : 'Ativar'}</button></div></td></tr>`).join('') || '<tr><td colspan="5">Nenhum prato cadastrado. Use Novo prato para começar.</td></tr>';
}

function dataHora(iso) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? 'Agora' : data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function pedidoHtml(pedido, cozinha = false) {
  const etapa = ['aguardando', 'em_preparo', 'pronto'].indexOf(pedido.status);
  const itens = pedido.itens.map(item => `<li><span>${item.quantidade}× ${escapar(item.nome)}</span>${cozinha ? '' : `<span>${moeda(item.subtotal_centavos)}</span>`}</li>`).join('');
  let acao = '';
  if (cozinha && pedido.status === 'aguardando') acao = `<button class="button primary full" data-start="${pedido.id}">Iniciar preparo</button>`;
  if (cozinha && pedido.status === 'em_preparo') acao = `<button class="button primary full" data-ready="${pedido.id}">Marcar como pronto</button>`;
  return `<article class="order-card"><div class="order-header"><h3>Pedido #${String(pedido.id).padStart(3, '0')}</h3>${cozinha ? '' : `<span class="status ${pedido.status}">${nomesStatus[pedido.status]}</span>`}</div><p class="order-meta">${escapar(pedido.cliente_nome)}<br>${dataHora(pedido.criado_em)}${pedido.estimativa_minutos ? `<br>Preparo estimado: ${pedido.estimativa_minutos} min` : ''}</p><ul class="order-items">${itens}</ul>${cozinha ? '' : `<div class="order-total"><span>Total do pedido</span><strong>${moeda(pedido.total_centavos)}</strong></div><p class="order-meta">Entrega: ${escapar(pedido.endereco)}</p><div class="order-progress" aria-label="Etapa ${etapa + 1} de 3">${[0, 1, 2].map(n => `<span class="${n <= etapa ? 'done' : ''}"></span>`).join('')}</div>`}${acao}</article>`;
}

function desenharPedidos() {
  $('#order-list').innerHTML = estado.pedidos.length ? [...estado.pedidos].sort((a, b) => b.id - a.id).map(pedido => pedidoHtml(pedido)).join('') : '<div class="empty-state">Seus pedidos aparecerão aqui.<br>Escolha um prato no cardápio para começar.</div>';
  $('#kitchen-board').innerHTML = Object.entries(nomesStatus).map(([status, nome]) => {
    const pedidos = estado.pedidos.filter(pedido => pedido.status === status).sort((a, b) => a.id - b.id);
    return `<section class="kitchen-column" aria-label="${nome}"><h2>${nome}<span class="count">${pedidos.length}</span></h2>${pedidos.length ? pedidos.map(pedido => pedidoHtml(pedido, true)).join('') : '<div class="empty-state">Nenhum pedido nesta etapa.</div>'}</section>`;
  }).join('');
}

async function atualizarCatalogo() {
  const versao = estado.versao;
  const pratos = await requisitar('/pratos');
  if (versao !== estado.versao) return;
  estado.pratos = pratos;
  const alteracoes = carrinho.atualizarCatalogo(pratos);
  if (alteracoes.length) avisar(alteracoes.join(' '));
  desenharCardapio();
  desenharCarrinho();
  desenharAdmin();
}

async function atualizarPedidos(silencioso = false) {
  if (!estado.usuario || carregando === estado.versao) return;
  const versao = estado.versao;
  carregando = versao;
  document.querySelectorAll('.refresh').forEach(botao => { botao.disabled = true; });
  try {
    const pedidos = await requisitar('/pedidos');
    if (versao !== estado.versao) return;
    estado.pedidos = pedidos;
    desenharPedidos();
    $('#global-error').hidden = true;
  } catch (erro) { if (!silencioso || versao === estado.versao) mostrarErro(erro); }
  finally {
    if (carregando === versao) carregando = null;
    document.querySelectorAll('.refresh').forEach(botao => { botao.disabled = false; });
  }
}

async function mudarPerfil(id) {
  estado.versao += 1;
  estado.usuario = estado.usuarios.find(usuario => usuario.id === Number(id));
  if (!estado.usuario) return;
  selecionarUsuario(estado.usuario.id);
  carrinho.limpar();
  estado.pedidos = [];
  estado.pratos = [];
  estado.tela = ({ cliente: 'menu', administrador: 'admin', cozinheiro: 'kitchen' })[estado.usuario.perfil];
  desenharNavegacao();
  desenharPedidos();
  desenharCardapio();
  desenharCarrinho();
  desenharAdmin();
  $('#global-error').hidden = true;
  $('#perfil').disabled = true;
  try { await atualizarCatalogo(); await atualizarPedidos(); }
  catch (erro) { mostrarErro(erro); }
  finally { $('#perfil').disabled = false; }
}

async function abrirCheckout() {
  const botao = $('#checkout-open');
  botao.disabled = true;
  try {
    await atualizarCatalogo();
    if (!carrinho.quantidade) throw new Error('Adicione um prato disponível para continuar.');
    $('#cliente-nome').value = estado.usuario.nome;
    $('#cliente-email').value = estado.usuario.email;
    $('#cliente-endereco').value = estado.usuario.endereco || '';
    $('#checkout-summary').innerHTML = `<span>${carrinho.quantidade} ${carrinho.quantidade === 1 ? 'item' : 'itens'} no pedido</span><strong>${moeda(carrinho.total)}</strong>`;
    $('#checkout-error').hidden = true;
    $('#checkout-dialog').showModal();
  } catch (erro) { avisar(erro.message); }
  finally { botao.disabled = !carrinho.quantidade; }
}

function abrirPrato(id) {
  const form = $('#dish-form');
  form.reset();
  form.elements.id.value = '';
  $('#dish-error').hidden = true;
  $('#dish-title').textContent = id ? 'Editar prato' : 'Novo prato';
  if (id) {
    const prato = estado.pratos.find(item => item.id === id);
    for (const campo of ['id', 'nome', 'descricao', 'categoria', 'tempo_preparo_minutos']) form.elements[campo].value = prato[campo];
    form.elements.preco.value = (prato.preco_centavos / 100).toFixed(2);
    form.elements.ativo.checked = prato.ativo;
  }
  $('#dish-dialog').showModal();
}

async function enviarFormulario(form, erroSeletor, operacao) {
  const botao = form.querySelector('[type=submit]');
  const texto = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Salvando...';
  $('#perfil').disabled = true;
  $(erroSeletor).hidden = true;
  try { await operacao(); }
  catch (erro) { $(erroSeletor).textContent = erro.message; $(erroSeletor).hidden = false; }
  finally { botao.disabled = false; botao.textContent = texto; $('#perfil').disabled = false; }
}

$('#checkout-form').addEventListener('submit', async evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  await enviarFormulario(form, '#checkout-error', async () => {
    const dados = Object.fromEntries(new FormData(form));
    validarCampos(dados);
    const pedido = await requisitar('/pedidos', { method: 'POST', body: { ...dados, itens: carrinho.payload() } });
    carrinho.limpar();
    desenharCarrinho();
    $('#checkout-dialog').close();
    avisar(`Pedido #${String(pedido.id).padStart(3, '0')} recebido pela cozinha! Total: ${moeda(pedido.total_centavos)}.`);
    await mudarTela('orders');
  });
});

$('#dish-form').addEventListener('submit', async evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  await enviarFormulario(form, '#dish-error', async () => {
    const dados = Object.fromEntries(new FormData(form));
    const id = dados.id;
    const body = { nome: dados.nome.trim(), descricao: dados.descricao.trim(), categoria: dados.categoria, preco_centavos: Math.round(Number(dados.preco) * 100), tempo_preparo_minutos: Number(dados.tempo_preparo_minutos), ativo: form.elements.ativo.checked };
    await requisitar(id ? `/pratos/${id}` : '/pratos', { method: id ? 'PUT' : 'POST', body });
    $('#dish-dialog').close();
    avisar(id ? 'Prato atualizado.' : 'Novo prato adicionado ao catálogo.');
    await atualizarCatalogo();
  });
});

$('#status-form').addEventListener('submit', async evento => {
  evento.preventDefault();
  const form = evento.currentTarget;
  await enviarFormulario(form, '#status-error', async () => {
    await requisitar(`/pedidos/${form.elements.pedido_id.value}/status`, { method: 'PATCH', body: { status: 'em_preparo', estimativa_minutos: Number(form.elements.estimativa_minutos.value) } });
    $('#status-dialog').close();
    avisar('Preparo iniciado. O cliente já pode acompanhar.');
    await atualizarPedidos();
  });
});

document.addEventListener('click', async evento => {
  const botao = evento.target.closest('button');
  if (!botao) return;
  try {
    if (botao.classList.contains('close-dialog')) { botao.closest('dialog').close(); return; }
    if (botao.dataset.view) await mudarTela(botao.dataset.view);
    if (botao.dataset.category) {
      estado.categoria = botao.dataset.category;
      document.querySelectorAll('[data-category]').forEach(chip => { const selecionado = chip === botao; chip.classList.toggle('active', selecionado); chip.setAttribute('aria-pressed', String(selecionado)); });
      desenharCardapio();
    }
    if (botao.dataset.add) {
      const prato = estado.pratos.find(item => item.id === Number(botao.dataset.add));
      carrinho.adicionar(prato); desenharCarrinho(); avisar(`${prato.nome} adicionado ao pedido.`);
    }
    if (botao.dataset.quantity) { carrinho.alterar(Number(botao.dataset.quantity), Number(botao.dataset.delta)); desenharCarrinho(); }
    if (botao.dataset.remove) { carrinho.remover(Number(botao.dataset.remove)); desenharCarrinho(); }
    if (botao.id === 'checkout-open') await abrirCheckout();
    if (botao.id === 'new-dish') abrirPrato();
    if (botao.dataset.edit) abrirPrato(Number(botao.dataset.edit));
    if (botao.dataset.toggle) {
      const prato = estado.pratos.find(item => item.id === Number(botao.dataset.toggle));
      botao.disabled = true;
      try {
        await requisitar(`/pratos/${prato.id}`, prato.ativo ? { method: 'DELETE' } : { method: 'PUT', body: { ...prato, ativo: true } });
        avisar(prato.ativo ? 'Prato inativado. O histórico de pedidos foi preservado.' : 'Prato disponível novamente.');
        await atualizarCatalogo();
      } finally { botao.disabled = false; }
    }
    if (botao.classList.contains('refresh')) { await atualizarPedidos(); }
    if (botao.id === 'retry') {
      if (!estado.usuario) await iniciar();
      else { await atualizarCatalogo(); await atualizarPedidos(); }
    }
    if (botao.dataset.start) {
      $('#status-form').elements.pedido_id.value = botao.dataset.start;
      $('#status-description').textContent = `Informe o tempo estimado para o pedido #${String(botao.dataset.start).padStart(3, '0')}.`;
      $('#estimativa').value = '25';
      $('#status-error').hidden = true;
      $('#status-dialog').showModal();
    }
    if (botao.dataset.ready) {
      botao.disabled = true;
      try {
        await requisitar(`/pedidos/${botao.dataset.ready}/status`, { method: 'PATCH', body: { status: 'pronto' } });
        avisar('Pedido pronto para entrega.');
        await atualizarPedidos();
      } finally { botao.disabled = false; }
    }
  } catch (erro) { avisar(erro.message); }
});

$('#busca').addEventListener('input', evento => { estado.busca = evento.target.value; desenharCardapio(); });
$('#perfil').addEventListener('change', evento => { mudarPerfil(evento.target.value); });

async function iniciar() {
  desenharCarrinho();
  try {
    estado.usuarios = await requisitar('/perfis');
    const perfis = { cliente: 'Cliente', administrador: 'Administrador', cozinheiro: 'Cozinheiro' };
    $('#perfil').innerHTML = estado.usuarios.map(usuario => `<option value="${usuario.id}">${escapar(usuario.nome)} · ${perfis[usuario.perfil]}</option>`).join('');
    await mudarPerfil(estado.usuarios[0].id);
  } catch (erro) {
    $('#dish-list').innerHTML = '<div class="empty-state">Não foi possível carregar o cardápio.</div>';
    mostrarErro(erro);
  }
}

setInterval(() => {
  if (!document.hidden && ['orders', 'kitchen'].includes(estado.tela)) atualizarPedidos(true);
}, 15000);
iniciar();
