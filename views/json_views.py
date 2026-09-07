"""View: converte entidades em estruturas JSON públicas e respostas HTTP."""

from dataclasses import asdict

from flask import jsonify


def usuario_json(usuario):
    data = {"id": usuario.id, "nome": usuario.nome, "email": usuario.email, "perfil": usuario.perfil}
    if usuario.perfil == "cliente":
        data["endereco"] = usuario.endereco
    elif usuario.perfil == "administrador":
        data["nivel_permissao"] = usuario.nivel_permissao
    else:
        data.update(turno=usuario.turno, especialidade=usuario.especialidade)
    return data


def prato_json(prato):
    return asdict(prato)


def pedido_json(pedido):
    data = asdict(pedido)
    data["total_centavos"] = pedido.total_centavos
    data["itens"] = [{**asdict(item), "subtotal_centavos": item.subtotal_centavos} for item in pedido.itens]
    return data


def success(data, status=200):
    return jsonify(data=data), status


def failure(code, message, status, fields=None):
    error = {"code": code, "message": message}
    if fields:
        error["fields"] = fields
    return jsonify(error=error), status
