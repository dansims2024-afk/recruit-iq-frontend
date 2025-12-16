import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Briefcase, User, Sparkles, AlertCircle, Copy, Search, FileText, Check, Percent, ThumbsUp, ThumbsDown, MessageCircle, X, RefreshCw, HelpCircle, Download, Loader2, Building, UserPlus, Mail, Trash2, Zap } from 'lucide-react';

const localStorageKey = 'hm_copilot_leaderboard_data';

// --- CONFIGURATION ---
// SET TO FALSE TO ENABLE REAL API CALLS ON YOUR LIVE DEPLOYMENT.
const ENABLE_DEMO_MODE = false; 

// *** API KEY CONFIGURATION ***
// WARNING: The API Key is exposed here. This should ideally be managed via a secure proxy.
const apiKey = "AIzaSyDz35tuY1W9gIs63HL6_ouUiVHoIy7v92o"; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

// --- Brand Colors ---
const BRAND = {
    primaryBlue: '#2B81B9',
    deepPurple: '#52438E',
    orchid: '#8C50A1',
    softBlue: '#b2acce',
    cyan: '#00c9ff',
};

// --- Example Data ---
const FULL_EXAMPLE_JD = `Company: Stellar Dynamics Corp.
Location: Phoenix, AZ
Job Type: Full-Time, Exempt
Reports To: Accounting Manager
🌟 About Stellar Dynamics Corp.
Stellar Dynamics Corp. is a rapidly growing tech startup focused on revolutionizing sustainable energy storage solutions. We are a dynamic, fast-paced organization committed to financial excellence and operational efficiency. We are seeking a detail-oriented and motivated Staff Accountant to join our Finance team and contribute to our mission of building a cleaner, brighter future.

📝 Key Responsibilities
The Staff Accountant will play a crucial role in maintaining accurate financial records and supporting the month-end close process. Key responsibilities include:

General Ledger (GL) Management:
Prepare and post journal entries, including accruals, prepayments, and reclassifications.
Perform monthly GL account reconciliations and analysis to ensure accuracy and resolve discrepancies.
Month-End Close:
Assist in the timely and accurate completion of the monthly, quarterly, and annual financial close process.
Generate and review supporting schedules and reports for financial statements.
Accounts Payable (AP) & Accounts Receivable (AR):
Process vendor invoices and manage weekly payment runs.
Assist with the invoicing of customers and monitor outstanding AR balances.
Fixed Assets:
Maintain the fixed asset register, including tracking additions, disposals, and calculating monthly depreciation.
Tax & Compliance:
Assist with documentation for external audits and compliance requirements.
Support the preparation of sales and use tax filings.
Ad-Hoc Projects:
Participate in process improvement initiatives and system upgrades within the Finance department.
🎯 Qualifications
Required:
Education: Bachelor's degree in Accounting, Finance, or a related field.
Experience: 1-3 years of experience in an accounting role, preferably within a corporate setting.
Technical Skills: Strong proficiency in Microsoft Excel (pivot tables, VLOOKUPs, etc.) and experience with a major ERP system (e.g., SAP, Oracle, or NetSuite).
Foundational Knowledge: Solid understanding of Generally Accepted Accounting Principles (GAAP).
Preferred:
CPA track or desire to pursue certification.
Experience in the technology or manufacturing industries.
✨ Skills & Competencies
Detail-Oriented: Exceptional attention to detail and accuracy in data entry and analysis.
Organizational Skills: Excellent time management and ability to meet strict deadlines.
Communication: Strong verbal and written communication skills to interact effectively with internal teams.
Problem-Solving: Proactive approach to identifying and resolving accounting issues.
💵 Benefits & Perks
Competitive salary and performance-based bonus.
Generous paid time off and paid holidays.
Comprehensive health, dental, and vision insurance plans.
401(k) matching program.
Casual dress code and flexible work arrangements (e.g., hybrid schedule).
On-site gym and complimentary snacks/beverages.`;
  
