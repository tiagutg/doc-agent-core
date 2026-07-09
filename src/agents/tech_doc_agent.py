import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def criar_agente_documentador_tecnico():
    chave = os.getenv("GEMINI_API_KEY")
    if not chave:
        raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada!")
        
    client = genai.Client(api_key=chave)
    
    prompt_sistema = (
        "Você é um Redator Técnico especializado em Engenharia de Software Backend (Technical Writer). "
        "Sua missão é pegar resumos de arquitetura e transformá-los em um manual técnico de referência completo "
        "e rigoroso para a equipe de engenharia e DevOps."
    )
    
    return client, prompt_sistema

def estruturar_tarefa_documento_final(mapa_arquitetura: str):
    prompt_tarefa = f"""Com base no seguinte Mapa de Arquitetura Consolidada:\n\n{mapa_arquitetura}\n\n
    Gere a DOCUMENTAÇÃO TÉCNICA DO BACKEND definitiva em formato Markdown (.md). Siga este sumário:
    
    #  Documentação Oficial de Engenharia - Backend
    
    ## 1. Visão Geral do Sistema e Tecnologias
    Detalhamento macro das camadas (Controllers, Services) baseando-se no mapa fornecido.
    
    ## 2. Guia de Instalação e Inicialização Local
    Como configurar o ambiente virtual, instalar dependências e rodar o projeto (pense nos passos padrão com python e virtualenv).
    
    ## 3. Estrutura de Diretórios de Referência
    Explique o papel arquitetural das pastas dominantes (src, agents, config, utils).
    
    ## 4. Catálogo de Endpoints e Fluxo de Dados Bruto
    Mapeie os endpoints citados, os métodos HTTP aceitos e a validação de regras de negócio de ponta a ponta.
    
    Escreva de forma extremamente polida, clara, exaustiva e usando blocos de código onde julgar necessário."""
    
    return prompt_tarefa