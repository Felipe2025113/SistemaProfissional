let usuarioId = null;
export function selecionarUsuario(id) { usuarioId = id; }

export async function requisitar(caminho, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers = { Accept: 'application/json' };
    if (usuarioId !== null) headers['X-Demo-User'] = String(usuarioId);
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const resposta = await fetch(`/api${caminho}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    const json = await resposta.json();
    if (!resposta.ok) {
      const detalhes = json.error?.fields ? Object.entries(json.error.fields).map(([campo, mensagem]) => `${campo}: ${mensagem}`).join(' ') : '';
      const erro = new Error(detalhes || json.error?.message || 'Não foi possível concluir a operação.');
      erro.status = resposta.status;
      erro.fields = json.error?.fields;
      throw erro;
    }
    return json.data;
  } catch (erro) {
    if (erro.name === 'AbortError') throw new Error('A cozinha demorou a responder. Tente novamente.');
    if (erro instanceof TypeError) throw new Error('Sem conexão com o servidor. Verifique se o projeto está em execução.');
    throw erro;
  } finally { clearTimeout(timeout); }
}
