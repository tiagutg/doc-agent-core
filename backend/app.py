import io
import re
import html
from datetime import datetime
import markdown
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension

app = FastAPI(
    title="Doc Agent Core API",
    description="Converte documentação Markdown para PDF e DOCX com padrão corporativo",
    version="1.0.0",
)

# Cores corporativas (mesma identidade usada no restante da plataforma)
COR_NAVY = "003366"
COR_ROYAL = "1D4ED8"
COR_CINZA_TEXTO = "444444"
COR_CINZA_CLARO = "666666"

TITULOS_POR_TIPO = {
    "arquitetura-backend": "Documentação Técnica — Backend",
    "estrutura-frontend": "Documentação Técnica — Frontend",
    "visao-geral-cliente": "Visão Geral do Projeto",
}

def resolver_titulo(payload: dict) -> str:
    if payload.get("titulo"):
        return payload["titulo"]
    return TITULOS_POR_TIPO.get(payload.get("tipoDocumentacao"), "Documentação Técnica")

PADRAO_DIVISOR_SOLTO = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$", re.MULTILINE)

def remover_divisores_soltos(texto_markdown: str) -> str:
    return PADRAO_DIVISOR_SOLTO.sub("", texto_markdown)


# ---------------------------------------------------------------------------
# Registro da fonte Arial no motor de PDF
# ---------------------------------------------------------------------------
_FONTE_REGISTRADA = None

def _registrar_fonte_arial() -> str:
    global _FONTE_REGISTRADA
    if _FONTE_REGISTRADA:
        return _FONTE_REGISTRADA

    try:
        pasta_fontes = r"C:\Windows\Fonts"
        pdfmetrics.registerFont(TTFont("Arial", rf"{pasta_fontes}\arial.ttf"))
        pdfmetrics.registerFont(TTFont("Arial-Bold", rf"{pasta_fontes}\arialbd.ttf"))
        pdfmetrics.registerFont(TTFont("Arial-Italic", rf"{pasta_fontes}\ariali.ttf"))
        pdfmetrics.registerFont(TTFont("Arial-BoldItalic", rf"{pasta_fontes}\arialbi.ttf"))
        pdfmetrics.registerFontFamily(
            "Arial", normal="Arial", bold="Arial-Bold",
            italic="Arial-Italic", boldItalic="Arial-BoldItalic",
        )
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
    background-color: #{COR_NAVY};
    color: #ffffff;
    padding: 18px 24px;
    margin: -2.5cm -2cm 20px -2cm;
}}
#cabecalho .marca {{
    color: #a9c2e0;
    font-size: 8.5pt;
    font-weight: bold;
    margin: 0 0 4px 0;
}}
#cabecalho h1 {{
    color: #ffffff;
    font-size: 18pt;
    margin: 0;
    border: none;
}}
#cabecalho .data {{
    color: #cdd9e8;
    font-size: 8pt;
    margin: 4px 0 0 0;
}}

h1, h2, h3, h4, h5, h6 {{
    color: #{COR_NAVY};
    font-family: {fonte}, sans-serif;
    page-break-after: avoid;
}}
h1 {{
    font-size: 15pt;
    border-bottom: 1.5pt solid #{COR_NAVY};
    padding-bottom: 3px;
    margin-top: 18px;
}}
h2 {{ font-size: 12.5pt; margin-top: 14px; }}
h3 {{ font-size: 10.5pt; margin-top: 10px; }}

p {{ margin: 6px 0; text-align: justify; }}

