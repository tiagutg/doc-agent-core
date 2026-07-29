// frontend/lib/n8nService.ts

export async function enviarArquivoParaN8n(file: File) {
  const formData = new FormData();
  
  formData.append('data', file);

  try {
    const response = await fetch('URL_DO_SEU_WEBHOOK_PRODUCTION', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar arquivo para o n8n');
    }

    const resultado = await response.json();
    console.log("Sucesso! Job ID recebido:", resultado.job_id);
    
    return resultado.job_id; 
  } catch (error) {
    console.error("Erro na comunicação com o n8n:", error);
    throw error;
  }
}