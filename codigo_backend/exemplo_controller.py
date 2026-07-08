# exemplo_controller.py
from codigo_backend.exemplo_backend import cadastrar_novo_usuario

def rota_api_registrar_usuario(requisicao_http):
    """
    POST /api/usuarios/registrar
    Recebe os dados brutos da requisição HTTP do Frontend e encaminha para o Service.
    """
    if requisicao_http.get("metodo") != "POST":
        return {"status": 405, "corpo": {"erro": "Método não permitido. Use POST."}}
        
    dados = requisicao_http.get("dados", {})
    nome = dados.get("nome")
    email = dados.get("email")
    senha = dados.get("senha")
    
    # Chama a regra de negócio do arquivo service
    resultado = cadastrar_novo_usuario(nome, email, senha)
    
    if not resultado["sucesso"]:
        return {"status": 400, "corpo": {"erro": resultado["erro"]}}
        
    return {"status": 201, "corpo": {"mensagem": resultado["mensagem"]}}