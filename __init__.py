"""Fábrica Flask. Cada aplicação ganha seu próprio conjunto de dados fictícios."""

from flask import Flask, request
from werkzeug.exceptions import HTTPException

from .controllers.api import api
from .controllers.pages import pages
from .models.store import MemoryStore
from .models.validation import DomainError
from .views.json_views import failure


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(MAX_CONTENT_LENGTH=64 * 1024, SEED_DATA=True)
    if test_config:
        app.config.update(test_config)
    app.json.ensure_ascii = False
    app.extensions["memory_store"] = MemoryStore(seed=app.config["SEED_DATA"])
    app.register_blueprint(api)
    app.register_blueprint(pages)

    @app.errorhandler(DomainError)
    def domain_error(error):
        return failure(error.code, error.message, error.status, error.fields)

    @app.errorhandler(HTTPException)
    def http_error(error):
        messages = {404: "Rota não encontrada.", 405: "Método HTTP não permitido.",
                    413: "O corpo da requisição ultrapassa o limite de 64 KiB."}
        response = error.get_response()
        response.data = app.json.dumps({"error": {"code": f"http_{error.code}",
                                                   "message": messages.get(error.code, "Requisição inválida.")}})
        response.content_type = "application/json"
        return response

    @app.errorhandler(500)
    def server_error(error):
        return failure("erro_interno", "Não foi possível concluir a operação. Tente novamente.", 500)

    @app.after_request
    def response_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    return app