a {{ color: #{COR_NAVY}; }}
strong {{ color: #{COR_NAVY}; }}

code {{
    font-family: Courier, monospace;
    background-color: #f0f2f5;
    padding: 1px 4px;
    font-size: 9pt;
}}

pre {{
    background-color: #f5f6f8;
    border-left: 3px solid #{COR_NAVY};
    padding: 8px 12px;
    font-family: Courier, monospace;
    font-size: 9pt;
    white-space: pre-wrap;
    page-break-inside: avoid;
}}
pre code {{ background-color: transparent; padding: 0; }}

blockquote {{
    border-left: 3px solid #{COR_NAVY};
    margin: 10px 0;
    padding: 6px 14px;
    color: #{COR_CINZA_TEXTO};
    font-style: italic;
    background-color: #f7f9fc;
    page-break-inside: avoid;
}}

ul, ol {{ margin: 6px 0; padding-left: 20px; }}
li {{ margin: 3px 0; }}

table {{
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 9pt;
    page-break-inside: auto;
}}
tr {{ page-break-inside: avoid; page-break-after: auto; }}
th, td {{
    border: 1pt solid #d0d5dd;
    padding: 6px 8px;
    text-align: left;
}}
th {{
    background-color: #{COR_NAVY};
    color: #ffffff;
}}

#footer_content {{
    font-size: 8pt;
    color: #{COR_CINZA_CLARO};
    text-align: center;
    border-top: 0.5pt solid #d0d5dd;
    padding-top: 4px;
}}
"""


PADRAO_INLINE = re.compile(
    r'`(?P<code>[^`]+)`'
    r'|\*\*(?P<bold>[^*]+)\*\*'
    r'|\*(?P<italic1>[^*]+)\*'
    r'|_(?P<italic2>[^_]+)_'
)

def adicionar_texto_formatado(paragrafo, texto: str):
    posicao = 0
    for m in PADRAO_INLINE.finditer(texto):
        inicio, fim = m.span()
        if inicio > posicao:
            paragrafo.add_run(texto[posicao:inicio])

        if m.group("code") is not None:
            run = paragrafo.add_run(m.group("code"))
            run.font.name = "Courier New"
        elif m.group("bold") is not None:
            run = paragrafo.add_run(m.group("bold"))
            run.bold = True
            run.font.color.rgb = RGBColor(0x00, 0x33, 0x66) # Consistente com o strong do PDF
        else:
            conteudo_italico = m.group("italic1") or m.group("italic2")
            run = paragrafo.add_run(conteudo_italico)
            run.italic = True
        posicao = fim

    if posicao < len(texto):
        paragrafo.add_run(texto[posicao:])


# ---------------------------------------------------------------------------
# Helpers de baixo nível do .docx
# ---------------------------------------------------------------------------

def _aplicar_sombreamento_celula(celula, cor_hex: str):
    tc_pr = celula._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), cor_hex)
    tc_pr.append(shd)


def _definir_borda_inferior_paragrafo(paragrafo, cor_hex: str = COR_NAVY, tamanho: int = 12):
    p_pr = paragrafo._p.get_or_add_pPr()
    p_bdr = OxmlElement('w:pBdr')
    borda = OxmlElement('w:bottom')
    borda.set(qn('w:val'), 'single')
    borda.set(qn('w:sz'), str(tamanho))
    borda.set(qn('w:space'), '4')
    borda.set(qn('w:color'), cor_hex)
    p_bdr.append(borda)
    p_pr.append(p_bdr)


def _inserir_campo_word(paragrafo, instrucao_campo: str):
    run = paragrafo.add_run()

    inicio = OxmlElement('w:fldChar')
    inicio.set(qn('w:fldCharType'), 'begin')

    instrucao = OxmlElement('w:instrText')
    instrucao.set(qn('xml:space'), 'preserve')
    instrucao.text = instrucao_campo

    separador = OxmlElement('w:fldChar')
    separador.set(qn('w:fldCharType'), 'separate')

    fim = OxmlElement('w:fldChar')
    fim.set(qn('w:fldCharType'), 'end')

    run._r.append(inicio)
    run._r.append(instrucao)
    run._r.append(separador)
    run._r.append(fim)
    return run


def adicionar_cabecalho_docx(doc: Document, titulo_documento: str):
    marca = doc.add_paragraph()
    run_marca = marca.add_run("MINDWORKS")
    run_marca.font.name = "Arial"
    run_marca.font.size = Pt(8.5)
    run_marca.font.bold = True
    run_marca.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)
    marca.paragraph_format.space_after = Pt(2)

    titulo = doc.add_paragraph()
    run_titulo = titulo.add_run(titulo_documento)
    run_titulo.font.name = "Arial"
    run_titulo.font.size = Pt(18)
    run_titulo.font.bold = True
    run_titulo.font.color.rgb = RGBColor(0x00, 0x33, 0x66)
    titulo.paragraph_format.space_after = Pt(4)
    _definir_borda_inferior_paragrafo(titulo)

    data = doc.add_paragraph()
    run_data = data.add_run(datetime.now().strftime("%d/%m/%Y"))
    run_data.font.name = "Arial"
    run_data.font.size = Pt(8.5)
    run_data.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    data.paragraph_format.space_after = Pt(16)


def adicionar_rodape_docx(doc: Document):
    paragrafo = doc.sections[0].footer.paragraphs[0]
    paragrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER

    r = paragrafo.add_run("Página ")
    r.font.name = "Arial"
    r.font.size = Pt(8)
    r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    campo_pagina = _inserir_campo_word(paragrafo, "PAGE")
    campo_pagina.font.name = "Arial"
    campo_pagina.font.size = Pt(8)
    campo_pagina.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    r2 = paragrafo.add_run(" de ")
    r2.font.name = "Arial"
    r2.font.size = Pt(8)
    r2.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    campo_total = _inserir_campo_word(paragrafo, "NUMPAGES")
    campo_total.font.name = "Arial"
    campo_total.font.size = Pt(8)
    campo_total.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    r3 =agrafo_r3 = paragrafo.add_run("    ·    Mindworks — Documento Confidencial")
    r3.font.name = "Arial"
    r3.font.size = Pt(8)
    r3.font.color.rgb = RGBColor(0x66, 0x66, 0x66)


def markdown_para_docx(doc: Document, texto_markdown: str):
    dentro_bloco_codigo = False
    linhas = texto_markdown.split("\n")
    i = 0

    while i < len(linhas):
        linha_bruta = linhas[i]
        linha = linha_bruta.strip()

        if linha.startswith("```"):
            dentro_bloco_codigo = not dentro_bloco_codigo
            i += 1
            continue

        if dentro_bloco_codigo:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(linha_bruta if linha_bruta else " ")
            run.font.name = "Courier New"
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
            i += 1
            continue

        if linha.startswith("|") and linha.endswith("|"):
            tabela_linhas = []
            while i < len(linhas) and linhas[i].strip().startswith("|") and linhas[i].strip().endswith("|"):
                tabela_linhas.append(linhas[i].strip())
                i += 1

            dados_tabela = []
            for t_linha in tabela_linhas:
                if re.match(r"^\|[\s\-:|]+\|$", t_linha):
                    continue
                colunas = [c.strip() for c in t_linha.split("|")[1:-1]]
                dados_tabela.append(colunas)

            if dados_tabela:
                num_linhas = len(dados_tabela)
                num_cols = max(len(row) for row in dados_tabela)
                table = doc.add_table(rows=num_linhas, cols=num_cols)
                table.style = 'Table Grid'

                for r_idx, row_data in enumerate(dados_tabela):
                    row = table.rows[r_idx]
                    
                    # Repetir cabeçalho automaticamente se a tabela quebrar de página
                    if r_idx == 0:
                        trPr = row._tr.get_or_add_trPr()
                        trPr.append(OxmlElement('w:tblHeader'))

                    for c_idx, cell_value in enumerate(row_data):
                        if c_idx < len(row.cells):
                            cell = row.cells[c_idx]
                            cell.text = cell_value
                            if r_idx == 0:
                                _aplicar_sombreamento_celula(cell, COR_NAVY)
                                for p in cell.paragraphs:
                                    for run in p.runs:
                                        run.font.bold = True
                                        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                                        run.font.name = "Arial"
                            else:
                                if r_idx % 2 == 0:
                                    _aplicar_sombreamento_celula(cell, "F7F9FC")
                                for p in cell.paragraphs:
                                    for run in p.runs:
                                        run.font.name = "Arial"
                doc.add_paragraph().paragraph_format.space_after = Pt(4)
            continue

        if linha == "":
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)", linha)
        if m:
            nivel = len(m.group(1))
            paragrafo = doc.add_heading("", level=nivel)
            paragrafo.paragraph_format.space_before = Pt(12)
            paragrafo.paragraph_format.space_after = Pt(3)
            adicionar_texto_formatado(paragrafo, m.group(2))
            for run in paragrafo.runs:
                run.font.name = 'Arial'
                run.font.color.rgb = RGBColor(0x00, 0x33, 0x66)
            i += 1
            continue

        m = re.match(r"^[-*]\s+(.*)", linha)
        if m:
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(3)
            adicionar_texto_formatado(p, m.group(1))
            for run in p.runs:
                run.font.name = "Arial"
            i += 1
            continue

        m = re.match(r"^\d+\.\s+(.*)", linha)
        if m:
            p = doc.add_paragraph(style="List Number")
            p.paragraph_format.space_after = Pt(3)
            adicionar_texto_formatado(p, m.group(1))
            for run in p.runs:
                run.font.name = "Arial"
            i += 1
            continue

        m = re.match(r"^>\s?(.*)", linha)
        if m:
            p = doc.add_paragraph(style="Quote")
            p.paragraph_format.space_after = Pt(4)
            adicionar_texto_formatado(p, m.group(1))
            for run in p.runs:
                run.font.name = "Arial"
            i += 1
            continue

        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.45
        adicionar_texto_formatado(p, linha)
        for run in p.runs:
            run.font.name = "Arial"
        i += 1


@app.post("/api/gerar-pdf")
async def gerar_pdf(payload: dict):
    fonte = _registrar_fonte_arial()
    texto_limpo = remover_divisores_soltos(payload.get("texto", ""))
    html_conteudo = markdown.markdown(
        texto_limpo,
        extensions=[TableExtension(), FencedCodeExtension()],
    )

    titulo_documento = html.escape(resolver_titulo(payload))
    data_geracao = datetime.now().strftime("%d/%m/%Y")

    html_completo = f"""
        <html>
        <head>
        <meta charset="utf-8">
        <style>{_construir_css(fonte)}</style>
        </head>
        <body>
            <div id="cabecalho">
                <p class="marca">MINDWORKS</p>
                <h1>{titulo_documento}</h1>
                <p class="data">{data_geracao}</p>
            </div>
            <div id="footer_content">
                Página <pdf:pagenumber/> de <pdf:pagecount/> &bull; Mindworks — Documento Confidencial
            </div>
            {html_conteudo}
        </body>
        </html>
    """

    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(html_completo, dest=pdf_buffer)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="documentacao.pdf"'}
    )


@app.post("/api/gerar-doc")
async def gerar_doc(payload: dict):
    titulo_documento = resolver_titulo(payload)
    texto_limpo = remover_divisores_soltos(payload.get("texto", ""))
    doc = Document()

    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    font.size = Pt(10)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    adicionar_cabecalho_docx(doc, titulo_documento)
    markdown_para_docx(doc, texto_limpo)
    adicionar_rodape_docx(doc)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="documentacao.docx"'}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)