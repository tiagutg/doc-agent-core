import subprocess
import sys

def executar_passo(nome_passo: str, comando: list):
    print(f"\n==================================================")
    print(f" INICIANDO: {nome_passo}")
    print(f"==================================================")
    
    # Executa o comando no terminal e mostra a saída em tempo real
    resultado = subprocess.run(comando, text=True)
    
    if resultado.returncode != 0:
        print(f"\n ERRO: O {nome_passo} falhou. Interrompendo a esteira.")
        sys.exit(1)

def iniciar_esteira_completa():
    print(" Inicializando Orquestrador Automático do Backend...")
    
    # Passo 1: Rodar a extração de JSONs em lote
    executar_passo("1/3 - Extração de Metadados (Gemini Analista)", [sys.executable, "-m", "src.main"])
    
    # Passo 2: Rodar a consolidação da arquitetura
    executar_passo("2/3 - Consolidação de Arquitetura (Gemini Arquiteto)", [sys.executable, "consolidar.py"])
    
    # Passo 3: Rodar a geração do documento final
    executar_passo("3/3 - Compilação da Documentação (Technical Writer)", [sys.executable, "gerar_doc_final.py"])
    
    print("\n==================================================")
    print(" SUCESSO ABSOLUTO! Documentação compilada com sucesso.")
    print(" Seus JSONs, Mapa de Arquitetura e o Manual Técnico estão prontos!")
    print("==================================================")

if __name__ == "__main__":
    iniciar_esteira_completa()