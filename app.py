import os
import json
import io
import markdown
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from xhtml2pdf import pisa

# ====== IMPORTAÇÕES ADICIONADAS PARA CORRIGIR O ERRO DE EXTENSÃO ======
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension
# =====================================================================

# Importando a inteligência que já criamos nos seus agentes
from google.genai import types
from src.agents.doc_agent import criar_agente_analisador_arquivos, estruturar_tarefa_analise
from src.config.schema import AnaliseArquivoJSON
from src.agents.consolidator_agent import criar_agente_consolidador, estruturar_tarefa_consolidacao
from src.agents.tech_doc_agent import criar_agente_documentador_tecnico, estruturar_tarefa_documento_final

app = FastAPI(
    title="Doc Agent Core API",
    description="API REST para análise e documentação automatizada de sistemas backend",
    version="1.0.0"
)

# Modelos de dados (Schemas de entrada para a API)
class RequisicaoAnalise(BaseModel):
    nome_arquivo: str
    conteudo_codigo: str

class RequisicaoConsolidacao(BaseModel):
    relatorios_json: List[str]


# ========================================================
# NOVA ROTA: Adaptada para o n8n (Recebe Arquivo Binário)
# ========================================================
@app.post("/analisar")
async def analisar_arquivo_binario(file: UploadFile = File(...)):
    try:
        # 1. Lê o arquivo vindo do n8n
        conteudo = await file.read()
        conteudo_codigo = conteudo.decode("utf-8")
        nome_arquivo = file.filename

        # 2.Chama o seu Agente Analisador nativo
        client, sistema = criar_agente_analisador_arquivos()
        tarefa = estruturar_tarefa_analise(nome_arquivo, conteudo_codigo)
        
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
        return json.loads(resposta.text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise do n8n: {str(e)}")


# ==========================================
# ROTA 1: Analisar arquivo individual (JSON)
# ==========================================
@app.post("/api/analisar", response_model=AnaliseArquivoJSON)
async def analisar_arquivo(dados: RequisicaoAnalise):
    try:
        client, sistema = criar_agente_analisador_arquivos()
        tarefa = estruturar_tarefa_analise(dados.nome_arquivo, dados.conteudo_codigo)
        
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
        return json.loads(resposta.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")


# ==========================================
# ROTA 2: Consolidar e Gerar Documento Final
# ==========================================
@app.post("/api/documentar")
async def consolidar_e_documentar(dados: RequisicaoConsolidacao):
    try:
        # 1. Agrupa os JSONs recebidos para o Consolidador
        dados_base_conhecimento = ""
        for i, relatorio in enumerate(dados.relatorios_json, start=1):
            dados_base_conhecimento += f"\n\n--- DADOS DE ANÁLISE COMPONENTE {i} ---\n{relatorio}"
            
        # 2. Executa a Consolidação (Mapa Macro)
        client_c, sistema_c = criar_agente_consolidador()
        tarefa_c = estruturar_tarefa_consolidacao(dados_base_conhecimento)
        
        resposta_c = client_c.models.generate_content(
            model='gemini-2.5-flash',
            contents=tarefa_c,
            config={'system_instruction': sistema_c}
        )
        mapa_arquitetura = resposta_c.text
        
        # 3. Executa a Geração do Documento Técnico Final
        client_t, sistema_t = criar_agente_documentador_tecnico()
        tarefa_t = estruturar_tarefa_documento_final(mapa_arquitetura)
        
        resposta_t = client_t.models.generate_content(
            model='gemini-2.5-flash',
            contents=tarefa_t,
            config={'temperature': 0.2}
        )
        
        # Retorna o Markdown final pronto para o n8n salvar onde quiser
        return {
            "status": "sucesso",
            "mapa_macro": mapa_arquitetura,
            "documentacao_final_markdown": resposta_t.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na consolidação: {str(e)}")


# ============================================================
# ROTA 3: Converte o Markdown em PDF Estilizado (Padrão Word)
# ============================================================
@app.post("/api/gerar-pdf")
async def gerar_pdf(payload: dict):
    try:
        # 1. Log para ver no terminal o que está chegando do n8n
        print("====== PAYLOAD RECEBIDO DO N8N ======")
        print(payload)
        print("=====================================")

        texto_markdown = payload.get("markdown", "")
        if not texto_markdown:
            raise HTTPException(status_code=400, detail="Markdown não fornecido no payload.")
        
        # 2. Tenta converter com extensões, se der erro de tipo, tenta o plano B (texto puro)
        try:
            html_puro = markdown.markdown(
                texto_markdown, 
                extensions=[TableExtension(), FencedCodeExtension()]
            )
        except Exception as err_markdown:
            print(f"Erro nas extensões do markdown: {err_markdown}")
            # Plano B: Gera o HTML sem extensões para não travar o processo
            html_puro = markdown.markdown(texto_markdown)
        
        # 3. Design e Folha de Estilo CSS
        css_estilo = """
        <style>
            @page { size: a4; margin: 2.5cm; }
            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333333; }
            h1 { font-size: 22pt; color: #0f3c5c; border-bottom: 2px solid #0f3c5c; }
            h2 { font-size: 16pt; color: #1d6394; }
            pre { background-color: #f4f4f4; padding: 12px; border-left: 4px solid #1d6394; }
        </style>
        """
        
        html_completo = f"<html><head>{css_estilo}</head><body>{html_puro}</body></html>"
        
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_completo, dest=pdf_buffer)
        
        if pisa_status.err:
            raise HTTPException(status_code=500, detail="Erro interno do xhtml2pdf ao renderizar.")
        
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": "attachment; filename=documentacao_backend.pdf"}
        )
    except Exception as e:
        # Se estourar o NotImplementedType, o print vai nos dizer onde foi
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno rastreado: {str(e)}")