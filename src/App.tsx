import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ArboristReport, ChlorophyllReading, Site, Job, DailyRisk, Quote, User, AuthState } from './types';
import {
  loadAuthState, saveAuthState, logout,
  isSuperAdmin, isOrgAdmin, getOrganizationById
} from './utils/auth';
import { ReportList } from './components/ReportList';
import { ReportEditor } from './components/ReportEditor';
import { ChlorophyllList } from './components/ChlorophyllList';
import { ChlorophyllEditor } from './components/ChlorophyllEditor';
import { SiteList } from './components/SiteList';
import { SiteEditor } from './components/SiteEditor';
import { SiteDetailScreen } from './components/SiteDetailScreen';
import { JobList } from './components/JobList';
import { JobEditor } from './components/JobEditor';
import { DailyRiskList } from './components/DailyRiskList';
import { DailyRiskEditor } from './components/DailyRiskEditor';
import { QuoteList } from './components/QuoteList';
import { QuoteEditor } from './components/QuoteEditor';
import OrganizationManager from './components/OrganizationManager';
import UserManager from './components/UserManager';
import {
  loadReports,
  saveReports,
  createEmptyReport,
  loadChlorophyllReadings,
  saveChlorophyllReadings,
  createEmptyChlorophyllReading,
  loadSites,
  saveSites,
  createEmptySite,
  loadJobs,
  saveJobs,
  createEmptyJob,
  loadDailyRisks,
  saveDailyRisks,
  createEmptyDailyRisk,
  loadQuotes,
  saveQuotes,
  createEmptyQuote,
  purgeOldDeletedItems,
  recoverReport,
  recoverChlorophyllReading,
  recoverSite,
  recoverJob,
  recoverDailyRisk,
  getAllRawReports,
  getAllRawChlorophyllReadings,
  getAllRawJobs,
  getAllRawSites,
  getAllRawDailyRisks,
} from './utils/storage';
import {
  FileText, Leaf, Home, TreePine, Shield, FileText as QuoteIcon,
  Menu, X, LogOut, Trash2, Users, Building2
} from 'lucide-react';
import { RecentlyDeleted } from './components/RecentlyDeleted';

