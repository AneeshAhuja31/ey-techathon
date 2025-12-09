/**
 * Mock data for development and testing
 * GLP-1 Happy Path data matching the specification
 */

// Mind Map Data
export const MOCK_MIND_MAP = {
  nodes: [
    // Disease nodes (pink)
    {
      id: 'disease_obesity',
      label: 'Obesity',
      type: 'disease' as const,
      x: 400,
      y: 100,
      data: {
        prevalence: '42% of US adults',
        icd_code: 'E66',
      },
    },
    {
      id: 'disease_t2d',
      label: 'Type 2 Diabetes',
      type: 'disease' as const,
      x: 400,
      y: 300,
      data: {
        prevalence: '11.3% of US adults',
        icd_code: 'E11',
      },
    },
    // Molecule nodes (purple/blue)
    {
      id: 'mol_semaglutide',
      label: 'Semaglutide',
      type: 'molecule' as const,
      x: 250,
      y: 200,
      data: {
        mechanism: 'GLP-1 receptor agonist',
        drug_class: 'Incretin mimetics',
      },
    },
    // Product nodes (yellow)
    {
      id: 'prod_wegovy',
      label: 'Wegovy',
      type: 'product' as const,
      x: 100,
      y: 120,
      data: {
        manufacturer: 'Novo Nordisk',
        match_score: 97,
      },
      match_score: 97,
    },
    {
      id: 'prod_ozempic',
      label: 'Ozempic',
      type: 'product' as const,
      x: 100,
      y: 200,
      data: {
        manufacturer: 'Novo Nordisk',
        match_score: 95,
      },
      match_score: 95,
    },
    {
      id: 'prod_rybelsus',
      label: 'Rybelsus',
      type: 'product' as const,
      x: 100,
      y: 280,
      data: {
        manufacturer: 'Novo Nordisk',
        match_score: 92,
      },
      match_score: 92,
    },
  ],
  edges: [
    { id: 'e1', source: 'disease_obesity', target: 'mol_semaglutide' },
    { id: 'e2', source: 'disease_t2d', target: 'mol_semaglutide' },
    { id: 'e3', source: 'mol_semaglutide', target: 'prod_wegovy' },
    { id: 'e4', source: 'mol_semaglutide', target: 'prod_ozempic' },
    { id: 'e5', source: 'mol_semaglutide', target: 'prod_rybelsus' },
  ],
};

// Patent Data (matches spec)
export const MOCK_PATENTS = [
  {
    id: 'pat_001',
    patent_id: 'US10,456,789',
    title: 'GLP-1 Receptor Agonist Formulation with Extended Release',
    abstract: 'Novel formulation for semaglutide delivery with improved bioavailability.',
    assignee: 'Novo Nordisk A/S',
    filing_date: '2019-03-15',
    relevance_score: 94,
    molecule: 'semaglutide',
  },
  {
    id: 'pat_002',
    patent_id: 'US1338,734,547',
    title: 'Modified Peptide Therapeutics for Metabolic Disorders',
    abstract: 'Novel peptide modifications for improved stability and receptor binding.',
    assignee: 'Eli Lilly and Company',
    filing_date: '2020-08-22',
    relevance_score: 41,
    molecule: 'tirzepatide',
  },
];

// Job Progress Data (matches spec)
export const MOCK_JOB_PROGRESS = {
  job_id: 'job_glp1_analysis',
  query: 'Research GLP-1 agonists for obesity treatment',
  status: 'processing',
  progress: 45,
  workers: [
    { name: 'IQVIA Insights', status: 'completed', progress: 100 },
    { name: 'Patent Landscape', status: 'in_progress', progress: 52 },
    { name: 'Clinical Trials', status: 'in_progress', progress: 30 },
    { name: 'Web Intelligence', status: 'pending', progress: 0 },
    { name: 'Report Generator', status: 'pending', progress: 0 },
  ],
};

// Active Jobs for Dashboard
export const MOCK_ACTIVE_JOBS = [
  {
    job_id: 'job_glp1',
    query: 'GLP-1 Agonist Market Analysis',
    status: 'processing',
    progress: 45,
  },
  {
    job_id: 'job_crispr',
    query: 'CRISPR Therapy IP Landscape',
    status: 'completed',
    progress: 100,
  },
];

// Quick Actions
export const QUICK_ACTIONS = [
  {
    id: 'molecule_research',
    title: 'Molecule Research',
    icon: 'flask',
    description: 'Comprehensive molecule analysis',
  },
  {
    id: 'patent_search',
    title: 'Patent Search',
    icon: 'document-text',
    description: 'Search pharmaceutical patents',
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    icon: 'trending-up',
    description: 'IQVIA market intelligence',
  },
  {
    id: 'generate_report',
    title: 'Generate Report',
    icon: 'document-report',
    description: 'Create comprehensive report',
  },
];

export default {
  MOCK_MIND_MAP,
  MOCK_PATENTS,
  MOCK_JOB_PROGRESS,
  MOCK_ACTIVE_JOBS,
  QUICK_ACTIONS,
};
