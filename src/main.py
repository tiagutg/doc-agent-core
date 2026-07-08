import os
import json
import time
from google.genai import types
from src.utils.file_reader import ler_arquivo_local, listar_arquivos_python
from src.agents.doc_agent import criar_agente_analisador_arquivos, estruturar_tarefa_analise
from src.config.schema import AnaliseArquivoJSON

def rodar_pipeline_analise_em_lote():
    print("[1/4] Inicializando Motor de Análise Estruturada em Lote...")
    client, sistema = criar_agente_analisador_arquivos()
    
    pasta_alvo = "codigo_backend"
    arquivos_py = listar_arquivos_python(pasta_alvo)
    
    if not arquivos_py:
        print(f" AVISO: Nenhum arquivo .py encontrado na pasta '{pasta_alvo}'.")
        return
        
    print(f"[2/4] Encontrados {len(arquivos_py)} arquivos para análise na pasta '{pasta_alvo}'.")
    
   # Esteira de processamento (Loop)
    for i, caminho_completo in enumerate(arquivos_py, start=1):
        # Pega apenas o nome do arquivo para usar no relatório (ex: "login.py")
        nome_arquivo = os.path.basename(caminho_completo) 
        
        print(f"\n [{i}/{len(arquivos_py)}] Processando: '{caminho_completo}'...")
        
        # Lê o arquivo usando o caminho completo diretamente
        conteudo_codigo = ler_arquivo_local(caminho_completo)
        
        if conteudo_codigo.startswith("ERRO:"):
            print(f" Pulando arquivo devido a erro: {conteudo_codigo}")
            continue
            
        tarefa = estruturar_tarefa_analise(nome_arquivo, conteudo_codigo)
        
        print(" Solicitando metadados ao Gemini...")
        resposta = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=tarefa,
            config=types.GenerateContentConfig(
                system_instruction=sistema,
                response_mime_type="application/json",
                response_schema=AnaliseArquivoJSON,
                temperature=0.1
            ),
        )
        
        # Define o nome da saída com base no arquivo original
        nome_base = os.path.splitext(nome_arquivo)[0]
        arquivo_saida = f"analise_{nome_base}.json"
        
        # Salva o JSON na raiz
        dados_json = json.loads(resposta.text)
        with open(arquivo_saida, "w", encoding="utf-8") as f:
            json.dump(dados_json, f, indent=2, ensure_ascii=False)
            
        print(f"   Salvo com sucesso em '{arquivo_saida}'")
        
        # Uma pequena pausa de segurança entre requisições (evita estourar o limite da API do Gemini)
        time.sleep(1)
        
    print(f"\n[SUCESSO] Esteira concluída! Toda a pasta '{pasta_alvo}' foi mapeada.")

if __name__ == "__main__":
    rodar_pipeline_analise_em_lote()