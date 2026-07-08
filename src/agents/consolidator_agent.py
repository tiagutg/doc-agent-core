import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def criar_agente_consolidador():
    chave = os.getenv("GEMINI_API_KEY")
    if not chave:
        raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada!")
        
    client = genai.Client(api_key=chave)
    
    prompt_sistema = (
        "Você é um Arquiteto de Sistemas e Engenheiro de Software Principal. "
        "Sua especialidade é analisar metadados de múltiplos arquivos de um sistema e gerar "
        "uma visão consolidada, unificada e macro da arquitetura do projeto."
    )
    
    return client, prompt_sistema

def estruturar_tarefa_consolidacao(dados_base_conhecimento: str):
    prompt_tarefa = f"""Abaixo estão os relatórios em JSON extraídos de arquivos individuais do sistema:\n\n{dados_base_conhecimento}\n\n
    Com base nesses dados, gere uma Documentação de Arquitetura Unificada em Markdown (.md) seguindo esta estrutura:
    
    # Mapa de Arquitetura do Sistema
    
    ## 1. Fluxo de Execução (Jornada dos Dados)
    Explique como os dados entram no sistema e por quais arquivos eles passam (ex: Quem chama quem?).
    
    ## 2. Mapa de Dependências e Componentes
    Crie uma lista unificada mostrando os papéis de cada componente mapeado (Controllers, Services, etc.).
    
    ## 3. Regras de Negócio Consolidadas
    Junte todas as regras de negócio identificadas nos arquivos em uma lista mestre categórica.
    
    ## 4. Segurança e Tratamento de Erros Global
    Resuma quais padrões de segurança e erros o sistema mapeia como um todo.
    
    Seja formal, analítico e evite repetições desnecessárias."""
    
    return prompt_tarefa