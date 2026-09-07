"""Entidades do domínio; não dependem do Flask ou de banco de dados."""

from dataclasses import dataclass, field


@dataclass
class Usuario:
    id: int
    nome: str
    email: str
    perfil: str
    endereco: str = ""
    nivel_permissao: str = ""
    turno: str = ""
    especialidade: str = ""


@dataclass
class Prato:
    id: int
    nome: str
    descricao: str
    categoria: str
    preco_centavos: int
    ativo: bool
    tempo_preparo_minutos: int


@dataclass(frozen=True)
class ItemPedido:
    prato_id: int
    nome: str
    quantidade: int
    preco_unitario_centavos: int

    @property
    def subtotal_centavos(self):
        return self.quantidade * self.preco_unitario_centavos


@dataclass
class Pedido:
    id: int
    cliente_id: int
    cliente_nome: str
    email: str
    endereco: str
    criado_em: str
    itens: list[ItemPedido] = field(default_factory=list)
    status: str = "aguardando"
    estimativa_minutos: int | None = None

    @property
    def total_centavos(self):
        return sum(item.subtotal_centavos for item in self.itens)
