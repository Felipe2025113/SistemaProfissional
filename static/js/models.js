class Usuario{
    #id
    #nome
    #email

    constructor(id, nome, email){
        if (id !== null && (!Number.isInteger(id) || id <= 0)){
            throw new Error("ID inválido")
        }
        this.#id = id
        this.nome = nome
        this.email = email
    }

    get id(){
        return this.#id
    }
    get nome(){
        return this.#nome
    }
    get email(){
        return this.#email
    }
    get perfil(){
        return "USUARIO"
    }

    set nome(novoNome){
        if (typeof novoNome != "string" || novoNome === "" || novoNome.length < 3 || novoNome.length > 100){
            throw new Error("O nome deve ter de 3 a 100 caracteres")
        }
        this.#nome = novoNome
    }

    set email(novoEmail){
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof novoEmail != "string" || novoEmail === "" || !emailValido.test(novoEmail)){
            throw new Error("Email inválido")
        }
        this.#email = novoEmail
    }

    toJSON(){
        return { id: this.#id, nome: this.#nome, email: this.#email }
    }

    static deJSON(obj){
        switch (obj.perfil){
            case "CLIENTE":
                return Cliente.deJSON(obj)
            case "ADM":
                return Administrador.deJSON(obj)
            case "COZINHEIRO":
                return Cozinheiro.deJSON(obj)
            default:
                throw new Error("Perfil de usuário inválido")
        }
    }
}

class Cliente extends Usuario{
    #endereco

    constructor(id, nome, email, endereco){
        super(id, nome, email)
        this.endereco = endereco
    }

    get endereco(){
        return this.#endereco
    }
    get perfil(){
        return "CLIENTE"
    }

    set endereco(novoEndereco){
        if (typeof novoEndereco != "string" || novoEndereco === "" || novoEndereco.length < 3 || novoEndereco.length > 100){
            throw new Error("O endereço deve ter de 3 a 100 caracteres")
        }
        this.#endereco = novoEndereco
    }

    toJSON(){
        return { ...super.toJSON(), endereco: this.#endereco }
    }

    static deJSON(obj){
        return new Cliente(obj.id, obj.nome, obj.email, obj.endereco)
    }
}

class Administrador extends Usuario{

    constructor(id, nome, email){
        super(id, nome, email)
        this.nivelPermissao = nivelPermissao
    }

    get perfil(){
        return "ADM"
    }

    toJSON(){
        return { ...super.toJSON }
    }

    static deJSON(obj){
        return new Administrador(obj.id, obj.nome, obj.email)
    }
}

class Cozinheiro extends Usuario{
    #turno
    #especialidade

    constructor(id, nome, email, turno, especialidade){
        super(id, nome, email)
        this.turno = turno
        this.especialidade = especialidade
    }

    get turno(){
        return this.#turno
    }
    get especialidade(){
        return this.#especialidade
    }
    get perfil(){
        return "COZINHEIRO"
    }

    set turno(novoTurno){
        const turnos = ["Manhã", "Tarde", "Noite"]
        if (novoTurno === "" || !turnos.includes(novoTurno)){
            throw new Error("Insira um turno válido")
        }
        this.#turno = novoTurno
    }

    set especialidade(novaEspec){
        const especialidades = ["Churrasqueiro", "Confeitaria", "Frutos do Mar", "Massas e molhos"]
        if (novaEspec === "" || !especialidades.includes(novaEspec)){
            throw new Error("Insira uma especialidade válida")
        }
        this.#especialidade = novaEspec
    }

    toJSON(){
        return { ...super.toJSON(), turno: this.#turno, especialidade: this.#especialidade }
    }

    static deJSON(obj){
        return new Cozinheiro(obj.id, obj.nome, obj.email, obj.turno, obj.especialidade)
    }
}

class Login{
    #email
    #senha

    constructor(email, senha){
        this.email = email
        this.senha = senha
    }

    get email(){
        return this.#email
    }

    set email(novoEmail){
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof novoEmail !== "string" || novoEmail === ""){
            throw new Error("Informe o e-mail")
        }
        if (!emailValido.test(novoEmail)){
            throw new Error("Email inválido")
        }
        this.#email = novoEmail
    }

    set senha(novaSenha){
        if (typeof novaSenha !== "string" || novaSenha === ""){
            throw new Error("Informe a senha")
        }
        this.#senha = novaSenha
    }

    toJSON(){
        return { email: this.#email, senha: this.#senha }
    }
}

class CadastroCliente{
    #nome
    #email
    #senha

