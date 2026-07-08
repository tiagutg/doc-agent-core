import os
from src.agents.tech_doc_agent import criar_agente_gerador_tecnico, estruturar_tarefa_documentacao_final

def rodar_geracao_final():
    arquivo_mapa = "ARQUITETURA_CONSOLIDADA.md"
    
    if not os.path.exists(arquivo_mapa):
        print(f" ERRO: O arquivo '{arquivo_mapa}' não foi encontrado. Rode o 'consolidar.py' primeiro!")
        return
        
    print("[1/2] Lendo o mapa de arquitetura unificado...")
    with open(arquivo_mapa, "r", encoding="utf-8") as f:
        mapa_arquitetura = f.read()
        
    print("[2/2] Conectando ao Gemini Especialista em Documentação Técnica...")
    client, sistema = criar_agente_gerador_tecnico()
    tarefa = estruturar_tarefa_documentacao_final(mapa_arquitetura)
    
    print(" Compilando o Guia Oficial de Engenharia do Backend...")
    resposta = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=tarefa,
        config={'system_instruction': sistema}
    )
    
    arquivo_saida = "DOCUMENTACAO_TECNICA_BACKEND.md"
    with open(arquivo_saida, "w", encoding="utf-8") as f:
        f.write(resposta.text)
        
    print(f"\n[SUCESSO] Processo concluído! Guia salvo em: '{arquivo_saida}'")

if __name__ == "__main__":
    rodar_geracao_final()