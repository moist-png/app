import { ArboristReport, ChlorophyllReading, Site, Job, DailyRisk, Quote } from '../types';

// Base storage key constants
const REPORTS_BASE_KEY = 'arborist-reports';
const SITES_BASE_KEY = 'arborist-sites';
const JOBS_BASE_KEY = 'arborist-jobs';
const CHLOROPHYLL_BASE_KEY = 'chlorophyll-readings';
const DAILY_RISK_BASE_KEY = 'daily-risk-assessments';
const QUOTES_BASE_KEY = 'quotes';

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

// ── Key helpers ───────────────────────────────────────────────────────────────

const key = (base: string, orgId: string) => `${base}-${orgId}`;

// ── Generic internals ─────────────────────────────────────────────────────────

const loadAllItemsForKey = (storageKey: string): any[] => {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
};

const recoverItemGeneric = (storageKey: string, id: string) => {
  const items = loadAllItemsForKey(storageKey);
  const item = items.find((i: any) => i.id === id);
  if (item) {
    delete item.deletedAt;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const saveReports = (reports: ArboristReport[], orgId: string): void => {
  localStorage.setItem(key(REPORTS_BASE_KEY, orgId), JSON.stringify(reports));
};

export const loadReports = (orgId: string): ArboristReport[] => {
  const all: ArboristReport[] = loadAllItemsForKey(key(REPORTS_BASE_KEY, orgId));
  return all.filter(r => !r.deletedAt);
};

export const getAllRawReports = (orgId: string): ArboristReport[] =>
  loadAllItemsForKey(key(REPORTS_BASE_KEY, orgId));

export const recoverReport = (id: string, orgId: string) =>
  recoverItemGeneric(key(REPORTS_BASE_KEY, orgId), id);

// ── Chlorophyll readings ──────────────────────────────────────────────────────

export const saveChlorophyllReadings = (readings: ChlorophyllReading[], orgId: string): void => {
  localStorage.setItem(key(CHLOROPHYLL_BASE_KEY, orgId), JSON.stringify(readings));
};

export const loadChlorophyllReadings = (orgId: string): ChlorophyllReading[] => {
  const all: ChlorophyllReading[] = loadAllItemsForKey(key(CHLOROPHYLL_BASE_KEY, orgId));
  return all.filter(r => !r.deletedAt);
};

export const getAllRawChlorophyllReadings = (orgId: string): ChlorophyllReading[] =>
  loadAllItemsForKey(key(CHLOROPHYLL_BASE_KEY, orgId));

export const recoverChlorophyllReading = (id: string, orgId: string) =>
  recoverItemGeneric(key(CHLOROPHYLL_BASE_KEY, orgId), id);

// ── Sites ─────────────────────────────────────────────────────────────────────

export const saveSites = (sites: Site[], orgId: string): void => {
  localStorage.setItem(key(SITES_BASE_KEY, orgId), JSON.stringify(sites));
};

export const loadSites = (orgId: string): Site[] => {
  const all: Site[] = loadAllItemsForKey(key(SITES_BASE_KEY, orgId));
  return all.filter(s => !s.deletedAt);
};

export const getAllRawSites = (orgId: string): Site[] =>
  loadAllItemsForKey(key(SITES_BASE_KEY, orgId));

export const recoverSite = (id: string, orgId: string) =>
  recoverItemGeneric(key(SITES_BASE_KEY, orgId), id);

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const saveJobs = (jobs: Job[], orgId: string): void => {
  localStorage.setItem(key(JOBS_BASE_KEY, orgId), JSON.stringify(jobs));
};

export const loadJobs = (orgId: string): Job[] => {
  const all: Job[] = loadAllItemsForKey(key(JOBS_BASE_KEY, orgId));
  return all.filter(j => !j.deletedAt);
};

export const getAllRawJobs = (orgId: string): Job[] =>
  loadAllItemsForKey(key(JOBS_BASE_KEY, orgId));

export const recoverJob = (id: string, orgId: string) =>
  recoverItemGeneric(key(JOBS_BASE_KEY, orgId), id);

// ── Daily risks ───────────────────────────────────────────────────────────────

export const saveDailyRisks = (risks: DailyRisk[], orgId: string): void => {
  localStorage.setItem(key(DAILY_RISK_BASE_KEY, orgId), JSON.stringify(risks));
};

export const loadDailyRisks = (orgId: string): DailyRisk[] => {
  const all: DailyRisk[] = loadAllItemsForKey(key(DAILY_RISK_BASE_KEY, orgId));
  return all.filter(r => !r.deletedAt);
};

export const getAllRawDailyRisks = (orgId: string): DailyRisk[] =>
  loadAllItemsForKey(key(DAILY_RISK_BASE_KEY, orgId));

export const recoverDailyRisk = (id: string, orgId: string) =>
  recoverItemGeneric(key(DAILY_RISK_BASE_KEY, orgId), id);

// ── Quotes ────────────────────────────────────────────────────────────────────

export const saveQuotes = (quotes: Quote[], orgId: string): void => {
  localStorage.setItem(key(QUOTES_BASE_KEY, orgId), JSON.stringify(quotes));
};

export const loadQuotes = (orgId: string): Quote[] => {
  const stored = localStorage.getItem(key(QUOTES_BASE_KEY, orgId));
  return stored ? JSON.parse(stored) : [];
};

// ── Purge old deleted items ───────────────────────────────────────────────────

export const purgeOldDeletedItems = (orgId: string): void => {
  const now = Date.now();

  const processKey = (storageKey: string) => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    const items = JSON.parse(stored);
    const updated = items.filter(
      (item: any) => !item.deletedAt || now - item.deletedAt < SEVEN_DAYS_IN_MS
    );
    if (updated.length !== items.length) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  processKey(key(REPORTS_BASE_KEY, orgId));
  processKey(key(CHLOROPHYLL_BASE_KEY, orgId));
  processKey(key(SITES_BASE_KEY, orgId));
  processKey(key(JOBS_BASE_KEY, orgId));
  processKey(key(DAILY_RISK_BASE_KEY, orgId));
};

// ── Utility / factory helpers ─────────────────────────────────────────────────

export const generateReportId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

export const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const createEmptyReport = (siteId?: string): ArboristReport => ({
  id: generateReportId(),
  title: '',
  clientName: '',
  address: '',
  inspector: '',
  date: new Date().toISOString().split('T')[0],
  treeData: {
    treeNumber: '',
    species: '',
    commonName: '',
    dbh: 0,
    height: 0,
    canopySpreadNS: 0,
    canopySpreadEW: 0,
    treeHealth: 'Good',
    extensionGrowth: 0,
    structure: 'Good',
    woundWoodDevelopment: 'Good',
    canopyCover: 0,
    location: '',
  },
  photos: [],
  notes: [],
  recommendations: [],
  status: 'draft',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  siteId,
});

export const createEmptyChlorophyllReading = (): ChlorophyllReading => ({
  id: generateReportId(),
  treeId: generateReportId(),
  treeSpecies: '',
  treeLocation: '',
  treeMaturity: 'Juvenile',
  date: new Date().toISOString().split('T')[0],
  chlorophyllLevel: 0,
  extensionGrowth: 0,
  notes: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createEmptySite = (): Site => ({
  id: generateReportId(),
  name: '',
  description: '',
  address: '',
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createEmptyJob = (siteId?: string): Job => ({
  id: generateReportId(),
  title: '',
  clientName: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '',
  endTime: '',
  timeSpent: 0,
  workCompleted: '',
  workToComplete: '',
  notes: '',
  status: 'scheduled',
  jobType: 'assessment',
  hourlyRate: 0,
  totalCost: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  siteId,
});

export const createEmptyDailyRisk = (): DailyRisk => ({
  id: generateReportId(),
  siteAddress: '',
  date: new Date().toISOString().split('T')[0],
  clientName: '',
  clientMobile: '',
  firstAidLocation: '',
  nearestHospital: '',
  hazards: {
    workingAtHeights: false,
    unstableGround: false,
    powerlines: false,
    undergroundServices: false,
    siteWorkers: false,
    pedestrians: false,
    traffic: false,
    noise: false,
    chainsaws: false,
    loweringDevices: false,
    ewp: false,
    crane: false,
    deadBranches: false,
    brokenBranches: false,
    deadTree: false,
    barkInclusions: false,
    treeLean: false,
    fallenTree: false,
    wildlife: false,
  },
  hazardControls: [],
  signatures: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createEmptyQuote = (): Quote => ({
  id: generateReportId(),
  clientName: '',
  address: '',
  mobile: '',
  siteContact: '',
  scheduledDate: new Date().toISOString().split('T')[0],
  scheduledTime: '09:00',
  jobDescription: [{ id: generateReportId(), description: '' }],
  additionalEquipment: '',
  accessParking: '',
  status: 'new',
  archived: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
