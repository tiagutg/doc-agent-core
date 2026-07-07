import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def criar_agente_e_tarefa_documentacao(conteudo_codigo: str):
    """
    Usa o cliente oficial do Google GenAI para analisar o código de forma leve.
    """
    # Inicializa o cliente oficial do Gemini
    client = genai.Client()
    
    prompt_sistema = (
        "Você é um Analista de Código Sênior especialista em arquitetura. "
        "Seu trabalho é ler códigos e explicar o funcionamento deles para outros desenvolvedores."
    )
    
    prompt_tarefa = f"""Analise cuidadosamente o seguinte código-fonte:\n\n{conteudo_codigo}\n\n
    Gere uma documentação técnica completa em formato Markdown (.md) contendo:
    1. **Visão Geral**: O que este arquivo/código faz de forma geral.
    2. **Mapeamento de Funções**: Uma lista de todas as funções encontradas.
    3. **Detalhamento por Função**: Para cada função, explique seus parâmetros de entrada, a lógica interna e o que ela retorna."""

    return client, prompt_sistema, prompt_tarefa