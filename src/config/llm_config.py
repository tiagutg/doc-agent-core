import os
from google import genai
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

def obter_cliente_gemini():
    """
    Verifica as credenciais e retorna a instância oficial do cliente Google GenAI.
    """
    chave = os.getenv("GEMINI_API_KEY")
    
    if not chave:
        raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada no arquivo .env!")
        
    # Inicializa o cliente com a chave configurada
    client = genai.Client(api_key=chave)
    return client