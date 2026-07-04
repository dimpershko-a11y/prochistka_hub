export const pdfService = {
  async generateDocument({ templateId, data }) {
    console.info('PDF generateDocument placeholder', { templateId, data });
    return {
      ok: true,
      fileName: `${templateId || 'document'}.pdf`
    };
  }
};
