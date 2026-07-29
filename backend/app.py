import html
import io
import re
import unicodedata
from datetime import datetime
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.tables import TableExtension
import markdown
from pydantic import BaseModel
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xhtml2pdf import pisa

app = FastAPI(
    title="DocMind Core API",
    description="API de Conversão Direta de Markdown para PDF e DOCX - Mindworks",
    version="2.0.0",
)

COR_NAVY = "003366"
COR_ROYAL = "1D4ED8"
COR_CINZA_CLARO = "666666"

TITULOS_POR_TIPO = {
    "arquitetura-backend": "Documentação Técnica - Backend",
    "estrutura-frontend": "Documentação Técnica - Frontend",
    "visao-geral-cliente": "Visão Geral do Projeto",
}


class DocumentPayload(BaseModel):
    texto: str
    tipoDocumentacao: str = "visao-geral-cliente"
    titulo: str | None = None


def resolver_titulo(payload: DocumentPayload) -> str:
    if payload.titulo:
        return payload.titulo
    return TITULOS_POR_TIPO.get(payload.tipoDocumentacao, "Documentação Técnica")


def sanitizar_nome_arquivo(nome: str) -> str:
    nfkd = unicodedata.normalize("NFKD", nome)
    palavra_limpa = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return re.sub(r"[^a-zA-Z0-9-_]", "_", palavra_limpa).lower()


_FONTE_REGISTRADA = None


def _registrar_fonte_arial() -> str:
    global _FONTE_REGISTRADA
    if _FONTE_REGISTRADA:
        return _FONTE_REGISTRADA
    try:
        pasta_fontes = r"C:\Windows\Fonts"
        pdfmetrics.registerFont(TTFont("Arial", rf"{pasta_fontes}\arial.ttf"))
        pdfmetrics.registerFont(TTFont("Arial-Bold", rf"{pasta_fontes}\arialbd.ttf"))
        _FONTE_REGISTRADA = "Arial"
    except Exception:
        _FONTE_REGISTRADA = "Helvetica"
    return _FONTE_REGISTRADA


def _construir_css(fonte: str) -> str:
    return f"""
@page {{
    size: a4 portrait;
    margin: 2.5cm 2cm 2.5cm 2cm;
    @frame footer_frame {{
        -pdf-frame-content: footer_content;
        bottom: 1cm;
        margin-left: 2cm;
        margin-right: 2cm;
        height: 1cm;
    }}
}}
body {{
    font-family: {fonte}, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #222222;
}}
#cabecalho {{
    border-bottom: 2pt solid #{COR_NAVY};
    padding-bottom: 12px;
    margin-bottom: 20px;
}}
#cabecalho .marca {{
    color: #{COR_ROYAL};
    font-size: 8.5pt;
    font-weight: bold;
    margin: 0 0 4px 0;
}}
#cabecalho h1 {{
    color: #{COR_NAVY};
    font-size: 16pt;
    margin: 0;
}}
#cabecalho .data {{
    color: #{COR_CINZA_CLARO};
    font-size: 8pt;
    margin: 4px 0 0 0;
}}
h1, h2, h3 {{ color: #{COR_NAVY}; page-break-after: avoid; }}
h1 {{ font-size: 14pt; border-bottom: 1pt solid #{COR_NAVY}; margin-top: 18px; }}
h2 {{ font-size: 12pt; margin-top: 14px; }}
h3 {{ font-size: 10pt; margin-top: 10px; }}
p {{ margin: 6px 0; text-align: justify; }}
code {{ font-family: Courier, monospace; background-color: #f0f2f5; padding: 1px 4px; }}
pre {{ background-color: #f5f6f8; border-left: 3px solid #{COR_NAVY}; padding: 8px 12px; font-family: Courier, monospace; white-space: pre-wrap; }}
table {{ 
    border-collapse: collapse; 
    width: 100%; 
    margin: 12px 0; 
    font-size: 9pt; 
    table-layout: fixed; 
}}
th, td {{ 
    border: 1pt solid #d0d5dd; 
    padding: 6px 8px; 
    text-align: left; 
    word-wrap: break-word; 
    overflow: hidden; 
}}
th {{ background-color: #{COR_NAVY}; color: #ffffff; }}
#footer_content {{ font-size: 8pt; color: #{COR_CINZA_CLARO}; text-align: center; border-top: 0.5pt solid #d0d5dd; padding-top: 4px; }}
"""


def _inserir_numering_html(html_content: str) -> str:
    """Injeta numeração hierárquica (1., 1.1., etc.) diretamente nas tags h1, h2, h3 do HTML."""
    h1_count = 0
    h2_count = 0
    h3_count = 0

    def replace_match(match):
        nonlocal h1_count, h2_count, h3_count
        tag = match.group(1)
        content = match.group(2)

        if tag == 'h1':
            h1_count += 1
            h2_count = 0
            h3_count = 0
            prefix = f"{h1_count}. "
        elif tag == 'h2':
            if h1_count == 0: h1_count = 1
            h2_count += 1
            h3_count = 0
            prefix = f"{h1_count}.{h2_count}. "
        elif tag == 'h3':
            if h1_count == 0: h1_count = 1
            if h2_count == 0: h2_count = 1
            h3_count += 1
            prefix = f"{h1_count}.{h2_count}.{h3_count}. "
        else:
            prefix = ""

        return f"<{tag}>{prefix}{content}</{tag}>"

    return re.sub(r'<(h[123])>(.*?)</\1>', replace_match, html_content)


