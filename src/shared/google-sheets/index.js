export const googleSheets = {
  async readRange({ spreadsheetId, range }) {
    console.info('Google Sheets readRange placeholder', { spreadsheetId, range });
    return [];
  },

  async writeRange({ spreadsheetId, range, values }) {
    console.info('Google Sheets writeRange placeholder', { spreadsheetId, range, values });
    return { ok: true };
  }
};
