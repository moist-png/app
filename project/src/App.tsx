import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ArboristReport, ChlorophyllReading, Site, Job, DailyRisk, Quote, User, AuthState } from './types';
import { loadAuthState, saveAuthState, logout } from './utils/auth';
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
  recoverReport, recoverChlorophyllReading, recoverSite, recoverJob, recoverDailyRisk
} from './utils/storage';
import { FileText, Leaf, Home, TreePine, Shield, FileText as QuoteIcon, Menu, X, LogOut, Trash2 } from 'lucide-react';
import { RecentlyDeleted } from './components/RecentlyDeleted';

type AppView = 'sites' | 'chlorophyll' | 'jobs' | 'daily-risk' | 'quotes';
type SitesSubView = 'sites' | 'registry';
type SiteDetailSubView = 'trees' | 'work-done';

function App() {
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null, isGuest: false });
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
    }

    purgeOldDeletedItems(); // Call purge on initial load
    
    const savedReports = loadReports();
    const savedReadings = loadChlorophyllReadings();
    const savedSites = loadSites();
    const savedJobs = loadJobs();
    const savedRisks = loadDailyRisks();
    const savedQuotes = loadQuotes();
    setReports(savedReports);
    setChlorophyllReadings(savedReadings);
    setSites(savedSites);
    setJobs(savedJobs);
    setDailyRisks(savedRisks);
    setQuotes(savedQuotes);
  }, []);

  const handleLogin = (user: User, isGuest: boolean) => {
    const newAuthState: AuthState = {
      isAuthenticated: true,
      user,
      isGuest
    };
    setAuthState(newAuthState);
    saveAuthState(newAuthState);
  };

  const handleLogout = () => {
    logout();
    setAuthState({ isAuthenticated: false, user: null, isGuest: false });
  };


  // Show login screen if not authenticated
  if (!authState.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isReadOnly = authState.isGuest;

  const handleCreateReport = (siteId?: string) => {
    if (isReadOnly) return;
    const newReport = createEmptyReport(siteId);
    // Pre-fill with site information if creating from a site
    if (siteId && selectedSite) {
      newReport.clientName = selectedSite.clientName;
      newReport.address = selectedSite.address;
      newReport.inspector = selectedSite.inspector;
    }
    setSelectedReport(newReport);
  };

  const handleSelectReport = (report: ArboristReport) => {
    setSelectedReport(report);
  };

  const handleSaveReport = (updatedReport: ArboristReport) => {
    if (isReadOnly) return;
    const existingIndex = reports.findIndex(r => r.id === updatedReport.id);

    let updatedReports: ArboristReport[];
    if (existingIndex >= 0) {
      updatedReports = reports.map(r => 
        r.id === updatedReport.id ? updatedReport : r
      );
    } else {
      updatedReports = [updatedReport, ...reports];
    }
    
    setReports(updatedReports);
    saveReports(updatedReports);
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
  };

  const handleCreateReading = () => {
    if (isReadOnly) return;
    const newReading = createEmptyChlorophyllReading();
    setSelectedReading(newReading);
    setIsNewReading(true);
  };

  const handleSelectReading = (reading: ChlorophyllReading) => {
    setSelectedReading(reading);
    setIsNewReading(false);
  };

  const handleSaveReading = (updatedReading: ChlorophyllReading) => {
    if (isReadOnly) return;
    const existingIndex = chlorophyllReadings.findIndex(r => r.id === updatedReading.id);

    let updatedReadings: ChlorophyllReading[];
    if (existingIndex >= 0) {
      updatedReadings = chlorophyllReadings.map(r => 
        r.id === updatedReading.id ? updatedReading : r
      );
    } else {
      updatedReadings = [updatedReading, ...chlorophyllReadings];
    }
    
    setChlorophyllReadings(updatedReadings);
    saveChlorophyllReadings(updatedReadings);
    setSelectedReading(null);
    setIsNewReading(false);
  };

  const handleDeleteReading = (readingId: string) => {
    if (isReadOnly) return;

    // Get all readings including soft-deleted items
    const allReadings = JSON.parse(localStorage.getItem('chlorophyll-readings') || '[]');

    // Soft delete the reading
    const updatedReadings = allReadings.map((r: ChlorophyllReading) => 
      r.id === readingId ? { ...r, deletedAt: Date.now() } : r
    );
    localStorage.setItem('chlorophyll-readings', JSON.stringify(updatedReadings)); // Save all (including soft-deleted)
    setChlorophyllReadings(loadChlorophyllReadings()); // Reload filtered list for UI
    
    setSelectedReading(null);
    setIsNewReading(false);
  };

  const handleBackToReadings = () => {
    setSelectedReading(null);
    setIsNewReading(false);
  };

  const handleCreateSite = () => {
    if (isReadOnly) return;
    const newSite = createEmptySite();
    setEditingSite(newSite);
    setIsNewSite(true);
  };

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
  };

  const handleEditSite = () => {
    if (selectedSite) {
      setEditingSite(selectedSite);
      setIsNewSite(false);
    }
  };

  const handleSaveSite = (updatedSite: Site) => {
    if (isReadOnly) return;
    const existingIndex = sites.findIndex(s => s.id === updatedSite.id);

    let updatedSites: Site[];
    if (existingIndex >= 0) {
      updatedSites = sites.map(s => 
        s.id === updatedSite.id ? updatedSite : s
      );
    } else {
      updatedSites = [updatedSite, ...sites];
    }
    
    saveSites(updatedSites); // Save all (including soft-deleted)
    setSites(loadSites()); // Reload filtered list for UI
    setEditingSite(null);
    setIsNewSite(false);
    
    // If it's a new site, select it after saving
    if (isNewSite) {
      setSelectedSite(updatedSite);
    }
  };

  const handleDeleteSite = (siteId: string) => {
    if (isReadOnly) return;

    // Get all data including soft-deleted items
    const allReports = JSON.parse(localStorage.getItem('arborist-reports') || '[]');
    const allJobs = JSON.parse(localStorage.getItem('arborist-jobs') || '[]');
    const allSites = JSON.parse(localStorage.getItem('arborist-sites') || '[]');

    // Soft delete all reports associated with this site
    const updatedReports = allReports.map((r: ArboristReport) => 
      r.siteId === siteId ? { ...r, deletedAt: Date.now() } : r
    );
    localStorage.setItem('arborist-reports', JSON.stringify(updatedReports)); // Save all (including soft-deleted)
    setReports(loadReports()); // Reload filtered list for UI

    // Soft delete all jobs associated with this site
    const updatedJobs = allJobs.map((j: Job) => 
      j.siteId === siteId ? { ...j, deletedAt: Date.now() } : j
    );
    localStorage.setItem('arborist-jobs', JSON.stringify(updatedJobs)); // Save all (including soft-deleted)
    setJobs(loadJobs()); // Reload filtered list for UI

    // Soft delete the site
    const updatedSites = allSites.map((s: Site) => 
      s.id === siteId ? { ...s, deletedAt: Date.now() } : s
    );
    localStorage.setItem('arborist-sites', JSON.stringify(updatedSites)); // Save all (including soft-deleted)
    setSites(loadSites()); // Reload filtered list for UI
    
    setEditingSite(null);
    setSelectedSite(null);
    setIsNewSite(false);
  };

  const handleBackToSites = () => {
    setSelectedSite(null);
    setEditingSite(null);
    setIsNewSite(false);
  };

  const handleBackToSiteEditor = () => {
    setEditingSite(null);
    setIsNewSite(false);
  };

  const handleImportTrees = (importedTrees: ArboristReport[]) => {
    if (isReadOnly) return;
    const updatedReports = [...importedTrees, ...reports];
    setReports(updatedReports);
    saveReports(updatedReports);
  };

  const handleCreateJob = () => {
    if (isReadOnly) return;
    const newJob = createEmptyJob();
    setSelectedJob(newJob);
    setIsNewJob(true);
  };

  const handleCreateJobForSite = (siteId: string) => {
    if (isReadOnly) return;
    const newJob = createEmptyJob(siteId);
    // Pre-fill with site information if creating from a site
    if (selectedSite) {
      newJob.clientName = selectedSite.clientName;
      newJob.location = selectedSite.address;
    }
    setSelectedJob(newJob);
    setIsNewJob(true);
  };
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setIsNewJob(false);
  };

  const handleSaveJob = (updatedJob: Job) => {
    if (isReadOnly) return;
    const existingIndex = jobs.findIndex(j => j.id === updatedJob.id);

    let updatedJobs: Job[];
    if (existingIndex >= 0) {
      updatedJobs = jobs.map(j => 
        j.id === updatedJob.id ? updatedJob : j
      );
    } else {
      updatedJobs = [updatedJob, ...jobs];
    }
    
    saveJobs(updatedJobs); // Save all (including soft-deleted)
    setJobs(loadJobs()); // Reload filtered list for UI
    setSelectedJob(null);
    setIsNewJob(false);
  };

  const handleDeleteJob = (jobId: string) => {
    if (isReadOnly) return;
    
    // Get all jobs including soft-deleted items for proper update
    const allJobs = JSON.parse(localStorage.getItem('arborist-jobs') || '[]');
    
    // Soft delete the job
    const updatedJobs = allJobs.map((j: Job) => 
      j.id === jobId ? { ...j, deletedAt: Date.now() } : j
    );
    localStorage.setItem('arborist-jobs', JSON.stringify(updatedJobs)); // Save all (including soft-deleted)
    setJobs(loadJobs()); // Reload filtered list for UI
    
    setSelectedJob(null);
    setIsNewJob(false);
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
    setIsNewJob(false);
  };

  const handleCreateRisk = () => {
    if (isReadOnly) return;
    const newRisk = createEmptyDailyRisk();
    setSelectedRisk(newRisk);
    setIsNewRisk(true);
  };

  const handleSelectRisk = (risk: DailyRisk) => {
    setSelectedRisk(risk);
    setIsNewRisk(false);
  };

  const handleSaveRisk = (updatedRisk: DailyRisk) => {
    if (isReadOnly) return;
    const existingIndex = dailyRisks.findIndex(r => r.id === updatedRisk.id);

    let updatedRisks: DailyRisk[];
    if (existingIndex >= 0) {
      updatedRisks = dailyRisks.map(r => 
        r.id === updatedRisk.id ? updatedRisk : r
      );
    } else {
      updatedRisks = [updatedRisk, ...dailyRisks];
    }
    
    saveDailyRisks(updatedRisks); // Save all (including soft-deleted)
    setDailyRisks(loadDailyRisks()); // Reload filtered list for UI
    setSelectedRisk(null);
    setIsNewRisk(false);
  };

  const handleDeleteRisk = (riskId: string) => {
    if (isReadOnly) return;
    
    // Get all risks including soft-deleted items for proper update
    const allRisks = JSON.parse(localStorage.getItem('daily-risk-assessments') || '[]');
    
    // Soft delete the risk
    const updatedRisks = allRisks.map((r: DailyRisk) => 
      r.id === riskId ? { ...r, deletedAt: Date.now() } : r
    );
    localStorage.setItem('daily-risk-assessments', JSON.stringify(updatedRisks)); // Save all (including soft-deleted)
    setDailyRisks(loadDailyRisks()); // Reload filtered list for UI
    
    setSelectedRisk(null);
    setIsNewRisk(false);
  };

  const handleBackToRisks = () => {
    setSelectedRisk(null);
    setIsNewRisk(false);
  };

  const handleCreateQuote = () => {
    if (isReadOnly) return;
    const newQuote = createEmptyQuote();
    setSelectedQuote(newQuote);
    setIsNewQuote(true);
  };

  const handleImportQuotes = (importedQuotes: Quote[]) => {
    if (isReadOnly) return;
    const updatedQuotes = [...importedQuotes, ...quotes];
    setQuotes(updatedQuotes);
    saveQuotes(updatedQuotes);
  };

  const handleSelectQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsNewQuote(false);
  };

  const handleSaveQuote = (updatedQuote: Quote) => {
    if (isReadOnly) return;
    const existingIndex = quotes.findIndex(q => q.id === updatedQuote.id);

    let updatedQuotes: Quote[];
    if (existingIndex >= 0) {
      updatedQuotes = quotes.map(q => 
        q.id === updatedQuote.id ? updatedQuote : q
      );
    } else {
      updatedQuotes = [updatedQuote, ...quotes];
    }
    
    setQuotes(updatedQuotes);
    saveQuotes(updatedQuotes);
    setSelectedQuote(null);
    setIsNewQuote(false);
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (isReadOnly) return;
    const updatedQuotes = quotes.filter(q => q.id !== quoteId);
    setQuotes(updatedQuotes);
    saveQuotes(updatedQuotes);
    setSelectedQuote(null);
    setIsNewQuote(false);
  };

  const handleArchiveQuote = (quoteId: string) => {
    if (isReadOnly) return;
    const updatedQuotes = quotes.map(quote =>
      quote.id === quoteId ? { ...quote, archived: true, updatedAt: Date.now() } : quote
    );
    setQuotes(updatedQuotes);
    saveQuotes(updatedQuotes);
    setSelectedQuote(null);
    setIsNewQuote(false);
  };
  const handleBackToQuotes = () => {
    setSelectedQuote(null);
    setIsNewQuote(false);
  };

  const handleUpdateQuoteStatus = (quoteId: string, status: Quote['status']) => {
    if (isReadOnly) return;
    const updatedQuotes = quotes.map(quote =>
      quote.id === quoteId ? { ...quote, status, updatedAt: Date.now() } : quote
    );
    setQuotes(updatedQuotes);
    saveQuotes(updatedQuotes);
  };

  // New handler for recovering items
  const handleRecoverItem = (type: string, id: string) => {
    if (isReadOnly) return;
    switch (type) {
      case 'report':
        recoverReport(id);
        setReports(loadReports());
        break;
      case 'chlorophyll':
        recoverChlorophyllReading(id);
        setChlorophyllReadings(loadChlorophyllReadings());
        break;
      case 'site':
        recoverSite(id);
        setSites(loadSites());
        break;
      case 'job':
        recoverJob(id);
        setJobs(loadJobs());
        break;
      case 'dailyRisk':
        recoverDailyRisk(id);
        setDailyRisks(loadDailyRisks());
        break;
      default:
        break;
    }
    // Close recently deleted modal after recovery
    setShowRecentlyDeleted(false);
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'sites') {
      setSitesSubView('sites'); // Reset sites sub-view when leaving sites
      setSiteDetailSubView('trees'); // Reset site detail sub-view
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
    setIsMobileMenuOpen(false); // Close mobile menu if open
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
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleSiteDetailSubViewChange = (subView: SiteDetailSubView) => {
    setSiteDetailSubView(subView);
    setSearchQuery('');
    setSelectedReport(null);
    setSelectedJob(null);
    setIsNewJob(false);
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };
  const getTreeCountForSite = (siteId: string): number => {
    return reports.filter(r => r.siteId === siteId).length;
  };

  const getTreesForSite = (siteId: string): ArboristReport[] => {
    return reports.filter(r => r.siteId === siteId);
  };

  const getJobsForSite = (siteId: string): Job[] => {
    return jobs.filter(j => j.siteId === siteId);
  };
  // If editing a report
  if (selectedReport) {
    return (
      <ReportEditor
        report={selectedReport}
        onSave={handleSaveReport}
        onBack={selectedSite ? () => {
          setSelectedReport(null);
        } : handleBackToReports}
      />
    );
  }

  // If editing a chlorophyll reading
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

  // If editing a site
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

  // If editing a job
  if (selectedJob) {
    return (
      <JobEditor
        job={selectedJob}
        onSave={handleSaveJob}
        onDelete={handleDeleteJob}
        onBack={handleBackToJobs}
        isNew={isNewJob}
      />
    );
  }

  // If editing a daily risk assessment
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

  // If editing a quote
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

  // If viewing trees in a site
  if (selectedSite) {
    return (
      <SiteDetailScreen
        site={selectedSite}
        trees={getTreesForSite(selectedSite.id)}
        jobs={jobs}
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

  const navItems = [
    { view: 'sites' as AppView, icon: Home, label: 'Sites' },
    { view: 'chlorophyll' as AppView, icon: Leaf, label: 'Chlorophyll' },
    { view: 'jobs' as AppView, icon: TreePine, label: 'Jobs' },
    { view: 'daily-risk' as AppView, icon: Shield, label: 'Risk' },
    { view: 'quotes' as AppView, icon: QuoteIcon, label: 'Quotes' },
  ];

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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
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

              {authState.user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--canopy), var(--forest-light))',
                    border: '1px solid var(--border-bright)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--leaf)' }}>
                      {authState.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:flex" style={{ flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {authState.user.name}
                    </span>
                    {authState.isGuest && (
                      <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Guest
                      </span>
                    )}
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
        {currentView === 'sites' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Sites Sub-Navigation */}
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
        ) : currentView === 'chlorophyll' ? (
          <ChlorophyllList
            readings={chlorophyllReadings}
            onSelectReading={handleSelectReading}
            onCreateReading={handleCreateReading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : currentView === 'jobs' ? (
          <JobList
            jobs={jobs}
            onSelectJob={handleSelectJob}
            onCreateJob={handleCreateJob}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : currentView === 'daily-risk' ? (
          <DailyRiskList
            risks={dailyRisks}
            onSelectRisk={handleSelectRisk}
            onCreateRisk={handleCreateRisk}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : (
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

      <RecentlyDeleted
        isOpen={showRecentlyDeleted}
        onClose={() => setShowRecentlyDeleted(false)}
        onRecover={handleRecoverItem}
      />
    </div>
  );
}

export default App;