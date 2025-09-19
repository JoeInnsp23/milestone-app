export const EXPORT_CONFIG = {
  pdf: {
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    fontSize: {
      title: 24,
      heading: 16,
      body: 12,
      small: 10,
      tiny: 8
    },
    colors: {
      primary: '#3b82f6',
      success: '#10b981',
      danger: '#ef4444',
      text: '#1f2937',
      muted: '#6b7280',
      lightGray: '#f3f4f6'
    }
  },
  excel: {
    headerColor: 'FFF3F4F6',
    profitColor: 'FFD1FAE5',
    lossColor: 'FFFEE2E2',
    primaryColor: 'FF3B82F6',
    whiteText: 'FFFFFFFF'
  },
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : ''
};