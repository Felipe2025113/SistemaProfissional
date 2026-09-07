"""Repositório em memória com regras de negócio atômicas no processo local."""

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from threading import RLock

from .entities import ItemPedido, Pedido, Prato, Usuario
from .validation import DomainError, integer_value, invalid, validate_checkout, validate_prato


class MemoryStore:
    def __init__(self, seed=True):
        self._lock = RLock()
        self._usuarios = {
            1: Usuario(1, "Ana Lima", "ana@example.test", "cliente", "Rua das Hortas, 120"),
            2: Usuario(2, "Rafael Costa", "rafael@example.test", "administrador", nivel_permissao="Administrador"),
            3: Usuario(3, "João Santos", "joao@example.test", "cozinheiro", turno="Diurno", especialidade="Cozinha brasileira"),
            4: Usuario(4, "Bruno Oliveira", "bruno@example.test", "cliente", "Rua do Manjericão, 45"),
        }
        self._pratos = {}
        self._pedidos = {}
        self._next_prato_id = 1
        self._next_pedido_id = 1
        if seed:
            self._seed()

    def _seed(self):
        records = [
            ("Bowl da Horta", "Arroz integral, grão-de-bico, abóbora assada e molho de ervas.", "Refeições", 3490, 20),
            ("Frango do Quintal", "Frango grelhado, purê de mandioquinha e legumes da estação.", "Refeições", 3890, 25),
            ("Risoto de Cogumelos", "Arroz cremoso, cogumelos salteados e toque de queijo curado.", "Refeições", 2990, 25),
            ("Sanduíche da Casa", "Pão artesanal com frango desfiado, folhas e creme de ervas.", "Lanches", 2190, 15),
            ("Cacau & Castanha", "Brownie de cacau com castanhas e uma camada de ganache.", "Sobremesas", 1690, 5),
            ("Brisa de Maracujá", "Bebida de maracujá com hortelã, preparada sem adição de açúcar.", "Bebidas", 1290, 5),
        ]
        for nome, descricao, categoria, preco, tempo in records:
            self.create_prato(dict(nome=nome, descricao=descricao, categoria=categoria,
                                   preco_centavos=preco, ativo=True, tempo_preparo_minutos=tempo))
        seed_orders = [
            (1, [{"prato_id": 1, "quantidade": 1}, {"prato_id": 6, "quantidade": 1}], "aguardando", None, 4),
            (4, [{"prato_id": 2, "quantidade": 1}], "em_preparo", 25, 12),
            (1, [{"prato_id": 4, "quantidade": 2}], "pronto", 15, 30),
        ]
        for cliente_id, itens, status, estimativa, age in seed_orders:
            cliente = self._usuarios[cliente_id]
            pedido = self.create_pedido(cliente, dict(nome=cliente.nome, email=cliente.email,
                                                     endereco=cliente.endereco, itens=itens))
            self._pedidos[pedido.id].status = status
            self._pedidos[pedido.id].estimativa_minutos = estimativa
            self._pedidos[pedido.id].criado_em = (datetime.now(timezone.utc) - timedelta(minutes=age)).isoformat(timespec="seconds")

    def users(self):
        with self._lock:
            return deepcopy(list(self._usuarios.values()))

    def user(self, user_id):
        with self._lock:
            return deepcopy(self._usuarios.get(user_id))

    def pratos(self, include_inactive=False, query=""):
        query = query.casefold()
        with self._lock:
            return deepcopy([prato for prato in self._pratos.values()
                             if (include_inactive or prato.ativo)
                             and query in f"{prato.nome} {prato.descricao} {prato.categoria}".casefold()])

    def create_prato(self, data):
        values = validate_prato(data)
        with self._lock:
            prato = Prato(id=self._next_prato_id, **values)
            self._pratos[prato.id] = prato
            self._next_prato_id += 1
            return deepcopy(prato)

    def update_prato(self, prato_id, data):
        values = validate_prato(data)
        with self._lock:
            if prato_id not in self._pratos:
                raise DomainError("nao_encontrado", "Prato não encontrado.", 404)
            self._pratos[prato_id] = Prato(id=prato_id, **values)
            return deepcopy(self._pratos[prato_id])

    def deactivate_prato(self, prato_id):
        with self._lock:
            prato = self._pratos.get(prato_id)
            if prato is None:
                raise DomainError("nao_encontrado", "Prato não encontrado.", 404)
            prato.ativo = False
            return deepcopy(prato)

    def pedidos(self, user):
        with self._lock:
            return deepcopy(sorted((pedido for pedido in self._pedidos.values()
                                    if user.perfil != "cliente" or pedido.cliente_id == user.id),
                                   key=lambda pedido: (pedido.criado_em, pedido.id), reverse=True))

    def pedido(self, pedido_id, user):
        with self._lock:
            pedido = self._pedidos.get(pedido_id)
            if pedido is None or (user.perfil == "cliente" and pedido.cliente_id != user.id):
                raise DomainError("nao_encontrado", "Pedido não encontrado.", 404)
            return deepcopy(pedido)

    def create_pedido(self, user, data):
        nome, email, endereco, requested = validate_checkout(data)
        with self._lock:
            # A disponibilidade, os preços e a inserção usam o mesmo bloqueio.
            # Se a inativação ocorreu antes, não há pedido parcial; se ocorrer
            # depois, o pedido já confirmado conserva seus dados históricos.
            itens = []
            for prato_id, quantidade in requested:
                prato = self._pratos.get(prato_id)
                if prato is None or not prato.ativo:
                    raise DomainError("prato_indisponivel", "Um prato ficou indisponível. Atualize o cardápio e revise o carrinho.", 409,
                                      {"itens": f"Prato {prato_id} indisponível."})
                itens.append(ItemPedido(prato.id, prato.nome, quantidade, prato.preco_centavos))
            pedido = Pedido(id=self._next_pedido_id, cliente_id=user.id, cliente_nome=nome,
                            email=email, endereco=endereco, itens=itens,
                            criado_em=datetime.now(timezone.utc).isoformat(timespec="seconds"))
            self._pedidos[pedido.id] = pedido
            self._next_pedido_id += 1
            return deepcopy(pedido)

    def update_status(self, pedido_id, data):
        status = data.get("status")
        if status not in ("em_preparo", "pronto"):
            invalid("status", "Selecione em_preparo ou pronto.")
        estimativa = None
        if status == "em_preparo":
            estimativa = integer_value(data, "estimativa_minutos", 1, 240)
        elif "estimativa_minutos" in data and data["estimativa_minutos"] is not None:
            integer_value(data, "estimativa_minutos", 1, 240)
        with self._lock:
            pedido = self._pedidos.get(pedido_id)
            if pedido is None:
                raise DomainError("nao_encontrado", "Pedido não encontrado.", 404)
            allowed = {"aguardando": "em_preparo", "em_preparo": "pronto"}
            if allowed.get(pedido.status) != status:
                raise DomainError("transicao_invalida", "O status mudou ou esta transição não é permitida. Atualize a fila.", 409)
            pedido.status = status
            if status == "em_preparo":
                pedido.estimativa_minutos = estimativa
            return deepcopy(pedido)
