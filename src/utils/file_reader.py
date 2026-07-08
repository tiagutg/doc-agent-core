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


def listar_arquivos_python(caminho_pasta: str) -> list:
    """
    Retorna o caminho de todos os arquivos .py dentro de uma pasta e suas subpastas.
    """
    if not os.path.exists(caminho_pasta):
        return []
    
    arquivos_encontrados = []
    
    # os.walk entra em todas as subpastas automaticamente
    for raiz, diretorios, arquivos in os.walk(caminho_pasta):
        for arquivo in arquivos:
            if arquivo.endswith(".py"):
                # Guarda o caminho completo para o main conseguir ler depois
                caminho_completo = os.path.join(raiz, arquivo)
                arquivos_encontrados.append(caminho_completo)
                
    return arquivos_encontrados