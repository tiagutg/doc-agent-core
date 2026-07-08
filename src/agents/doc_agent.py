import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from src.config.schema import AnaliseArquivoJSON

load_dotenv()

def criar_agente_analisador_arquivos():
    chave = os.getenv("GEMINI_API_KEY")
    if not chave:
        raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada no arquivo .env!")
        
    client = genai.Client(api_key=chave)
    
    # Prompt Mestre Agnóstico (System Prompt)
    prompt_sistema = (
        "Você é um motor de análise estática de código baseado em IA. Sua única função é extrair "
        "metadados estruturados de arquivos de código-fonte de qualquer linguagem (Python, Node, Java, Go, etc.).\n\n"
        "Regras estritas:\n"
        "1. Identifique automaticamente o papel arquitetural do arquivo (ex: controller, service, model, etc.) e preencha em 'role'.\n"
        "2. Se uma seção não se aplicar ao arquivo atual (ex: um service não tem 'api_endpoints'), retorne uma lista vazia [], NUNCA invente dados.\n"
        "3. Seja extremamente factual. Foque em extrair regras de negócio, dependências e tratamentos de erro visíveis."
    )
    
    return client, prompt_sistema

def estruturar_tarefa_analise(nome_arquivo: str, conteudo_codigo: str):
    # Prompt de Análise por Arquivo
    prompt_tarefa = f"""Analise o arquivo '{nome_arquivo}' e extraia suas propriedades para o formato JSON estruturado.
    
    Código-fonte:
    {conteudo_codigo}"""
    
    return prompt_tarefa