import os
import json
from google.genai import types
from src.utils.file_reader import ler_arquivo_local
from src.agents.doc_agent import criar_agente_analisador_arquivos, estruturar_tarefa_analise
from src.config.schema import AnaliseArquivoJSON

def rodar_pipeline_analise():
    print("[1/4] Inicializando Motor de Análise Estruturada...")
    client, sistema = criar_agente_analisador_arquivos()
    
    # Arquivo alvo da vez: o nosso controller
    nome_arquivo = "exemplo_controller.py"
    
    print(f"[2/4] Lendo conteúdo de '{nome_arquivo}'...")
    conteudo_codigo = ler_arquivo_local(nome_arquivo)
    
    if conteudo_codigo.startswith("ERRO:"):
        print(conteudo_codigo)
        return
        
    tarefa = estruturar_tarefa_analise(nome_arquivo, conteudo_codigo)
    
    print("[3/4] Gemini extraindo metadados agnósticos em JSON...")
    
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
    
    print("[4/4] Salvando metadados extraídos...")
    
    # DINÂMICO: Transforma "exemplo_controller.py" em "analise_exemplo_controller.json"
    nome_base = os.path.splitext(nome_arquivo)[0]
    arquivo_saida = f"analise_{nome_base}.json"
    
    # Valida e formata o JSON antes de salvar
    dados_json = json.loads(resposta.text)
    with open(arquivo_saida, "w", encoding="utf-8") as f:
        json.dump(dados_json, f, indent=2, ensure_ascii=False)
        
    print(f"\n[SUCESSO] Base de conhecimento alimentada! Dados salvos em '{arquivo_saida}'")

if __name__ == "__main__":
    run_pipeline_analise = rodar_pipeline_analise  # Mantendo a referência caso use aliases
    rodar_pipeline_analise()