const EXAMPLE_RESUME = `Soda McTasty
(555) 123-4567 | soda.mctasty@email.com | Phoenix, AZ 85001 | https://www.google.com/search?q=linkedin.com/in/sodamctasty

Professional Summary
Highly motivated and detail-oriented Junior Accountant with 1.5 years of hands-on experience in financial record maintenance, general ledger management, and supporting full-cycle accounting functions. Proven ability to execute month-end closing procedures and enhance data accuracy. Eager to leverage strong GAAP foundation and technical proficiency to contribute to a fast-paced corporate finance team. Currently studying to sit for the Certified Public Accountant (CPA) exam.

Experience
Junior Accountant
"Desert Bloom" Event Management, Phoenix, AZJanuary 2024 – Present

Managed the end-to-end Accounts Payable (AP) process for 50+ vendors, ensuring timely invoice processing, three-way matching, and managing weekly payment schedules.
Prepared and posted 40+ routine and non-routine journal entries monthly, including accruals for operating expenses and prepaid asset amortization.
Assisted the Accounting Manager in the month-end close process, successfully reconciling six key balance sheet accounts, including bank accounts and customer deposits.
Maintained detailed records of property and equipment, calculating and recording monthly depreciation using the straight-line method.
Supported external auditors by preparing organized documentation and supporting schedules for payroll liabilities and cash balances.
Accounting Intern
Swift Financial Consulting, Tempe, AZMay 2023 – December 2023

Provided administrative and technical support for bookkeeping activities, processing 15-20 transactions daily for multiple small business clients.
Developed intermediate proficiency in Microsoft Excel, utilizing VLOOKUP and Pivot Tables to aggregate large data sets for budget vs. actual variance analysis.
Maintåained confidential client files and ensured adherence to data retention policies.
Education
Bachelor of Science in Accounting
Arizona State University (ASU), Tempe, AZGraduation: December 2023

GPA: 3.8/4.0, Cum Laude
Relevant Coursework: Advanced Financial Accounting, Federal Taxation, Auditing, Business Ethics
Skills & Technical Proficiency
Accounting Software: QuickBooks Online (Advanced), Microsoft Dynamics GP (Basic exposure/training), Sage 50.
Data Analysis: Microsoft Excel (Advanced), Microsoft Office Suite, Google Sheets.
Knowledge: Strong understanding of U.S. GAAP, Financial Reporting, and General Ledger Reconciliation.
Certifications: CPA Candidate (Planning to sit for the first exam section in Q2 2025).
Awards & Recognition
ASU Dean's List (2022, 2023)
Recipient of the "Emerging Leader" internal award at Desert Bloom (Q3 2024)`;

// --- Utility Functions ---

const extractCandidateName = (resumeContent) => {
    if (!resumeContent) return 'Unnamed Candidate';
    const lines = resumeContent.trim().split('\n');
    const firstLine = lines.find(line => line.trim() !== '');
    if (!firstLine) return 'Unnamed Candidate';
    // Basic heuristic: assume the first line is the name if it's short
    if (firstLine.length < 50 && !/[@\(\)\d]/.test(firstLine)) {
        return firstLine.trim();
    }
    const nameMatch = firstLine.match(/^(\S+\s\S+)/); 
    if (nameMatch) {
        return nameMatch[1];
    }
    return firstLine.split('|')[0].trim() || 'Unnamed Candidate';
};

