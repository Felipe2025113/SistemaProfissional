"""Regras de entrada compartilhadas pelo modelo, com erros previsíveis."""

import re
import unicodedata


CATEGORIAS = ("Refeições", "Lanches", "Sobremesas", "Bebidas")


class DomainError(Exception):
    def __init__(self, code, message, status=422, fields=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status
        self.fields = fields


def invalid(field, message):
    raise DomainError("validacao", "Revise os campos informados.", fields={field: message})


def text_value(data, field, minimum, maximum):
    value = data.get(field)
    if not isinstance(value, str):
        invalid(field, "Informe um texto.")
    value = unicodedata.normalize("NFC", value.strip())
    if not minimum <= len(value) <= maximum:
        invalid(field, f"Use entre {minimum} e {maximum} caracteres.")
    if any(unicodedata.category(char) == "Cc" for char in value):
        invalid(field, "Não use caracteres de controle.")
    return value


def integer_value(data, field, minimum, maximum):
    value = data.get(field)
    # bool é subclasse de int em Python: rejeitar explicitamente impede True = 1.
    if type(value) is not int or not minimum <= value <= maximum:
        invalid(field, f"Informe um número inteiro entre {minimum} e {maximum}.")
    return value


def validate_prato(data):
    nome = text_value(data, "nome", 2, 80)
    descricao = text_value(data, "descricao", 10, 500)
    categoria = data.get("categoria")
    if categoria not in CATEGORIAS:
        invalid("categoria", "Selecione Refeições, Lanches, Sobremesas ou Bebidas.")
    preco = integer_value(data, "preco_centavos", 1, 1_000_000)
    tempo = integer_value(data, "tempo_preparo_minutos", 1, 240)
    ativo = data.get("ativo", True)
    if type(ativo) is not bool:
        invalid("ativo", "Informe true ou false.")
    return dict(nome=nome, descricao=descricao, categoria=categoria,
                preco_centavos=preco, ativo=ativo, tempo_preparo_minutos=tempo)


def validate_checkout(data):
    nome = text_value(data, "nome", 2, 100)
    email = text_value(data, "email", 5, 254)
    if not re.fullmatch(r"[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+", email):
        invalid("email", "Informe um e-mail válido, como nome@exemplo.com.")
    endereco = text_value(data, "endereco", 8, 250)
    itens = data.get("itens")
    if not isinstance(itens, list) or not 1 <= len(itens) <= 100:
        invalid("itens", "O carrinho deve conter entre 1 e 100 itens diferentes.")
    normalized = []
    seen = set()
    for index, item in enumerate(itens):
        if not isinstance(item, dict):
            invalid(f"itens.{index}", "Informe um objeto com prato_id e quantidade.")
        try:
            prato_id = integer_value(item, "prato_id", 1, 2_147_483_647)
            quantidade = integer_value(item, "quantidade", 1, 99)
        except DomainError as error:
            error.fields = {f"itens.{index}.{key}": value for key, value in error.fields.items()}
            raise
        if prato_id in seen:
            invalid(f"itens.{index}.prato_id", "Agrupe a quantidade do prato em um único item.")
        seen.add(prato_id)
        normalized.append((prato_id, quantidade))
    return nome, email, endereco, normalized
