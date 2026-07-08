import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def criar_agente_gerador_tecnico():
    chave = os.getenv("GEMINI_API_KEY")
    if not chave:
        raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada!")
        
    client = genai.Client(api_key=chave)
    
    prompt_sistema = (
        "Você é um Engenheiro de Software Principal responsável pela escrita de documentações técnicas oficiais (Readmes e Wikis). "
        "Seu tom é extremamente formal, exato, técnico e direto ao ponto."
    )
    
    return client, prompt_sistema

def estruturar_tarefa_documentacao_final(mapa_arquitetura: str):
    prompt_tarefa = f"""Com base no mapa de arquitetura unificado do sistema:\n\n{mapa_arquitetura}\n\n
    Gere a DOCUMENTAÇÃO TÉCNICA OFICIAL DO BACKEND em formato Markdown (.md) seguindo rigidamente esta estrutura:
    
    #  GUIA DE ENGENHARIA DO BACKEND
    
    ## 1. Visão Geral do Sistema
    Descreva resumidamente a arquitetura geral que foi implementada.
    
    ## 2. Endpoints e Rotas Disponíveis
    Crie uma seção detalhada para cada rota identificada, mostrando o método HTTP, os parâmetros esperados e o comportamento de sucesso/erro.
    
    ## 3. Segurança e Criptografia
    Explique detalhadamente as camadas de proteção de dados que este backend possui.
    
    ## 4. Guia de Manutenção e Extensão
    Dê instruções técnicas para que um novo programador saiba como criar novas regras de negócio ou rotas seguindo o mesmo padrão estrutural deste código.
    
    Gere um documento pronto para produção, sem marcas de rascunho."""
    
    return prompt_tarefa