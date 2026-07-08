import os
import json
from src.agents.consolidator_agent import criar_agente_consolidador, estruturar_tarefa_consolidacao

def rodar_consolidacao():
    print("[1/3] Varrendo a Base de Conhecimento por metadados...")
    
    dados_consolidados = ""
    arquivos_encontrados = 0
    
    # Busca por todos os JSONs gerados na raiz
    for arquivo in os.listdir("."):
        if arquivo.startswith("analise_") and arquivo.endswith(".json"):
            print(f" Lendo metadados de: {arquivo}")
            with open(arquivo, "r", encoding="utf-8") as f:
                conteudo_json = f.read()
                dados_consolidados += f"\n\n--- DADOS DE ANÁLISE: {arquivo} ---\n{conteudo_json}"
                arquivos_encontrados += 1
                
    if arquivos_encontrados == 0:
        print("ERRO: Nenhum arquivo 'analise_*.json' foi encontrado na raiz.")
        return

    print(f"\n[2/3] Conectando ao Gemini Arquiteto com {arquivos_encontrados} documentos...")
    client, sistema = criar_agente_consolidador()
    tarefa = estruturar_tarefa_consolidacao(dados_consolidados)
    
    print(" O Arquiteto está cruzando os dados e montando o mapa do sistema...")
    resposta = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=tarefa,
        config={'system_instruction': sistema}
    )
    
    print("[3/3] Salvando o mapa de arquitetura...")
    arquivo_saida = "ARQUITETURA_CONSOLIDADA.md"
    with open(arquivo_saida, "w", encoding="utf-8") as f:
        f.write(resposta.text)
        
    print(f"\n[SUCESSO] Mapa de arquitetura unificado em: '{arquivo_saida}'!")

if __name__ == "__main__":
    rodar_consolidacao()