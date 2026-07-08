import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def criar_agente_e_tarefa_documentacao(conteudo_codigo: str):
    chave = os.getenv("GEMINI_API_KEY")
    if not chave:
        raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada no arquivo .env!")
        
    client = genai.Client(api_key=chave)
    
    prompt_sistema = (
        "Você é um Engenheiro de Software Sênior e Arquiteto de Sistemas. "
        "Seu trabalho é gerar documentações técnicas extremamente detalhadas, organizadas e limpas "
        "para que novos desenvolvedores entendam o código instantaneamente."
    )
    
    prompt_tarefa = f"""Analise detalhadamente o seguinte código de backend:\n\n{conteudo_codigo}\n\n
    Gere uma documentação técnica profissional em formato Markdown (.md) seguindo rigorosamente esta estrutura:
    
    # 🛠️ Documentação Técnica do Módulo
    
    ## 1. Visão Geral e Arquitetura
     Explique o propósito macro deste arquivo e como ele gerencia os dados.
    
    ## 2. Dicionário de Funções
    Crie uma **tabela** contendo:
    * Nome da Função
    * Parâmetros esperados (e tipos)
    * O que ela retorna
    * Descrição curta
    
    ## 3. Análise de Regras de Negócio e Segurança
    * Liste as validações que o código faz (ex: tamanho de senha, checagem de e-mail).
    * Identifique qual técnica de segurança/criptografia foi utilizada.
    
    ## 4. Exemplos de Uso (Inputs e Outputs)
    Crie exemplos fictícios em formato de bloco de código de como chamar a função principal e o dicionário que ela retorna em caso de sucesso e em caso de erro.
    
    Seja direto, técnico e profissional."""

    return client, prompt_sistema, prompt_tarefa