type AppView = 'sites' | 'chlorophyll' | 'jobs' | 'daily-risk' | 'quotes' | 'org-manager' | 'user-manager';
type SitesSubView = 'sites' | 'registry';
type SiteDetailSubView = 'trees' | 'work-done';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false, user: null, isGuest: false, currentOrgId: null
  });
  const [currentView, setCurrentView] = useState<AppView>('sites');
  const [sitesSubView, setSitesSubView] = useState<SitesSubView>('sites');
  const [siteDetailSubView, setSiteDetailSubView] = useState<SiteDetailSubView>('trees');
  const [reports, setReports] = useState<ArboristReport[]>([]);
  const [chlorophyllReadings, setChlorophyllReadings] = useState<ChlorophyllReading[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dailyRisks, setDailyRisks] = useState<DailyRisk[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedReport, setSelectedReport] = useState<ArboristReport | null>(null);
  const [selectedReading, setSelectedReading] = useState<ChlorophyllReading | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<DailyRisk | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewReading, setIsNewReading] = useState(false);
  const [isNewSite, setIsNewSite] = useState(false);
  const [isNewJob, setIsNewJob] = useState(false);
  const [isNewRisk, setIsNewRisk] = useState(false);
  const [isNewQuote, setIsNewQuote] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);

  useEffect(() => {
    const savedAuthState = loadAuthState();
    if (savedAuthState.isAuthenticated && savedAuthState.user) {
      setAuthState(savedAuthState);
      const orgId = savedAuthState.currentOrgId;
      if (orgId) {
        purgeOldDeletedItems(orgId);
        setReports(loadReports(orgId));
        setChlorophyllReadings(loadChlorophyllReadings(orgId));
        setSites(loadSites(orgId));
        setJobs(loadJobs(orgId));
        setDailyRisks(loadDailyRisks(orgId));
        setQuotes(loadQuotes(orgId));
      }
      // Super admin: start on org manager view
      if (savedAuthState.user.role === 'super_admin') {
        setCurrentView('org-manager');
      }
    }
  }, []);

  const handleLogin = (user: User, isGuest: boolean) => {
    const newAuthState: AuthState = {
      isAuthenticated: true,
      user,
      isGuest,
      currentOrgId: user.orgId,
    };
    setAuthState(newAuthState);
    saveAuthState(newAuthState);

    // Load org data
    if (user.orgId) {
      const orgId = user.orgId;
      purgeOldDeletedItems(orgId);
      setReports(loadReports(orgId));
      setChlorophyllReadings(loadChlorophyllReadings(orgId));
      setSites(loadSites(orgId));
      setJobs(loadJobs(orgId));
      setDailyRisks(loadDailyRisks(orgId));
      setQuotes(loadQuotes(orgId));
    }

    // Super admin goes to org manager
    if (user.role === 'super_admin') {
      setCurrentView('org-manager');
    } else {
      setCurrentView('sites');
    }
  };

  const handleLogout = () => {
    logout();
    setAuthState({ isAuthenticated: false, user: null, isGuest: false, currentOrgId: null });
  };

  if (!authState.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const orgId = authState.currentOrgId ?? '';
  const isReadOnly = authState.isGuest;

  // ── Reports ───────────────────────────────────────────────────────────────

  const handleCreateReport = (siteId?: string) => {
    if (isReadOnly) return;
    const newReport = createEmptyReport(siteId);
    if (siteId && selectedSite) {
      newReport.clientName = selectedSite.clientName;
      newReport.address = selectedSite.address;
    }
    setSelectedReport(newReport);
  };

  const handleSelectReport = (report: ArboristReport) => setSelectedReport(report);

  const handleSaveReport = (updatedReport: ArboristReport) => {
    if (isReadOnly) return;
    const idx = reports.findIndex(r => r.id === updatedReport.id);
    const updated = idx >= 0
      ? reports.map(r => r.id === updatedReport.id ? updatedReport : r)
      : [updatedReport, ...reports];
    setReports(updated);
    saveReports(updated, orgId);
  };

  const handleBackToReports = () => setSelectedReport(null);

  // ── Chlorophyll ───────────────────────────────────────────────────────────

  const handleCreateReading = () => {
    if (isReadOnly) return;
    setSelectedReading(createEmptyChlorophyllReading());
    setIsNewReading(true);
  };

  const handleSelectReading = (reading: ChlorophyllReading) => {
    setSelectedReading(reading);
    setIsNewReading(false);
  };

  const handleSaveReading = (updatedReading: ChlorophyllReading) => {
    if (isReadOnly) return;
    const idx = chlorophyllReadings.findIndex(r => r.id === updatedReading.id);
    const updated = idx >= 0
      ? chlorophyllReadings.map(r => r.id === updatedReading.id ? updatedReading : r)
      : [updatedReading, ...chlorophyllReadings];
    setChlorophyllReadings(updated);
    saveChlorophyllReadings(updated, orgId);
    setSelectedReading(null);
    setIsNewReading(false);
  };

  const handleDeleteReading = (readingId: string) => {
    if (isReadOnly) return;
    const all = getAllRawChlorophyllReadings(orgId);
    const updated = all.map(r => r.id === readingId ? { ...r, deletedAt: Date.now() } : r);
    saveChlorophyllReadings(updated, orgId);
    setChlorophyllReadings(loadChlorophyllReadings(orgId));
    setSelectedReading(null);
    setIsNewReading(false);
  };

  const handleBackToReadings = () => { setSelectedReading(null); setIsNewReading(false); };

  // ── Sites ─────────────────────────────────────────────────────────────────

  const handleCreateSite = () => {
    if (isReadOnly) return;
    setEditingSite(createEmptySite());
    setIsNewSite(true);
  };

  const handleSelectSite = (site: Site) => setSelectedSite(site);

  const handleEditSite = () => {
    if (selectedSite) { setEditingSite(selectedSite); setIsNewSite(false); }
  };

  const handleSaveSite = (updatedSite: Site) => {
    if (isReadOnly) return;
    const allSites = getAllRawSites(orgId);
    const idx = allSites.findIndex(s => s.id === updatedSite.id);
    const updated = idx >= 0
      ? allSites.map(s => s.id === updatedSite.id ? updatedSite : s)
      : [updatedSite, ...allSites];
    saveSites(updated, orgId);
    setSites(loadSites(orgId));
    setEditingSite(null);
    setIsNewSite(false);
    if (isNewSite) setSelectedSite(updatedSite);
  };

  const handleDeleteSite = (siteId: string) => {
    if (isReadOnly) return;
    const now = Date.now();

    const allReports = getAllRawReports(orgId);
    saveReports(allReports.map(r => r.siteId === siteId ? { ...r, deletedAt: now } : r), orgId);
    setReports(loadReports(orgId));

    const allJobs = getAllRawJobs(orgId);
    saveJobs(allJobs.map(j => j.siteId === siteId ? { ...j, deletedAt: now } : j), orgId);
    setJobs(loadJobs(orgId));

    const allSites = getAllRawSites(orgId);
    saveSites(allSites.map(s => s.id === siteId ? { ...s, deletedAt: now } : s), orgId);
    setSites(loadSites(orgId));

    setEditingSite(null);
    setSelectedSite(null);
    setIsNewSite(false);
  };

  const handleBackToSites = () => { setSelectedSite(null); setEditingSite(null); setIsNewSite(false); };
  const handleBackToSiteEditor = () => { setEditingSite(null); setIsNewSite(false); };

  const handleImportTrees = (importedTrees: ArboristReport[]) => {
    if (isReadOnly) return;
    const updated = [...importedTrees, ...reports];
    setReports(updated);
    saveReports(updated, orgId);
  };

  // ── Jobs ──────────────────────────────────────────────────────────────────

  const handleCreateJob = () => {
    if (isReadOnly) return;
    setSelectedJob(createEmptyJob());
    setIsNewJob(true);
  };

  const handleCreateJobForSite = (siteId: string) => {
    if (isReadOnly) return;
    const newJob = createEmptyJob(siteId);
    if (selectedSite) { newJob.clientName = selectedSite.clientName; newJob.location = selectedSite.address; }
    setSelectedJob(newJob);
    setIsNewJob(true);
  };

  const handleSelectJob = (job: Job) => { setSelectedJob(job); setIsNewJob(false); };

  const handleSaveJob = (updatedJob: Job) => {
    if (isReadOnly) return;
    const allJobs = getAllRawJobs(orgId);
    const idx = allJobs.findIndex(j => j.id === updatedJob.id);
    const updated = idx >= 0
      ? allJobs.map(j => j.id === updatedJob.id ? updatedJob : j)
      : [updatedJob, ...allJobs];
    saveJobs(updated, orgId);
    setJobs(loadJobs(orgId));
    setSelectedJob(null);
    setIsNewJob(false);
  };

  const handleDeleteJob = (jobId: string) => {
    if (isReadOnly) return;
    const allJobs = getAllRawJobs(orgId);
    saveJobs(allJobs.map(j => j.id === jobId ? { ...j, deletedAt: Date.now() } : j), orgId);
    setJobs(loadJobs(orgId));
    setSelectedJob(null);
    setIsNewJob(false);
  };

  const handleBackToJobs = () => { setSelectedJob(null); setIsNewJob(false); };

  // ── Daily risk ────────────────────────────────────────────────────────────

  const handleCreateRisk = () => {
    if (isReadOnly) return;
    setSelectedRisk(createEmptyDailyRisk());
    setIsNewRisk(true);
  };

  const handleSelectRisk = (risk: DailyRisk) => { setSelectedRisk(risk); setIsNewRisk(false); };

  const handleSaveRisk = (updatedRisk: DailyRisk) => {
    if (isReadOnly) return;
    const allRisks = getAllRawDailyRisks(orgId);
    const idx = allRisks.findIndex(r => r.id === updatedRisk.id);
    const updated = idx >= 0
      ? allRisks.map(r => r.id === updatedRisk.id ? updatedRisk : r)
      : [updatedRisk, ...allRisks];
    saveDailyRisks(updated, orgId);
    setDailyRisks(loadDailyRisks(orgId));
    setSelectedRisk(null);
    setIsNewRisk(false);
  };

  const handleDeleteRisk = (riskId: string) => {
    if (isReadOnly) return;
    const allRisks = getAllRawDailyRisks(orgId);
    saveDailyRisks(allRisks.map(r => r.id === riskId ? { ...r, deletedAt: Date.now() } : r), orgId);
    setDailyRisks(loadDailyRisks(orgId));
    setSelectedRisk(null);
    setIsNewRisk(false);
  };

  const handleBackToRisks = () => { setSelectedRisk(null); setIsNewRisk(false); };

  // ── Quotes ────────────────────────────────────────────────────────────────

  const handleCreateQuote = () => {
    if (isReadOnly) return;
    setSelectedQuote(createEmptyQuote());
    setIsNewQuote(true);
  };

  const handleImportQuotes = (importedQuotes: Quote[]) => {
    if (isReadOnly) return;
    const updated = [...importedQuotes, ...quotes];
    setQuotes(updated);
    saveQuotes(updated, orgId);
  };

  const handleSelectQuote = (quote: Quote) => { setSelectedQuote(quote); setIsNewQuote(false); };

  const handleSaveQuote = (updatedQuote: Quote) => {
    if (isReadOnly) return;
    const idx = quotes.findIndex(q => q.id === updatedQuote.id);
    const updated = idx >= 0
      ? quotes.map(q => q.id === updatedQuote.id ? updatedQuote : q)
      : [updatedQuote, ...quotes];
    setQuotes(updated);
    saveQuotes(updated, orgId);
    setSelectedQuote(null);
    setIsNewQuote(false);
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (isReadOnly) return;
    const updated = quotes.filter(q => q.id !== quoteId);
    setQuotes(updated);
    saveQuotes(updated, orgId);
    setSelectedQuote(null);
    setIsNewQuote(false);
  };

  const handleArchiveQuote = (quoteId: string) => {
    if (isReadOnly) return;
    const updated = quotes.map(q => q.id === quoteId ? { ...q, archived: true, updatedAt: Date.now() } : q);
    setQuotes(updated);
    saveQuotes(updated, orgId);
    setSelectedQuote(null);
    setIsNewQuote(false);
  };

  const handleBackToQuotes = () => { setSelectedQuote(null); setIsNewQuote(false); };

  const handleUpdateQuoteStatus = (quoteId: string, status: Quote['status']) => {
    if (isReadOnly) return;
    const updated = quotes.map(q => q.id === quoteId ? { ...q, status, updatedAt: Date.now() } : q);
    setQuotes(updated);
    saveQuotes(updated, orgId);
  };

  // ── Recovery ──────────────────────────────────────────────────────────────

  const handleRecoverItem = (type: string, id: string) => {
    if (isReadOnly) return;
    switch (type) {
      case 'report':           recoverReport(id, orgId);            setReports(loadReports(orgId)); break;
      case 'chlorophyll':      recoverChlorophyllReading(id, orgId); setChlorophyllReadings(loadChlorophyllReadings(orgId)); break;
      case 'site':             recoverSite(id, orgId);              setSites(loadSites(orgId)); break;
      case 'job':              recoverJob(id, orgId);               setJobs(loadJobs(orgId)); break;
      case 'dailyRisk':        recoverDailyRisk(id, orgId);         setDailyRisks(loadDailyRisks(orgId)); break;
      default: break;
    }
    setShowRecentlyDeleted(false);
    setIsMobileMenuOpen(false);
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'sites') {
      setSitesSubView('sites');
      setSiteDetailSubView('trees');
    }
    setSearchQuery('');
    setSelectedReport(null);
    setSelectedReading(null);
    setSelectedSite(null);
    setSelectedJob(null);
    setSelectedRisk(null);
    setSelectedQuote(null);
    setEditingSite(null);
    setIsNewReading(false);
    setIsNewSite(false);
    setIsNewJob(false);
    setIsNewRisk(false);
    setIsNewQuote(false);
    setIsMobileMenuOpen(false);
  };

  const handleSitesSubViewChange = (subView: SitesSubView) => {
    setSitesSubView(subView);
    setSearchQuery('');
    setSelectedReport(null);
    setSelectedSite(null);
    setSelectedJob(null);
    setEditingSite(null);
    setIsNewSite(false);
    setIsNewJob(false);
    setIsMobileMenuOpen(false);
  };

  const handleSiteDetailSubViewChange = (subView: SiteDetailSubView) => {
    setSiteDetailSubView(subView);
    setSearchQuery('');
    setSelectedReport(null);
    setSelectedJob(null);
    setIsNewJob(false);
    setIsMobileMenuOpen(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getTreeCountForSite = (siteId: string) => reports.filter(r => r.siteId === siteId).length;
  const getTreesForSite = (siteId: string) => reports.filter(r => r.siteId === siteId);
  const getJobsForSite = (siteId: string) => jobs.filter(j => j.siteId === siteId);

  // ── Early returns for editing views ──────────────────────────────────────

  if (selectedReport) {
    return (
      <ReportEditor
        report={selectedReport}
        onSave={handleSaveReport}
        onBack={selectedSite ? () => setSelectedReport(null) : handleBackToReports}
      />
    );
  }

  if (selectedReading) {
    return (
      <ChlorophyllEditor
        reading={selectedReading}
        onSave={handleSaveReading}
        onDelete={handleDeleteReading}
        onBack={handleBackToReadings}
        isNew={isNewReading}
        allReadings={chlorophyllReadings}
      />
    );
  }

  if (editingSite) {
    return (
      <SiteEditor
        site={editingSite}
        onSave={handleSaveSite}
        onDelete={handleDeleteSite}
        onBack={handleBackToSiteEditor}
        isNew={isNewSite}
      />
    );
  }

  if (selectedJob) {
    return (
      <JobEditor
        job={selectedJob}
        onSave={handleSaveJob}
        onDelete={handleDeleteJob}
        onBack={handleBackToJobs}
        isNew={isNewJob}
        orgId={orgId}
      />
    );
  }

  if (selectedRisk) {
    return (
      <DailyRiskEditor
        risk={selectedRisk}
        onSave={handleSaveRisk}
        onDelete={handleDeleteRisk}
        onBack={handleBackToRisks}
        isNew={isNewRisk}
      />
    );
  }

  if (selectedQuote) {
    return (
      <QuoteEditor
        quote={selectedQuote}
        onSave={handleSaveQuote}
        onDelete={handleDeleteQuote}
        onArchive={handleArchiveQuote}
        onBack={handleBackToQuotes}
        isNew={isNewQuote}
      />
    );
  }

  if (selectedSite) {
    return (
      <SiteDetailScreen
        site={selectedSite}
        trees={getTreesForSite(selectedSite.id)}
        jobs={getJobsForSite(selectedSite.id)}
        sitesSubView={siteDetailSubView}
        onSitesSubViewChange={handleSiteDetailSubViewChange}
        onSelectTree={handleSelectReport}
        onSelectJob={handleSelectJob}
        onCreateTree={() => handleCreateReport(selectedSite.id)}
        onCreateJob={() => handleCreateJobForSite(selectedSite.id)}
        onBackToSites={handleBackToSites}
        onEditSite={handleEditSite}
        onImportTrees={handleImportTrees}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    );
  }

  // ── Nav items ─────────────────────────────────────────────────────────────

  const superAdmin = isSuperAdmin();
  const orgAdmin = isOrgAdmin();
  const currentOrg = orgId ? getOrganizationById(orgId) : null;

  const dataNavItems = [
    { view: 'sites' as AppView,      icon: Home,      label: 'Sites' },
    { view: 'chlorophyll' as AppView, icon: Leaf,      label: 'Chlorophyll' },
    { view: 'jobs' as AppView,        icon: TreePine,  label: 'Jobs' },
    { view: 'daily-risk' as AppView,  icon: Shield,    label: 'Risk' },
    { view: 'quotes' as AppView,      icon: QuoteIcon, label: 'Quotes' },
  ];

  const navItems = [
    ...(superAdmin ? [{ view: 'org-manager' as AppView, icon: Building2, label: 'Organizations' }] : dataNavItems),
    ...(orgAdmin && !superAdmin ? [{ view: 'user-manager' as AppView, icon: Users, label: 'Team' }] : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen grain" style={{ background: 'var(--forest)' }}>
      {/* Top Navigation Bar */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--canopy), var(--forest-light))',
                border: '1px solid var(--border-bright)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <TreePine size={20} color="var(--leaf)" />
              </div>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                ArborPro
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex" style={{ gap: '4px' }}>
              {navItems.map(({ view, icon: Icon, label }) => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '7px 14px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '500',
                    transition: 'all 0.15s',
                    border: currentView === view ? '1px solid rgba(90,143,90,0.35)' : '1px solid transparent',
                    background: currentView === view ? 'rgba(90,143,90,0.15)' : 'transparent',
                    color: currentView === view ? 'var(--leaf)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!superAdmin && (
                <button
                  onClick={() => setShowRecentlyDeleted(true)}
                  className="hidden md:flex"
                  style={{
                    alignItems: 'center', gap: '6px', padding: '6px 12px',
                    borderRadius: '8px', fontSize: '13px',
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  title="Recently Deleted"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {authState.user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--canopy), var(--forest-light))',
                    border: '1px solid var(--border-bright)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--leaf)' }}>
                      {authState.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:flex" style={{ flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {authState.user.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {authState.isGuest ? 'Guest' : superAdmin ? 'Super Admin' : orgAdmin ? 'Admin' : ''}
                      {currentOrg && !superAdmin ? ` · ${currentOrg.name}` : ''}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 10px', borderRadius: '6px',
                      fontSize: '12px', color: 'var(--text-muted)',
                      background: 'transparent', border: '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
                style={{
                  padding: '8px', borderRadius: '8px',
                  color: 'var(--text-secondary)', background: 'transparent',
                  border: '1px solid var(--border)', cursor: 'pointer'
                }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden" style={{
              paddingBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px'
            }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navItems.map(({ view, icon: Icon, label }) => (
                  <button
                    key={view}
                    onClick={() => handleViewChange(view)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                      fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                      border: currentView === view ? '1px solid rgba(90,143,90,0.35)' : '1px solid transparent',
                      background: currentView === view ? 'rgba(90,143,90,0.15)' : 'transparent',
                      color: currentView === view ? 'var(--leaf)' : 'var(--text-secondary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>
              {!superAdmin && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />
                  <button
                    onClick={() => { setShowRecentlyDeleted(true); setIsMobileMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', width: '100%',
                      fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer',
                      background: 'transparent', border: '1px solid transparent'
                    }}
                  >
                    <Trash2 size={18} /> Recently Deleted
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px', width: '100%',
                  fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer',
                  background: 'transparent', border: '1px solid transparent'
                }}
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }} className="fade-in">

        {/* Super admin: org management */}
        {currentView === 'org-manager' && (
          <OrganizationManager currentUserId={authState.user!.id} />
        )}

        {/* Org admin: user management */}
        {currentView === 'user-manager' && orgId && (
          <UserManager orgId={orgId} currentUserId={authState.user!.id} />
        )}

        {/* Data views (non-super-admin only) */}
        {currentView === 'sites' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
              <button
                onClick={() => handleSitesSubViewChange('sites')}
                style={{
                  padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  borderBottom: sitesSubView === 'sites' ? '2px solid var(--moss)' : '2px solid transparent',
                  color: sitesSubView === 'sites' ? 'var(--leaf)' : 'var(--text-muted)',
                  marginBottom: '-1px', transition: 'all 0.15s'
                }}
              >
                Site Registry ({sites.length})
              </button>
              <button
                onClick={() => handleSitesSubViewChange('registry')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  borderBottom: sitesSubView === 'registry' ? '2px solid var(--moss)' : '2px solid transparent',
                  color: sitesSubView === 'registry' ? 'var(--leaf)' : 'var(--text-muted)',
                  marginBottom: '-1px', transition: 'all 0.15s'
                }}
              >
                <FileText size={14} />
                Tree Registry ({reports.filter(r => !r.siteId).length})
              </button>
            </div>

            {sitesSubView === 'sites' ? (
              <SiteList
                sites={sites}
                onSelectSite={handleSelectSite}
                onCreateSite={handleCreateSite}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                getTreeCountForSite={getTreeCountForSite}
              />
            ) : (
              <ReportList
                reports={reports.filter(r => !r.siteId)}
                onSelectReport={handleSelectReport}
                onCreateReport={() => handleCreateReport()}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
          </div>
        )}

        {currentView === 'chlorophyll' && (
          <ChlorophyllList
            readings={chlorophyllReadings}
            onSelectReading={handleSelectReading}
            onCreateReading={handleCreateReading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentView === 'jobs' && (
          <JobList
            jobs={jobs}
            onSelectJob={handleSelectJob}
            onCreateJob={handleCreateJob}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentView === 'daily-risk' && (
          <DailyRiskList
            risks={dailyRisks}
            onSelectRisk={handleSelectRisk}
            onCreateRisk={handleCreateRisk}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentView === 'quotes' && (
          <QuoteList
            quotes={quotes}
            onSelectQuote={handleSelectQuote}
            onCreateQuote={handleCreateQuote}
            onImportQuotes={handleImportQuotes}
            onUpdateQuoteStatus={handleUpdateQuoteStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </main>

      {!superAdmin && (
        <RecentlyDeleted
          isOpen={showRecentlyDeleted}
          onClose={() => setShowRecentlyDeleted(false)}
          onRecover={handleRecoverItem}
          orgId={orgId}
        />
      )}
    </div>
  );
}

export default App;