    constructor(nome, email, senha){
        this.nome = nome
        this.email = email
        this.senha = senha
    }

    get nome(){
        return this.#nome
    }

    get email(){
        return this.#email
    }

    set nome(novoNome){
        if (typeof novoNome != "string" || novoNome === "" || novoNome.length < 3 || novoNome.length > 100){
            throw new Error("O nome deve ter de 3 a 100 caracteres")
        }
        this.#nome = novoNome
    }

    set email(novoEmail){
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof novoEmail != "string" || novoEmail === "" || !emailValido.test(novoEmail)){
            throw new Error("Email inválido")
        }
        this.#email = novoEmail
    }

    set senha(novaSenha){
        const senhaValida = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/
        if (typeof novaSenha !== "string" || !senhaValida.test(novaSenha)){
            throw new Error("A senha deve ter pelo menos 10 caracteres, contendo letras e números.")
        }
        this.#senha = novaSenha
    }

    toJSON(){
        return { nome: this.#nome, email: this.#email, senha: this.#senha }
    }
}

class CadastroCozinheiro{
    #nome
    #email
    #turno
    #especialidade

    constructor(nome, email, turno, especialidade){
        this.nome = nome
        this.email = email
        this.turno = turno
        this.especialidade = especialidade
    }

    get nome(){
        return this.#nome
    }
    get email(){
        return this.#email
    }
    get turno(){
        return this.#turno
    }
    get especialidade(){
        return this.#especialidade
    }

    set nome(novoNome){
        if (typeof novoNome != "string" || novoNome === "" || novoNome.length < 3 || novoNome.length > 100){
            throw new Error("O nome deve ter de 3 a 100 caracteres")
        }
        this.#nome = novoNome
    }

    set email(novoEmail){
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof novoEmail != "string" || novoEmail === "" || !emailValido.test(novoEmail)){
            throw new Error("Email inválido")
        }
        this.#email = novoEmail
    }

    set turno(novoTurno){
        const turnos = ["Manhã", "Tarde", "Noite"]
        if (novoTurno === "" || !turnos.includes(novoTurno)){
            throw new Error("Insira um turno válido")
        }
        this.#turno = novoTurno
    }

    set especialidade(novaEspec){
        const especialidades = ["Churrasqueiro", "Confeitaria", "Frutos do Mar", "Massas e molhos"]
        if (novaEspec === "" || !especialidades.includes(novaEspec)){
            throw new Error("Insira uma especialidade válida")
        }
        this.#especialidade = novaEspec
    }

    toJSON(){
        return { nome: this.#nome, email: this.#email, turno: this.#turno, especialidade: this.#especialidade }
    }
}

class Prato{
    #id
    #nome
    #descricao
    #preco
    #categoria
    #ativo

    constructor({ id = null, nome, descricao, preco, categoria, ativo = true } = {}){
        if (id !== null && (!Number.isInteger(id) || id <= 0)){
            throw new Error("ID inválido")
        }
        this.#id = id
        this.nome = nome
        this.descricao = descricao
        this.preco = preco
        this.categoria = categoria
        this.ativo = ativo
    }

