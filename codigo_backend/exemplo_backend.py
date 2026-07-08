import os
import hashlib

# Simulação de um banco de dados em memória
BANCO_DE_DADOS_USUARIOS = {}

def criptografar_senha(senha: str) -> str:
    """Recebe uma senha em texto puro e retorna o hash SHA-256."""
    return hashlib.sha256(senha.encode('utf-8')).hexdigest()

def cadastrar_novo_usuario(nome: str, email: str, senha_pura: str) -> dict:
    """
    Cadastra um usuário no sistema.
    Verifica se o e-mail já existe e criptografa a senha antes de salvar.
    """
    if not email or "@" not in email:
        return {"sucesso": False, "erro": "E-mail inválido."}
        
    if email in BANCO_DE_DADOS_USUARIOS:
        return {"sucesso": False, "erro": "Este e-mail já está cadastrado."}
        
    if len(senha_pura) < 6:
        return {"sucesso": False, "erro": "A senha deve ter pelo menos 6 caracteres."}
        
    senha_segura = criptografar_senha(senha_pura)
    
    # Salva no banco simulado
    BANCO_DE_DADOS_USUARIOS[email] = {
        "nome": nome,
        "senha": senha_segura
    }
    
    return {"sucesso": True, "mensagem": f"Usuário {nome} cadastrado com sucesso!"}