const hashJobDescription = (jd) => {
    let hash = 0;
    if (!jd || jd.length === 0) return "default";
    for (let i = 0; i < jd.length; i++) {
        const char = jd.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return Math.abs(hash).toString(36);
};

const getLeaderboard = () => {
    try {
        const data = localStorage.getItem(localStorageKey);
        return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
};

const saveLeaderboard = (data) => {
    try {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
    } catch (e) { }
};

const updateLeaderboardUtility = (newEntry) => {
    const allData = getLeaderboard();
    let currentList = allData[newEntry.jdHash] || [];
    const existingIndex = currentList.findIndex(c => c.name === newEntry.name);
    if (existingIndex !== -1 && currentList[existingIndex].score === newEntry.score) {
        return; 
    }
    if (existingIndex !== -1) {
        currentList[existingIndex] = newEntry;
    } else {
        currentList.push(newEntry);
    }
    const updatedLeaderboard = { ...allData, [newEntry.jdHash]: currentList };
    saveLeaderboard(updatedLeaderboard);
};

// GLOBAL HELPER: handleCopy needs to be defined before components use it
let setCopyFeedbackGlobal = null; 
const handleCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        if (setCopyFeedbackGlobal) {
            setCopyFeedbackGlobal("Copied!");
            setTimeout(() => setCopyFeedbackGlobal(null), 2000);
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
};

// --- Mock Data Object (Used for Fallback) ---
const MOCK_ANALYSIS_DATA = {
    matchScore: 85,
    fitSummary: "MOCK DATA (Fallback): Strong candidate with solid accounting foundation. This result is shown because the API call failed or timed out.",
    strengths: ["1. Strong 1.5 years experience in GL and AP.", "2. Advanced Excel proficiency confirmed.", "3. Currently pursuing CPA."],
    gaps: ["1. Limited exposure to SAP/Oracle/NetSuite ERP.", "2. No direct experience cited for sales and use tax filing.", "3. Resume contained a possible spelling error ('Maintåained')."],
    interviewQuestions: ["Q1. Describe a time you streamlined a month-end close task; quantify the time saved.", "Q2. Provide a specific example of an AR discrepancy you resolved and the impact.", "Q3. What specific features or functions of NetSuite would you prioritize learning first?"],
};

// --- Sub-Components ---

const Logo = () => (
  <svg width="42" height="42" viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="swirlBrand" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={BRAND.cyan} />
        <stop offset="100%" stopColor={BRAND.primaryBlue} />
      </linearGradient>
      <linearGradient id="swirlDeep" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={BRAND.deepPurple} />
        <stop offset="100%" stopColor={BRAND.orchid} />
      </linearGradient>
    </defs>
    <path d="M 45 15 C 25 15, 10 35, 15 60 C 16 68, 25 75, 35 75 C 40 75, 35 70, 30 65 C 20 50, 25 30, 45 25 C 50 23, 55 20, 45 15 Z" fill="url(#swirlBrand)" />
    <path d="M 12 55 C 10 45, 12 35, 18 25 L 20 28 C 15 35, 4 45, 16 52 Z" fill={BRAND.cyan} />
    <path d="M 30 78 C 20 75, 15 65, 15 55 L 12 58 C 15 70, 25 80, 35 80 Z" fill={BRAND.primaryBlue} />
    <path d="M 55 85 C 75 85, 90 65, 85 40 C 84 32, 75 25, 65 25 C 60 25, 65 30, 70 35 C 80 50, 75 70, 55 75 C 50 77, 45 80, 55 85 Z" fill="url(#swirlDeep)" />
    <path d="M 88 45 C 90 55, 88 65, 82 75 L 80 72 C 85 65, 86 55, 84 48 Z" fill={BRAND.orchid} />
    <path d="M 70 22 C 80 25, 85 35, 85 45 L 88 42 C 85 30, 75 20, 65 20 Z" fill={BRAND.deepPurple} />
  </svg>
);

const MatchScoreCard = ({ analysis, onCopySummary }) => {
  const score = analysis.matchScore || 0;
  const summary = analysis.fitSummary || "Run analysis to generate fit summary.";
  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const gaps = Array.isArray(analysis.gaps) ? analysis.gaps : [];
  const isHighFit = score >= 80;
  const colorClass = isHighFit ? 'from-[#00c9ff] to-[#2B81B9]' : score >= 50 ? 'from-[#8C50A1] to-[#52438E]' : 'from-red-500 to-red-700';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#b2acce]/50 p-6 mb-6">
      <h2 className="text-xs uppercase tracking-wider font-bold text-[#52438E] mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><Percent size={14} className="text-[#00c9ff]" />Candidate Scorecard</div>
        <button onClick={onCopySummary} disabled={!analysis.matchScore} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50 transition-colors print:hidden"><Copy size={12} /> Copy Summary</button>
      </h2>
      <div className="flex items-center gap-6 mb-4">
        <div className={`relative w-24 h-24 flex items-center justify-center rounded-full border-4 text-2xl font-bold shadow-lg bg-gradient-to-br ${colorClass} text-white`}>{score}%</div>
        <div className="flex-1"><h3 className="font-bold text-[#2B81B9] mb-1">AI Screening Assessment</h3><p className="text-sm text-slate-600 leading-snug italic">{summary}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
        <div className="bg-[#00c9ff]/5 border border-[#00c9ff]/20 rounded-xl p-4">
          <div className="font-semibold text-[#2B81B9] flex items-center gap-1 mb-2"><ThumbsUp size={14} /> Strong Matches</div>
          {strengths.length > 0 ? ( <ul className="space-y-1">{strengths.map((s, i) => ( <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#00c9ff] shrink-0" />{typeof s === 'string' ? s : JSON.stringify(s)}</li>))}</ul> ) : <p className="text-xs text-slate-500 italic">None identified.</p>}
        </div>
        <div className="bg-[#8C50A1]/5 border border-[#8C50A1]/20 rounded-xl p-4">
          <div className="font-semibold text-[#8C50A1] flex items-center gap-1 mb-2"><ThumbsDown size={14} /> Red Flags / Gaps</div>
          {gaps.length > 0 ? ( <ul className="space-y-1">{gaps.map((g, i) => ( <li key={i} className="text-slate-600 text-xs flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#8C50A1] shrink-0" />{typeof g === 'string' ? g : JSON.stringify(g)}</li>))}</ul> ) : <p className="text-xs text-slate-500 italic">None identified.</p>}
        </div>
      </div>
    </div>
  );
};

const InterviewQuestionsSection = ({ questions }) => (
  <div className="bg-white rounded-2xl shadow-md border border-[#b2acce]/50 p-6 mb-6">
    <h2 className="text-xs uppercase tracking-wider font-bold text-[#52438E] mb-4 flex items-center gap-2"><HelpCircle size={14} className="text-[#00c9ff]" />Suggested Interview Questions</h2>
    <div className="grid grid-cols-1 gap-3">
      {questions && questions.length > 0 ? ( questions.map((q, i) => ( <div key={i} className="flex items-start bg-slate-50 border border-[#b2acce]/30 rounded-xl p-4 hover:bg-[#00c9ff]/5 transition-colors"><div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2B81B9]/10 text-[#2B81B9] flex items-center justify-center text-xs font-bold mr-3 mt-0.5">Q{i + 1}</div><div className="text-sm text-slate-700 font-medium leading-relaxed">{q}</div></div> )) ) : ( <p className="text-sm text-slate-500 italic">No questions generated.</p> )}
    </div>
  </div>
);

const CommunicationTools = ({ activeTool, setActiveTool, draftContent, handleDraft, handleCopy, setDrafts, selectedTone, setSelectedTone, toolLoading }) => (
  <div className="bg-[#f0e4f5] rounded-2xl shadow-md border border-[#8C50A1]/50 p-6">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><MessageCircle size={16} className="text-[#52438E]" /> Manager Actions</h4>
      <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-slate-500">Tone:</span>
          {['professional', 'casual', 'direct'].map(tone => (
              <button key={tone} onClick={() => setSelectedTone(tone)} className={`px-3 py-1 text-xs font-medium rounded-md capitalize ${selectedTone === tone ? 'bg-[#52438E] text-white' : 'text-slate-500 hover:bg-[#b2acce}/20'}`}>{tone}</button>
          ))}
      </div>
      {toolLoading && ( <div className="text-sm text-slate-500 flex items-center gap-2 justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#2B81B9]" /> Generating Draft...</div> )}
      <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => handleDraft('invite')} disabled={toolLoading} className="py-3 bg-white border border-[#b2acce] rounded-xl text-sm hover:border-[#00c9ff] text-slate-700 flex flex-col items-center gap-1 text-[#2B81B9] font-semibold hover:bg-[#00c9ff]/5 transition-all"><UserPlus size={16} className="text-[#00c9ff]" /> Custom Interview Email</button>
          <button onClick={() => handleDraft('outreach')} disabled={toolLoading} className="py-3 bg-white border border-[#b2acce] rounded-xl text-sm hover:border-[#8C50A1] text-slate-700 flex flex-col items-center gap-1 text-[#8C50A1] font-semibold hover:bg-[#8C50A1]/5 transition-all"><Mail size={16} className="text-[#8C50A1]" /> Sourcing Email Draft</button>
      </div>
      {draftContent && activeTool && (
          <div className="bg-white border border-[#b2acce] rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="mb-2 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Draft Preview ({activeTool === 'outreach' ? 'Sourcing Email Draft' : 'Custom Interview Email'})</span>
                  <button onClick={() => setActiveTool(null)}><X size={14} className="text-slate-400 hover:text-slate-600"/></button>
              </div>
              <textarea value={draftContent} onChange={(e) => setDrafts(activeTool, e.target.value)} className="w-full h-48 text-sm bg-transparent border border-[#b2acce]/50 p-3 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#2B81B9] text-slate-700" />
              <div className="mt-3 flex justify-end"><button onClick={() => handleCopy(draftContent)} className="px-3 py-1.5 bg-slate-50 border border-[#b2acce] rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-[#00c9ff]/10 text-[#2B81B9]"><Copy size={12} /> Copy to Clipboard</button></div>
          </div>
      )}
  </div>
);

const AppSummary = () => (
    <div className="bg-white rounded-2xl shadow-md border border-[#b2acce]/50 p-6 mb-6">
        <h2 className="text-lg font-bold text-[#52438E] mb-2 flex items-center gap-2"><Sparkles size={18} className="text-[#00c9ff]" /> Recruit-IQ: Candidate Match Analyzer</h2>
        <p className="text-sm text-slate-600 mb-4">Recruit-IQ uses the Gemini API to instantly screen candidate resumes against your specific job requirements, providing a quantified **Match Score** and actionable insights.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-[#b2acce]/30">
                <FileText size={16} className="text-[#2B81B9] flex-shrink-0 mt-0.5" />
                <div><span className="font-bold">Step 1: Input Job and Resume</span><p className="text-slate-500 mt-0.5">Paste or upload the Job Description (JD) and the Candidate's Resume on the left.</p></div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-[#b2acce]/30">
                <Search size={16} className="text-[#8C50A1] flex-shrink-0 mt-0.5" />
                <div><span className="font-bold">Step 2: Screen Candidate</span><p className="text-slate-500 mt-0.5">Click the 'Screen Candidate' button to initiate the AI analysis.</p></div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-[#b2acce]/30">
                <Percent size={16} className="text-[#00c9ff] flex-shrink-0 mt-0.5" />
                <div><span className="font-bold">Step 3: Review Results</span><p className="text-slate-500 mt-0.5">Instantly receive a Match Score, Strengths, Gaps, and tailored Interview Questions.</p></div>
            </div>
        </div>
    </div>
);

// --- Main App ---
export default function App() { 
  const [activeTab, setActiveTab] = useState('jd'); 
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [candidateName, setCandidateName] = useState(''); 
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);
  
  const [activeTool, setActiveTool] = useState(null);
  const [inviteDraft, setInviteDraft] = useState('');
  const [outreachDraft, setOutreachDraft] = useState('');
  const [toolLoading, setToolLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState('professional'); 
  const [libsLoaded, setLibsLoaded] = useState(false);
  
  const [leaderboardData, setLeaderboardData] = useState(getLeaderboard());

  // --- EFFECT AND SESSION LOGIC ---
  useEffect(() => { setCopyFeedbackGlobal = setCopyFeedback; }, []);

  const currentJdHash = useMemo(() => hashJobDescription(jobDescription), [jobDescription]);
  
  const handleClearLeaderboard = useCallback((jdHashToClear) => {
      setLeaderboardData(prev => { const newLeaderboard = { ...prev }; delete newLeaderboard[jdHashToClear]; saveLeaderboard(newLeaderboard); return newLeaderboard; });
  }, []);

  useEffect(() => {
      const allData = getLeaderboard();
      if (JSON.stringify(allData) !== JSON.stringify(leaderboardData)) { setLeaderboardData(allData); }
  }, [analysis, currentJdHash]);

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
      });
    };
    Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js')
    ]).then(() => {
      if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }
      setLibsLoaded(true);
    }).catch(err => console.error("Failed to load file parsing libs", err));
  }, []);
  
  // --- CORE CALLBACKS ---
  const clearAll = useCallback(() => {
    setJobDescription(''); setResume(''); setAnalysis(null); 
    setInviteDraft(''); setOutreachDraft(''); 
    setActiveTool(null); setError(null); setCandidateName('');
  }, []);

  const handleLoadExample = useCallback(() => {
    setJobDescription(FULL_EXAMPLE_JD);
    setResume(EXAMPLE_RESUME);
    setCandidateName(extractCandidateName(EXAMPLE_RESUME)); 
    setError(null); setAnalysis(null); 
    setInviteDraft(''); setOutreachDraft(''); 
    setActiveTool(null);
  }, []); 

  const readPdf = async (arrayBuffer) => { 
      if (window.pdfjsLib) {
          const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const strings = content.items.map(item => item.str);
              text += strings.join(" ") + "\n";
          }
          return text;
      }
      return "PDF content extracted.";
  };
  const readDocx = async (arrayBuffer) => { 
      if (window.mammoth) {
          const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          return result.value;
      }
      return "DOCX content extracted."; 
  };
  
  const processText = useCallback((text, type, fileName) => {
      let cleanedText = text.replace(/[\uFFFD\u0000-\u001F\u007F-\u009F\u200B]/g, ' ').trim();
      if (!cleanedText || cleanedText.length < 50) { setError(`Could not extract clean text from ${fileName}. Please copy/paste.`); setLoading(false); return; }
      if (type === 'jd') { setJobDescription(cleanedText); setActiveTab('resume'); } 
      else { setResume(cleanedText); setCandidateName(extractCandidateName(cleanedText)); }
      setLoading(false);
  }, []);

  // --- File/Content Utility Functions ---
  const handleFileUpload = useCallback(async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true); setError(null);
    const isBinaryFile = file.type.includes('pdf') || file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc');
    if (isBinaryFile && !libsLoaded) { setError("File parsers are still loading. Please wait a moment and try again."); setLoading(false); e.target.value = null; return; }
    const reader = new FileReader();
    reader.onload = async (event) => {
        let text = ""; const fileType = file.type;
        try {
            if (isBinaryFile) {
                if (fileType.includes("pdf")) { text = await readPdf(event.target.result); } 
                else if (fileType.includes("wordprocessingml.document") || file.name.endsWith('.docx')) { text = await readDocx(event.target.result); } 
                else { text = event.target.result; } 
            } else { 
                text = event.target.result; 
            }
            processText(text, type, file.name);
        } catch (err) { console.error("File parsing error:", err); setError(`Error reading ${file.name}. Please copy text manually.`); setLoading(false); }
    };
    if (isBinaryFile || file.type.includes('octet-stream')) { reader.readAsArrayBuffer(file); } 
    else { reader.readAsText(file); }
    e.target.value = null;
  }, [libsLoaded, processText]);
  
  const setDrafts = useCallback((type, value) => {
      if (type === 'invite') setInviteDraft(value);
      if (type === 'outreach') setOutreachDraft(value);
  }, []);
  
  // --- REAL API LOGIC: DIRECT CLIENT-SIDE CALL (Uses provided API Key) ---
  const generateContent = useCallback(async (toolType, prompt) => {
    setToolLoading(true); setError(null); setActiveTool(toolType);
    
    // --- DEMO MODE CHECK FOR EMAIL GENERATION ---
    const isCanvasEnvironment = window.location.host.includes('usercontent.goog') || window.location.host.includes('blob:');
    if (ENABLE_DEMO_MODE || isCanvasEnvironment) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        const name = extractCandidateName(resume) || "Candidate";
        const mockInvite = `Subject: Interview Invitation: Staff Accountant\n\nHi ${name},\n\nThank you for applying. We were impressed by your background in GL Management. Please choose a time to interview.`;
        const mockOutreach = `Subject: Exciting Role: Staff Accountant\n\nHi ${name},\n\nI saw your CPA candidate status and wanted to connect about our role. Are you open to a chat?`;
        
        if (toolType === 'invite') setInviteDraft(mockInvite);
        if (toolType === 'outreach') setOutreachDraft(mockOutreach);
        setToolLoading(false);
        return;
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            if (toolType === 'invite') setInviteDraft(text);
            if (toolType === 'outreach') setOutreachDraft(text);
        } else {
            setError("AI returned an empty response.");
        }
    } catch (err) { setError(`Failed to generate content: ${err.message}`); } finally { setToolLoading(false); }
  }, [resume]);


  const handleDraft = useCallback((type) => {
      if (!resume.trim() || !jobDescription.trim()) { setError("Please fill in both a JD and Resume."); return; }
      const name = extractCandidateName(resume);
      setCandidateName(name);
      const prompt = `Act as a Hiring Manager. Tone: ${selectedTone}. Candidate: ${name}. Task: Write a ${type === 'invite' ? 'interview invitation' : 'cold outreach'} email based on the resume below.\n\nJD: ${jobDescription}\nResume: ${resume}`;
      generateContent(type, prompt);
  }, [resume, jobDescription, generateContent, selectedTone]);

  // --- Core Analysis Logic (DIRECT API CALL) ---
  const handleAnalyzeAsync = async () => {
    // DIRECT API CALL TO GOOGLE GEMINI
    const prompt = `Analyze the Candidate Resume against the Job Description. Act as an expert Technical Recruiter. Return a valid JSON object: { "matchScore": number (0-100), "fitSummary": "string", "strengths": ["str"], "gaps": ["str"], "interviewQuestions": ["str"] } JD: ${jobDescription} Resume: ${resume}`;
    
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
      });
      
      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Google API Error (${response.status}): ${errorText.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if(textResult) {
        const parsedResult = JSON.parse(textResult);
        let score = parsedResult.matchScore;
        if (typeof score === 'string') score = parseInt(score.replace(/[^0-9]/g, ''));
        
        const newEntry = { jdHash: currentJdHash, name: extractCandidateName(resume), score: score, summary: parsedResult.fitSummary };
        if (extractCandidateName(resume) !== 'Unnamed Candidate' && score > 0) { updateLeaderboardUtility(newEntry); }
        
        setAnalysis({ matchScore: score, fitSummary: parsedResult.fitSummary, strengths: parsedResult.strengths, gaps: parsedResult.gaps, interviewQuestions: parsedResult.interviewQuestions });
        setActiveTab('resume');
      } else {
         throw new Error("No valid analysis returned.");
      }
    } catch (err) { 
        console.error("API Call Failed, showing Mock Data:", err); 
        // --- FALLBACK MOCK DATA SET ---
        setAnalysis(MOCK_ANALYSIS_DATA);
        setActiveTab('resume');
        setError(err.message || "Failed to analyze. API Blocked (CORS/Key Issue). Showing Mock Data.");
    } finally { 
        setLoading(false); 
    }
  };

  const runAnalyze = () => {
    if (!jobDescription.trim() || !resume.trim()) { setError("Please fill in Job Description and Resume."); setActiveTab('jd'); return; }

    setLoading(true); setError(null); setAnalysis(null);
    const extractedName = extractCandidateName(resume);
    setCandidateName(extractedName);
    
    const isCanvasEnvironment = window.location.host.includes('usercontent.goog') || window.location.host.includes('blob:');

    // MOCK EXECUTION FOR DEMO WINDOW
    if (ENABLE_DEMO_MODE || isCanvasEnvironment) {
         console.log("Canvas detected, using mock.");
         setTimeout(() => {
             const mockScore = 88;
             const mockParsedResult = {
                matchScore: mockScore,
                fitSummary: "MOCK DATA: Strong candidate match based on keywords.",
                strengths: ["Relevant Experience", "Technical Skills"],
                gaps: ["Specific ERP knowledge"],
                interviewQuestions: ["Describe your experience with month-end close."]
            };
             setAnalysis({ 
                 matchScore: mockScore, 
                 fitSummary: mockParsedResult.fitSummary, 
                 strengths: mockParsedResult.strengths, 
                 gaps: mockParsedResult.gaps, 
                 interviewQuestions: mockParsedResult.interviewQuestions 
             });
             setActiveTab('resume');
             setLoading(false); 
         }, 1500); 
         return;
    }

    // REAL EXECUTION FOR LIVE SITE
    handleAnalyzeAsync(); 
  };
  
  const currentDraftContent = useMemo(() => {
    if (activeTool === 'invite') return inviteDraft;
    if (activeTool === 'outreach') return outreachDraft;
    return '';
  }, [activeTool, inviteDraft, outreachDraft]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-slate-900">
      <style>{`@media print { body > #root > div > main { max-width: none !important; margin: 0 !important; padding: 0 !important; } .print-area { width: 8.5in; height: 11in; padding: 0.5in; } .print\\:hidden { display: none !important; } } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }`}</style>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo /><h1 className="font-bold text-xl tracking-tight text-slate-800">Core Creativity<span className="text-[#2B81B9]">AI</span></h1></div>
          <div className="flex items-center gap-4">
              <div className="text-sm font-medium bg-[#52438E] text-white px-3 py-1 rounded-full shadow-sm hidden sm:block">Recruit-IQ / Candidate Match Analyzer</div>
          </div>
        </div>
      </header>
      
      {copyFeedback && <div className="fixed top-4 right-1/2 translate-x-1/2 mt-2 z-50 px-4 py-2 rounded-xl text-white font-medium shadow-lg bg-emerald-500">{copyFeedback}</div>}

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <AppSummary />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col h-[calc(100vh-270px)] min-h-[500px]">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-slate-200">
                {['jd', 'resume'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === tab ? 'text-[#52438E] bg-[#52438E]/5' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {tab === 'jd' ? <Briefcase size={16} /> : <FileText size={16} />} {tab === 'jd' ? 'Upload or Paste Job Description' : 'Upload or Paste Candidate Resume'}
                    {((tab === 'jd' && jobDescription) || (tab === 'resume' && resume)) && <Check size={14} className="text-emerald-500" />}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#52438E]" />}
                  </button>
                ))}
              </div>
              <div className="p-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center print:hidden">
                  <label className={`flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border-2 border-transparent text-[#2B81B9] text-xs font-semibold hover:border-[#00c9ff] transition-all shadow-md hover:shadow-lg`} style={{ background: 'linear-gradient(to right, #00c9ff, #2B81B9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', borderImage: 'linear-gradient(to right, #00c9ff, #2B81B9) 1' }}>
                      <Download size={14} className="text-[#00c9ff]" style={{ color: '#00c9ff' }} />
                      <span style={{ background: 'linear-gradient(to right, #00c9ff, #2B81B9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Upload File (.pdf, .docx, .txt)</span>
                      <input type="file" className="hidden" accept=".txt, .md, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileUpload(e, activeTab === 'jd' ? 'jd' : 'resume')} disabled={!libsLoaded} />
                  </label>
                  <div className="flex gap-2 items-center">
                      <button onClick={handleLoadExample} className="text-xs font-medium text-[#2B81B9] hover:text-[#00c9ff] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">Click for Example</button>
                      {(jobDescription || resume) && <button onClick={clearAll} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 hover:bg-slate-100 rounded-md transition-colors">Clear All</button>}
                  </div>
              </div>
              {candidateName && candidateName !== 'Unnamed Candidate' && activeTab === 'resume' && (
                  <div className="p-3 border-b border-slate-100 bg-white">
                      <div className="text-xs font-medium text-slate-600 mb-1">Candidate Name:</div>
                      <div className="text-sm font-bold text-[#52438E]">{candidateName}</div>
                  </div>
              )}
              <div className="flex-1 relative">
                <textarea className="w-full h-full p-5 resize-none outline-none text-slate-600 text-sm leading-relaxed placeholder:text-slate-300 bg-white" placeholder={activeTab === 'jd' ? "Paste the job description here..." : "Paste the candidate's resume here..."} value={activeTab === 'jd' ? jobDescription : resume} onChange={(e) => { activeTab === 'jd' ? setJobDescription(e.target.value) : setResume(e.target.value); }} autoFocus />
              </div>
              <div className="p-4 border-t border-slate-100 bg-white print:hidden">
                <button onClick={runAnalyze} disabled={loading || !jobDescription || !resume} className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${loading || !jobDescription || !resume ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#00c9ff] to-[#2B81B9] text-white hover:opacity-90 shadow-lg shadow-[#00c9ff]/40'}`}>
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Screening Candidate...</>) : (<><Sparkles size={18} />Screen Candidate</>)}
                </button>
                {error && <div className="mt-3 text-red-500 text-sm flex items-center justify-center gap-1"><AlertCircle size={14} /> {error}</div>}
              </div>
            </div>
          </div>
          <div className="flex flex-col h-[calc(100vh-270px)] min-h-[500px]">
              {!analysis ? (
                  <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Search size={32} className="text-slate-300" /></div>
                      <h3 className="text-lg font-medium text-slate-600 mb-2">Ready for Screening</h3>
                      <p className="max-w-xs text-sm">Paste or upload a Job Description and Candidate Resume on the left to begin the AI screening process.</p>
                  </div>
              ) : (
                  <div className="h-full flex flex-col overflow-hidden">
                      {/* NEW HEADER FOR OUTPUT */}
                      <div className="bg-white rounded-t-2xl px-6 py-3 border-b border-slate-200">
                          <h2 className="text-lg font-bold text-[#52438E] flex items-center gap-2">
                              Results and Additional Tools
                              <Sparkles size={18} className="text-[#00c9ff] ml-1" />
                          </h2>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 px-2">
                          <MatchScoreCard analysis={analysis} onCopySummary={() => handleCopy(analysis.summary)} />
                          <CommunicationTools 
                              activeTool={activeTool}
                              setActiveTool={setActiveTool}
                              draftContent={currentDraftContent}
                              handleDraft={handleDraft} 
                              handleCopy={handleCopy} 
                              setDrafts={setDrafts}
                              selectedTone={selectedTone}
                              setSelectedTone={setSelectedTone}
                              toolLoading={toolLoading}
                          />
                          <Leaderboard jdHash={currentJdHash} currentCandidateName={candidateName} score={analysis.matchScore} onClear={handleClearLeaderboard} leaderboardData={leaderboardData} />
                          {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 && <InterviewQuestionsSection questions={analysis.interviewQuestions} />}
                      </div>
                  </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
