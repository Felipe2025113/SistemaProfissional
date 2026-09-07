"""Controller: HTTP, seleção de perfil demonstrativo e autorização de rotas."""

from functools import wraps
import re

from flask import Blueprint, current_app, g, request
from werkzeug.exceptions import BadRequest

from ..models.validation import DomainError
from ..views.json_views import pedido_json, prato_json, success, usuario_json


api = Blueprint("api", __name__, url_prefix="/api")


def store():
    return current_app.extensions["memory_store"]


@api.before_request
def load_demo_user():
    g.demo_user = None
    user_id = request.headers.get("X-Demo-User")
    if user_id is None:
        return
    if not re.fullmatch(r"[1-9][0-9]{0,9}", user_id):
        raise DomainError("perfil_invalido", "Selecione um perfil de demonstração válido.", 401)
    g.demo_user = store().user(int(user_id))
    if g.demo_user is None:
        raise DomainError("perfil_invalido", "Selecione um perfil de demonstração válido.", 401)


def roles(*perfis):
    def decorator(function):
        @wraps(function)
        def wrapped(*args, **kwargs):
            if g.demo_user is None:
                raise DomainError("perfil_necessario", "Selecione um perfil de demonstração.", 401)
            if g.demo_user.perfil not in perfis:
                raise DomainError("acesso_negado", "Este perfil não tem permissão para esta ação.", 403)
            return function(*args, **kwargs)
        return wrapped
    return decorator


def json_object():
    if not request.is_json:
        raise DomainError("json_necessario", "Envie Content-Type: application/json.", 400)
    try:
        payload = request.get_json()
    except BadRequest:
        raise DomainError("json_invalido", "O corpo da requisição contém JSON inválido.", 400) from None
    if not isinstance(payload, dict):
        raise DomainError("objeto_necessario", "Envie um objeto JSON.", 400)
    return payload


@api.get("/health")
def health():
    return success({"status": "ok", "storage": "memory"})


@api.get("/perfis")
def perfis():
    return success([usuario_json(user) for user in store().users()])


@api.get("/pratos")
def pratos():
    query = request.args.get("q", "").strip()
    if len(query) > 100:
        raise DomainError("validacao", "Use até 100 caracteres na busca.", 422, {"q": "Busca muito longa."})
    admin = g.demo_user is not None and g.demo_user.perfil == "administrador"
    return success([prato_json(prato) for prato in store().pratos(admin, query)])


@api.post("/pratos")
@roles("administrador")
def create_prato():
    return success(prato_json(store().create_prato(json_object())), 201)


@api.put("/pratos/<int:prato_id>")
@roles("administrador")
def update_prato(prato_id):
    return success(prato_json(store().update_prato(prato_id, json_object())))


@api.delete("/pratos/<int:prato_id>")
@roles("administrador")
def delete_prato(prato_id):
    return success(prato_json(store().deactivate_prato(prato_id)))


@api.get("/pedidos")
@roles("cliente", "administrador", "cozinheiro")
def pedidos():
    return success([pedido_json(pedido) for pedido in store().pedidos(g.demo_user)])


@api.get("/pedidos/<int:pedido_id>")
@roles("cliente", "administrador", "cozinheiro")
def pedido(pedido_id):
    return success(pedido_json(store().pedido(pedido_id, g.demo_user)))


@api.post("/pedidos")
@roles("cliente")
def create_pedido():
    return success(pedido_json(store().create_pedido(g.demo_user, json_object())), 201)


@api.patch("/pedidos/<int:pedido_id>/status")
@roles("cozinheiro")
def update_status(pedido_id):
    return success(pedido_json(store().update_status(pedido_id, json_object())))
