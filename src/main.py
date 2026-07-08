import os
from src.utils.file_reader import ler_arquivo_local
from src.agents.doc_agent import criar_agente_e_tarefa_documentacao

def rodar_agente_documentador():
    print("[1/4] Iniciando o Motor do Agente de Documentação...")
    
    caminho_do_codigo = "exemplo_backend.py"
    
    print(f"[2/4] Lendo o arquivo de código: '{caminho_do_codigo}'...")
    conteudo_codigo = ler_arquivo_local(caminho_do_codigo)
    
    # Se o texto COMEÇAR com ERRO:, aí sim interrompe.
    if conteudo_codigo.startswith("ERRO:"):
        print(conteudo_codigo)
        return

    print("[3/4] Conectando diretamente ao Gemini...")
    client, sistema, tarefa = criar_agente_e_tarefa_documentacao(conteudo_codigo)

    print("\n O Gemini está analisando o seu código e escrevendo a documentação. Aguarda um momento...")
    
    # Chama o modelo atualizado oficial do Google
    resposta = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=tarefa,
        config={'system_instruction': sistema}
    )

    print("\n[4/4] Salvando o resultado final...")
    arquivo_saida = "DOCUMENTACAO_GERADA.md"
    with open(arquivo_saida, "w", encoding="utf-8") as f:
        f.write(resposta.text)

    print(f"[SUCESSO] Documentação gerada e salva em: '{arquivo_saida}'!")

if __name__ == "__main__":
    rodar_agente_documentador()