    get id(){ return this.#id }
    get nome(){ return this.#nome }
    get descricao(){ return this.#descricao }
    get preco(){ return this.#preco }
    get categoria(){ return this.#categoria }
    get ativo(){ return this.#ativo }

    set nome(novoNome){
        if (typeof novoNome !== "string" || novoNome === "" || novoNome.length < 3 || novoNome.length > 100){
            throw new Error("O nome do prato deve ter de 3 a 100 caracteres")
        }
        this.#nome = novoNome
    }

    set descricao(novaDescricao){
        if (typeof novaDescricao !== "string" || novaDescricao === "" || novaDescricao.length < 3 || novaDescricao.length > 100){
            throw new Error("A descrição do prato deve ter de 3 a 100 caracteres")
        }
        this.#descricao = novaDescricao
    }

    set preco(novoPreco){
        const precoNum = Number(novoPreco)
        if (isNaN(precoNum) || precoNum < 0.01 || precoNum > 9999.99){
            throw new Error("O preço deve ser um número entre R$ 0,01 e R$ 9.999,99.")
        }
        this.#preco = precoNum
    }

    set categoria(novaCategoria){
        if (typeof novaCategoria !== "string" || novaCategoria === "" || novaCategoria.length < 3 || novaCategoria.length > 100){
            throw new Error("A categoria do prato deve ter de 3 a 100 caracteres")
        }
        this.#categoria = novaCategoria
    }

    set ativo(status){
        if (typeof status !== "boolean"){
            throw new Error("O status ativo deve ser um valor booleano (true ou false)")
        }
        this.#ativo = status
    }

    ativar(){
        this.#ativo = true
    }

    inativar(){
        this.#ativo = false
    }

    atualizar(dados){
        if ('nome' in dados) this.nome = dados.nome
        if ('descricao' in dados) this.descricao = dados.descricao
        if ('preco' in dados) this.preco = dados.preco
        if ('categoria' in dados) this.categoria = dados.categoria
        if ('ativo' in dados) this.ativo = dados.ativo
    }

    toJSON(){
        return { id: this.#id, nome: this.#nome, descricao: this.#descricao, preco: this.#preco, categoria: this.#categoria, ativo: this.#ativo }
    }

    static deJSON(obj){
        return new Prato(obj)
    }
}

class ItemPedido{
    #id
    #nome
    #quantidade
    #preco

    constructor({ id, nome, preco, quantidade = 1 } = {}){
        if (!Number.isInteger(id) || id <= 0){
            throw new Error("ID inválido")
        }
        this.#id = id
        this.nome = nome
        this.preco = preco
        this.quantidade = quantidade
    }

    get id(){
        return this.#id
    }
    get nome(){
        return this.#nome
    }
    get preco(){
        return this.#preco
    }
    get quantidade(){
        return this.#quantidade
    }
    get subtotal(){
        return Math.round(this.#preco * this.#quantidade * 100) / 100
    }

    set nome(novoNome){
        if (typeof novoNome != "string" || novoNome === "" || novoNome.length < 3 || novoNome.length > 100){
            throw new Error("Nome do item inválido")
        }
        this.#nome = novoNome
    }

    set preco(novoPreco){
        const precoNum = Number(novoPreco)
        if (isNaN(precoNum) || precoNum < 0){
            throw new Error("Preço inválido")
        }
        this.#preco = precoNum
    }

    set quantidade(novaQtd){
        const qtdNum = Number(novaQtd)
        if (!Number.isInteger(qtdNum) || qtdNum <= 0){
            throw new Error("A quantidade deve ser um número inteiro maior que zero")
        }
        this.#quantidade = qtdNum
    }

    toJSON(){
        return { id: this.#id, nome: this.#nome, preco: this.#preco, quantidade: this.#quantidade }
    }

    static dePrato(prato, quantidade = 1){
        if (!(prato instanceof Prato)){
            throw new Error("O prato deve ser uma instância da classe Prato")
        }
        return new ItemPedido({ id: prato.id, nome: prato.nome, preco: prato.preco, quantidade })
    }

    static deJSON(obj){
        return new ItemPedido(obj)
    }
}

class Carrinho{
    #itens

    constructor(itens = []){
        this.#itens = []
        if (Array.isArray(itens)){
            for (const item of itens){
                this.adicionarItem(item)
            }
        }
    }

    get itens(){
        return [...this.#itens]
    }

    get total(){
        const soma = this.#itens.reduce((acumulado, item) => acumulado + item.subtotal, 0)
        return Math.round(soma * 100) / 100
    }

    adicionarItem(item){
        if (!(item instanceof ItemPedido)){
            throw new Error("O item deve ser uma instância da classe ItemPedido")
        }
        const itemExistente = this.#itens.find(i => i.id === item.id)
        if (itemExistente){
            itemExistente.quantidade += item.quantidade
        } else {
            this.#itens.push(item)
        }
    }

    diminuirQuantidade(idItem){
        const item = this.#itens.find(i => i.id === idItem)
        if (!item){
            throw new Error("Item não encontrado no carrinho")
        }
        if (item.quantidade > 1){
            item.quantidade -= 1
        } else {
            this.removerItem(idItem)
        }
    }

    removerItem(idItem){
        const index = this.#itens.findIndex(i => i.id === idItem)
        if (index === -1){
            throw new Error("Item não encontrado no carrinho")
        }
        this.#itens.splice(index, 1)
    }

    limparCarrinho(){
        this.#itens = []
    }

    toJSON(){
        return { itens: this.#itens.map(item => item.toJSON()), total: this.total }
    }

    static deJSON(obj){
        const itens = (obj.itens ?? []).map(itemObj => ItemPedido.deJSON(itemObj))
        return new Carrinho(itens)
    }
}

class Pedido{
    #id
    #idCliente
    #nomeCliente
    #endereco
    #itens
    #status
    #tempoEstimado = null

    static #fluxo = {
        "Recebido": ["Em Preparo"],
        "Em Preparo": ["Pronto"],
        "Pronto": ["Entregue"],
        "Entregue": []
    }

    constructor(id = null, idCliente, nomeCliente, endereco, itens, status = "Recebido", tempoEstimado = null){
        if (id !== null && (!Number.isInteger(id) || id <= 0)){
            throw new Error("ID do pedido inválido")
        }
        if (!Object.keys(Pedido.#fluxo).includes(status)){
            throw new Error("Status do pedido inválido")
        }
        this.#id = id
        this.idCliente = idCliente
        this.nomeCliente = nomeCliente
        this.endereco = endereco
        this.itens = itens
        this.#status = status
        if (tempoEstimado !== null){
            this.#tempoEstimado = this.#validarMinutos(tempoEstimado)
        }
    }

    get id(){ return this.#id }
    get idCliente(){ return this.#idCliente }
    get nomeCliente(){ return this.#nomeCliente }
    get endereco(){ return this.#endereco }
    get itens(){ return [...this.#itens] }
    get status(){ return this.#status }
    get tempoEstimado(){ return this.#tempoEstimado }

    get total(){
        const soma = this.#itens.reduce((acumulado, item) => acumulado + item.subtotal, 0)
        return Math.round(soma * 100) / 100
    }

    get naFila(){
        return this.#status === "Recebido" || this.#status === "Em Preparo"
    }

    get pronto(){
        return this.#status === "Pronto"
    }

    set idCliente(novoId){
        if (!Number.isInteger(novoId) || novoId <= 0){
            throw new Error("ID do cliente inválido")
        }
        this.#idCliente = novoId
    }

    set nomeCliente(novoNome){
        if (typeof novoNome !== "string" || novoNome === "" || novoNome.length < 3 || novoNome.length > 100){
            throw new Error("Nome do cliente inválido")
        }
        this.#nomeCliente = novoNome
    }

    set endereco(novoEndereco){
        if (typeof novoEndereco !== "string" || novoEndereco === "" || novoEndereco.length < 3 || novoEndereco.length > 100){
            throw new Error("Endereço de entrega inválido")
        }
        this.#endereco = novoEndereco
    }

    set itens(novosItens){
        if (!Array.isArray(novosItens) || novosItens.length === 0){
            throw new Error("O pedido deve ter pelo menos um item")
        }
        if (!novosItens.every(item => item instanceof ItemPedido)){
            throw new Error("Todos os itens do pedido devem ser instâncias da classe ItemPedido")
        }
        this.#itens = [...novosItens]
    }

    #validarMinutos(minutos){
        const minNum = Number(minutos)
        if (!Number.isInteger(minNum) || minNum < 1 || minNum > 240){
            throw new Error("O tempo estimado de preparo deve ser entre 1 e 240 minutos")
        }
        return minNum
    }

    #avancarPara(statusDesejado){
        const permitidos = Pedido.#fluxo[this.#status]
        if (!permitidos.includes(statusDesejado)){
            throw new Error(`Transição de status inválida de '${this.#status}' para '${statusDesejado}'`)
        }
        this.#status = statusDesejado
    }

    iniciarPreparo(minutos){
        const minNum = this.#validarMinutos(minutos)
        this.#avancarPara("Em Preparo")
        this.#tempoEstimado = minNum
    }

    marcarPronto(){
        this.#avancarPara("Pronto")
    }

    marcarEntregue(){
        this.#avancarPara("Entregue")
    }

    toJSON(){
        return {
            id: this.#id,
            idCliente: this.#idCliente,
            nomeCliente: this.#nomeCliente,
            endereco: this.#endereco,
            itens: this.#itens.map(item => item.toJSON()),
            status: this.#status,
            tempoEstimado: this.#tempoEstimado,
            total: this.total
        }
    }

    static doCarrinho(carrinho, cliente, endereco){
        return new Pedido(
            null,
            cliente.id,
            cliente.nome,
            endereco || cliente.endereco,
            carrinho.itens
        )
    }

    static deJSON(obj){
        return new Pedido(
            obj.id,
            obj.idCliente,
            obj.nomeCliente,
            obj.endereco,
            (obj.itens ?? []).map(item => ItemPedido.deJSON(item)),
            obj.status,
            obj.tempoEstimado ?? null
        )
    }
}
