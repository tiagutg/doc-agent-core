import os

def ler_arquivo_local(caminho_arquivo: str) -> str:
   
    # 1. Verifica se o arquivo existe
    if not os.path.exists(caminho_arquivo):
        return f"ERRO: O arquivo no caminho '{caminho_arquivo}' não foi encontrado."
    
    # 2. Verifica se é mesmo um arquivo
    if not os.path.isfile(caminho_arquivo):
        return f"ERRO: O caminho '{caminho_arquivo}' não aponta para um arquivo válido."
    
    try:
        # 3. Abre e lê o arquivo
        with open(caminho_arquivo, 'r', encoding='utf-8') as arquivo:
            conteudo = arquivo.read()
            
            if not conteudo.strip():
                return "AVISO: O arquivo está vazio."
                
            return conteudo
            
    except Exception as e:
        return f"ERRO: Não foi possível ler o arquivo: {str(e)}"