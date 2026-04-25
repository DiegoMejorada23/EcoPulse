const STORAGE_KEY = 'ecopulse_reports_v2';

const generateDummyData = () => {
  const types = ['waste', 'noise', 'infra', 'water', 'air'];
  const baseLat = 14.5995;
  const baseLng = 120.9842;
  const data = [];

  for (let i = 0; i < 30; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lng = baseLng + (Math.random() - 0.5) * 0.1;
    const severity = Math.floor(Math.random() * 5) + 1;
    data.push({
      id: i + 1,
      type,
      severity,
      description: `Automatically generated report for ${type} issue.`,
      lat,
      lng,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() // Last 7 days
    });
  }
  return data;
};

const DUMMY_DATA = generateDummyData();

export const store = {
  getReports() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_DATA));
      return DUMMY_DATA;
    }
    return JSON.parse(data);
  },

  saveReport(report) {
    const reports = this.getReports();
    const newReport = {
      ...report,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    reports.push(newReport);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return newReport;
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  },

  getStats() {
    const reports = this.getReports();
    return {
      total: reports.length,
      byType: reports.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
};