def _inserir_campo_word(paragrafo, instrucao_campo: str):
    run = paragrafo.add_run()
    inicio = OxmlElement("w:fldChar")
    inicio.set(qn("w:fldCharType"), "begin")
    instrucao = OxmlElement("w:instrText")
    instrucao.set(qn("xml:space"), "preserve")
    instrucao.text = instrucao_campo
    separador = OxmlElement("w:fldChar")
    separador.set(qn("w:fldCharType"), "separate")
    fim = OxmlElement("w:fldChar")
    fim.set(qn("w:fldCharType"), "end")
    run._r.append(inicio)
    run._r.append(instrucao)
    run._r.append(separador)
    run._r.append(fim)
    return run


def adicionar_cabecalho_rodape_docx(doc: Document, titulo_documento: str):
    marca = doc.add_paragraph()
    r_marca = marca.add_run("MINDWORKS")
    r_marca.font.name = "Arial"
    r_marca.font.size = Pt(8.5)
    r_marca.font.bold = True
    r_marca.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)

    titulo = doc.add_paragraph()
    r_titulo = titulo.add_run(titulo_documento)
    r_titulo.font.name = "Arial"
    r_titulo.font.size = Pt(16)
    r_titulo.font.bold = True
    r_titulo.font.color.rgb = RGBColor(0x00, 0x33, 0x66)

    data = doc.add_paragraph()
    r_data = data.add_run(f"Data de Emissão: {datetime.now().strftime('%B/%Y')}")
    r_data.font.name = "Arial"
    r_data.font.size = Pt(8.5)
    r_data.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    paragrafo = doc.sections[0].footer.paragraphs[0]
    paragrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_footer = paragrafo.add_run("Página ")
    r_footer.font.size = Pt(8)
    _inserir_campo_word(paragrafo, "PAGE")
    r_footer2 = paragrafo.add_run(" de ")
    r_footer2.font.size = Pt(8)
    _inserir_campo_word(paragrafo, "NUMPAGES")
    r_footer3 = paragrafo.add_run("    ·    Mindworks - Documento Confidencial")
    r_footer3.font.size = Pt(8)


@app.post("/api/gerar-pdf")
async def gerar_pdf(payload: DocumentPayload):
    fonte = _registrar_fonte_arial()
    
    html_conteudo = markdown.markdown(
        payload.texto, extensions=[TableExtension(), FencedCodeExtension()]
    )
    
    # Aplica a numeração diretamente nas tags HTML para garantir compatibilidade com o xhtml2pdf
    html_conteudo = _inserir_numering_html(html_conteudo)

    titulo_documento = html.escape(resolver_titulo(payload))
    data_geracao = f"Data de Emissão: {datetime.now().strftime('%B/%Y')}"

    html_completo = f"""
        <html>
        <head><meta charset="utf-8"><style>{_construir_css(fonte)}</style></head>
        <body>
            <div id="cabecalho">
                <p class="marca">MINDWORKS</p>
                <h1>{titulo_documento}</h1>
                <p class="data">{data_geracao}</p>
            </div>
            <div id="footer_content">
                Página <pdf:pagenumber/> de <pdf:pagecount/> &bull; Mindworks - Documento Confidencial
            </div>
            {html_conteudo}
        </body>
        </html>
    """

    pdf_buffer = io.BytesIO()
    pisa_status = pisa.CreatePDF(html_completo, dest=pdf_buffer)
    if pisa_status.err:
        raise HTTPException(status_code=500, detail="Erro ao gerar o arquivo PDF.")

    pdf_buffer.seek(0)
    nome_arquivo = sanitizar_nome_arquivo(resolver_titulo(payload))

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{nome_arquivo}.pdf"'
        },
    )


@app.post("/api/gerar-doc")
async def gerar_doc(payload: DocumentPayload):
    titulo_documento = resolver_titulo(payload)
    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    adicionar_cabecalho_rodape_docx(doc, titulo_documento)

    h1_count = 0
    h2_count = 0
    h3_count = 0

    for linha in payload.texto.split("\n"):
        if linha.startswith("# "):
            h1_count += 1
            h2_count = 0
            h3_count = 0
            texto_titulo = f"{h1_count}. {linha[2:]}"
            p = doc.add_paragraph(texto_titulo, style='Heading 1')
        elif linha.startswith("## "):
            if h1_count == 0: h1_count = 1
            h2_count += 1
            h3_count = 0
            texto_titulo = f"{h1_count}.{h2_count}. {linha[3:]}"
            p = doc.add_paragraph(texto_titulo, style='Heading 2')
        elif linha.startswith("### "):
            if h1_count == 0: h1_count = 1
            if h2_count == 0: h2_count = 1
            h3_count += 1
            texto_titulo = f"{h1_count}.{h2_count}.{h3_count}. {linha[4:]}"
            p = doc.add_paragraph(texto_titulo, style='Heading 3')
        else:
            p = doc.add_paragraph(linha)
            
        for run in p.runs:
            run.font.name = "Arial"
            if not p.style.name.startswith('Heading'):
                run.font.size = Pt(10)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    nome_arquivo = sanitizar_nome_arquivo(titulo_documento)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{nome_arquivo}.docx"'
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)