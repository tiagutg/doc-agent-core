import os
import json
import io
import markdown
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from xhtml2pdf import pisa
from docx import Document # Adicionado para gerar Word

# Importações de extensões
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension

# Importações da sua lógica de IA
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
# ROTA: Gerar PDF 
# ============================================================
@app.post("/api/gerar-pdf")
async def gerar_pdf(payload: dict):
    texto_markdown = payload.get("texto", "") # Alterado de 'markdown' para 'texto'
    if not texto_markdown:
        raise HTTPException(status_code=400, detail="Texto não fornecido no payload.")
    
    html_puro = markdown.markdown(texto_markdown, extensions=[TableExtension(), FencedCodeExtension()])
    
    css_estilo = """
    <style>
        @page { size: a4; margin: 2.5cm; }
        body { font-family: Arial, sans-serif; font-size: 11pt; }
        h1 { color: #0f3c5c; }
        pre { background-color: #f4f4f4; padding: 12px; }
    </style>
    """
    html_completo = f"<html><head>{css_estilo}</head><body>{html_puro}</body></html>"
    
    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(html_completo, dest=pdf_buffer)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=documentacao.pdf"}
    )

# ============================================================
# ROTA: Gerar DOCX 
# ============================================================
@app.post("/api/gerar-doc")
async def gerar_doc(payload: dict):
    texto = payload.get("texto", "Conteúdo não fornecido")
    
    doc = Document()
    doc.add_heading('Documentação Técnica', 0)
    doc.add_paragraph(texto)
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=documentacao.docx"}
    )