async function requisicao(caminho, { metodo = "GET", corpo = null } = {}){
    const opcoes = {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        }
    }
    if (corpo !== null){
        opcoes.body = JSON.stringify(corpo)
    }

    let resposta
    try{
        resposta = await fetch(caminho, opcoes)
    } catch (erroRede){
        throw new Error("Não foi possível conectar ao servidor")
    }

    const dados = await resposta.json()
    if (!resposta.ok){
        throw new Error(dados.erro || dados.mensagem || "Ocorreu um erro na requisição")
    }

    return dados
}

async function apiLogin(credenciais){
    return await requisicao("/api/login", {
        metodo: "POST",
        corpo: credenciais.toJSON()
    })
}

async function apiLogout(){
    return await requisicao("/api/logout", {
        metodo: "POST"
    })
}

async function apiUsuarioAtual(){
    return await requisicao("/api/me", {
        metodo: "GET"
    })
}

async function apiCadastrarCliente(cadastro){
    return await requisicao("/api/clientes", {
        metodo: "POST",
        corpo: cadastro.toJSON()
    })
}

async function apiCadastrarCozinheiro(cadastro){
    return await requisicao("/api/cozinheiros", {
        metodo: "POST",
        corpo: cadastro.toJSON()
    })
}

async function apiAlterarSenha(alteracao){
    return await requisicao("/api/senha", {
        metodo: "PUT",
        corpo: alteracao.toJSON()
    })
}

async function apiBuscarPratos(){
    return await requisicao("/api/pratos", {
        metodo: "GET"
    })
}

async function apiCriarPrato(prato){
    return await requisicao("/api/pratos", {
        metodo: "POST",
        corpo: prato.toJSON()
    })
}

async function apiAtualizarPrato(id, prato){
    return await requisicao(`/api/pratos/${id}`, {
        metodo: "PUT",
        corpo: prato.toJSON()
    })
}

async function apiRemoverPrato(id){
    return await requisicao(`/api/pratos/${id}`, {
        metodo: "DELETE"
    })
}

async function apiCriarPedido(pedido){
    return await requisicao("/api/pedidos", {
        metodo: "POST",
        corpo: pedido.toJSON()
    })
}

async function apiBuscarPedidos(){
    return await requisicao("/api/pedidos", {
        metodo: "GET"
    })
}

async function apiAtualizarStatusPedido(id, status, tempoEstimado = null){
    return await requisicao(`/api/pedidos/${id}/status`, {
        metodo: "PATCH",
        corpo: { status, tempoEstimado }
    })
}

async function apiBuscarCozinheiros(){
    return await requisicao("/api/cozinheiros", {
        metodo: "GET"
    })
}

async function apiAprovarCozinheiro(id){
    return await requisicao(`/api/cozinheiros/${id}/aprovar`, {
        metodo: "PATCH"
    })
}
