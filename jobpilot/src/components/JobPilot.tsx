"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowDownToLine, ArrowRight, BriefcaseBusiness, Check, ChevronDown, CircleHelp,
  FileText, LayoutDashboard, Plus, Search, Send, Sparkles, Target, Trash2,
  TrendingUp, WandSparkles, X
} from "lucide-react";
import { emptyResume, type Job, type JobStatus, type Resume } from "@/lib/types";

type Tab = "overview" | "resume" | "applications" | "coverletter" | "interview";
const statuses: JobStatus[] = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
const sampleJobs: Job[] = [
  { id: "demo-1", role: "Junior Frontend Developer", company: "Northstar Studio", location: "Amsterdam / Hybrid", url: "https://example.com/jobs/frontend", salary: "€38k–€46k", deadline: "", status: "Applied", notes: "Applied via company website. Follow up next week.", createdAt: new Date().toISOString() },
  { id: "demo-2", role: "Product Design Intern", company: "Brightside", location: "Remote", url: "", salary: "€800/month", deadline: "", status: "Interview", notes: "Prepare portfolio walkthrough and collaboration example.", createdAt: new Date(Date.now()-86400000).toISOString() },
  { id: "demo-3", role: "Web Developer", company: "Canal Digital", location: "Utrecht", url: "", salary: "Open", deadline: "", status: "Saved", notes: "", createdAt: new Date(Date.now()-172800000).toISOString() }
];
const questions = [
  "Tell me about yourself and what brings you to this role.",
  "Tell me about a time you solved a difficult problem.",
  "What is a skill you are actively working to improve?",
  "Describe a time you received feedback and acted on it.",
  "Why do you want to work at this company?",
  "Tell me about a project you are proud of."
];
const nav: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "resume", label: "Resume builder", icon: FileText },
  { id: "applications", label: "Applications", icon: BriefcaseBusiness },
  { id: "coverletter", label: "AI application studio", icon: Sparkles },
  { id: "interview", label: "Interview practice", icon: CircleHelp }
];
const initialResume: Resume = { ...emptyResume, fullName: "Alex Morgan", email: "alex.morgan@example.com", phone: "+31 6 1234 5678", location: "Amsterdam, Netherlands", headline: "Junior Frontend Developer", summary: "Curious and detail-oriented developer who enjoys turning complex problems into clear, accessible digital experiences. Looking for a collaborative team where I can keep learning and contribute to real products.", skills: "JavaScript, React, HTML, CSS, Git, Responsive Design", experience: "Frontend Project Builder | Personal projects | 2024–Present\nBuilt responsive interfaces and interactive prototypes using React and modern CSS.\nCollaborated with peers to review usability and improve accessibility.", education: "BSc Computer Science | Example University | 2021–2025" };

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function lines(text: string) { return text.split("\n").map(x => x.trim()).filter(Boolean); }

export default function JobPilot() {
  const [tab, setTab] = useState<Tab>("overview");
  const [resume, setResume] = useState<Resume>(initialResume);
  const [jobs, setJobs] = useState<Job[]>(sampleJobs);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddJob, setShowAddJob] = useState(false);
  const [newJob, setNewJob] = useState({ role: "", company: "", location: "", url: "", salary: "", deadline: "", status: "Saved" as JobStatus, notes: "" });
  const [jobDescription, setJobDescription] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [showResumeSaved, setShowResumeSaved] = useState(false);

  useEffect(() => {
    setResume(readStored("jobpilot-resume-v1", initialResume));
    setJobs(readStored("jobpilot-jobs-v1", sampleJobs));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("jobpilot-resume-v1", JSON.stringify(resume)); }, [resume, ready]);
  useEffect(() => { if (ready) localStorage.setItem("jobpilot-jobs-v1", JSON.stringify(jobs)); }, [jobs, ready]);

  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter(j => ["Applied", "Interview"].includes(j.status)).length,
    interviews: jobs.filter(j => j.status === "Interview").length,
    offers: jobs.filter(j => j.status === "Offer").length
  }), [jobs]);
  const filteredJobs = useMemo(() => jobs.filter(j => {
    const matches = `${j.role} ${j.company} ${j.location} ${j.notes}`.toLowerCase().includes(query.toLowerCase());
    return matches && (statusFilter === "All" || j.status === statusFilter);
  }), [jobs, query, statusFilter]);

  function updateResume(key: keyof Resume, value: string) { setResume(prev => ({ ...prev, [key]: value })); setShowResumeSaved(false); }
  function addJob(e: FormEvent) {
    e.preventDefault();
    if (!newJob.role.trim() || !newJob.company.trim()) return;
    setJobs(prev => [{ ...newJob, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev]);
    setNewJob({ role: "", company: "", location: "", url: "", salary: "", deadline: "", status: "Saved", notes: "" });
    setShowAddJob(false);
  }
  function updateJob(id: string, patch: Partial<Job>) { setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j)); }
  function deleteJob(id: string) { setJobs(prev => prev.filter(j => j.id !== id)); }
  async function runAI(task: "cover-letter" | "resume-feedback" | "interview-feedback") {
    setAiLoading(true); setAiError(""); setAiResult(""); setInterviewFeedback("");
    const resumeText = `${resume.fullName}\n${resume.headline}\n${resume.summary}\nSkills: ${resume.skills}\nExperience:\n${resume.experience}\nEducation:\n${resume.education}`;
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        task, resume: resumeText, jobDescription, prompt: task === "interview-feedback" ? questions[questionIndex] : extraNotes, answer
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      if (task === "interview-feedback") setInterviewFeedback(data.result); else setAiResult(data.result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      if (task === "interview-feedback") setInterviewFeedback(`Could not get AI feedback: ${message}`); else setAiError(message);
    } finally { setAiLoading(false); }
  }
  function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }
  function exportJobs() {
    const csv = [["Role","Company","Location","Status","Salary","Deadline","Job URL","Notes"], ...jobs.map(j => [j.role,j.company,j.location,j.status,j.salary,j.deadline,j.url,j.notes])]
      .map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    downloadText("jobpilot-applications.csv", csv);
  }
  function printResume() { window.print(); }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Target size={21}/></div><span>jobpilot</span><span className="brand-dot">.</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">{nav.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`nav-item ${tab === item.id ? "selected" : ""}`}><item.icon size={18}/><span>{item.label}</span>{item.id === "applications" && <span className="nav-count">{jobs.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-icon"><Sparkles size={17}/></div><div><strong>Small steps, big moves.</strong><p>Your next opportunity starts here.</p></div></div>
      <div className="sidebar-user"><div className="user-avatar">{(resume.fullName || "A").slice(0,1).toUpperCase()}</div><div><strong>{resume.fullName || "Your profile"}</strong><small>Personal workspace</small></div><ChevronDown size={15}/></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{nav.find(n => n.id === tab)?.label}</strong></div><div className="top-actions"><span className="local-badge"><span/> Saved in this browser</span><button className="icon-button" title="Help" onClick={() => alert("Your resume and applications save automatically in this browser. Configure OpenAI to enable AI tools.")}><CircleHelp size={18}/></button><div className="mini-avatar">{(resume.fullName || "A").slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-content">
        {tab === "overview" && <Overview resume={resume} jobs={jobs} stats={stats} setTab={setTab} add={() => setShowAddJob(true)} />}
        {tab === "resume" && <section>
          <PageHeading eyebrow="YOUR STORY, WELL TOLD" title="Resume builder" subtitle="Build a clear, professional resume that makes your strengths easy to see." right={<button className="button primary" onClick={printResume}><ArrowDownToLine size={16}/> Print / save PDF</button>}/>
          <div className="resume-layout"><div className="panel form-panel">
            <div className="panel-title"><div><h3>Personal details</h3><p>Keep your contact details current.</p></div><span className="step-tag">01</span></div>
            <div className="form-grid two">{field("Full name",resume.fullName,v=>updateResume("fullName",v),"e.g. Alex Morgan")}{field("Professional headline",resume.headline,v=>updateResume("headline",v),"e.g. Marketing graduate")}{field("Email",resume.email,v=>updateResume("email",v),"you@example.com","email")}{field("Phone",resume.phone,v=>updateResume("phone",v),"+31 6 1234 5678")}{field("Location",resume.location,v=>updateResume("location",v),"City, country")}</div>
            <div className="panel-title spaced"><div><h3>Profile summary</h3><p>A short introduction focused on what you bring.</p></div><span className="step-tag">02</span></div>
            <textarea className="textarea" rows={4} value={resume.summary} onChange={e=>updateResume("summary",e.target.value)} placeholder="Write 2–4 sentences about your strengths and goals."/>
            <div className="panel-title spaced"><div><h3>Skills</h3><p>Separate each skill with a comma.</p></div><span className="step-tag">03</span></div>
            <textarea className="textarea" rows={3} value={resume.skills} onChange={e=>updateResume("skills",e.target.value)} placeholder="Communication, Excel, JavaScript…"/>
            <div className="panel-title spaced"><div><h3>Experience</h3><p>Use a new line for each role or achievement.</p></div><span className="step-tag">04</span></div>
            <textarea className="textarea" rows={6} value={resume.experience} onChange={e=>updateResume("experience",e.target.value)} placeholder={"Role | Company | Dates\nWhat you did and the impact you made."}/>
            <div className="panel-title spaced"><div><h3>Education</h3><p>Degrees, courses, certificates, or relevant training.</p></div><span className="step-tag">05</span></div>
            <textarea className="textarea" rows={3} value={resume.education} onChange={e=>updateResume("education",e.target.value)} placeholder="Qualification | Institution | Year"/>
            <div className="form-footer"><span className="autosave"><Check size={15}/> Auto-saved in this browser</span><button className="button primary" onClick={() => { setShowResumeSaved(true); printResume(); }}>Finish resume <ArrowRight size={16}/></button></div>
            {showResumeSaved && <p className="success-note">Your resume is saved locally. In the print window, choose “Save as PDF”.</p>}
          </div><ResumePreview resume={resume}/></div>
        </section>}
        {tab === "applications" && <section>
          <PageHeading eyebrow="KEEP EVERY OPPORTUNITY MOVING" title="Application tracker" subtitle="One place for every role, deadline, follow-up, and next step." right={<><button className="button secondary" onClick={exportJobs}><ArrowDownToLine size={16}/> Export CSV</button><button className="button primary" onClick={() => setShowAddJob(true)}><Plus size={16}/> Add application</button></>}/>
          <div className="stats-grid compact"><Metric label="Total tracked" value={stats.total} icon={<BriefcaseBusiness/>}/><Metric label="Active applications" value={stats.active} icon={<TrendingUp/>}/><Metric label="Interviews" value={stats.interviews} icon={<Sparkles/>}/><Metric label="Offers" value={stats.offers} icon={<Check/>}/></div>
          <div className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search roles or companies"/></div><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="select-control"><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="job-list">{filteredJobs.map(job => <article className="job-row" key={job.id}><div className="company-logo">{job.company.slice(0,1).toUpperCase()}</div><div className="job-main"><strong>{job.role}</strong><span>{job.company} · {job.location || "Location not set"}</span>{job.deadline && <small>Deadline: {job.deadline}</small>}<textarea className="notes-input" value={job.notes} onChange={e=>updateJob(job.id,{notes:e.target.value})} placeholder="Add a follow-up note…"/></div><div className="job-controls"><select className={`status-select status-${job.status.toLowerCase()}`} value={job.status} onChange={e=>updateJob(job.id,{status:e.target.value as JobStatus})}>{statuses.map(s=><option key={s}>{s}</option>)}</select>{job.url && <a className="job-link" href={job.url} target="_blank" rel="noreferrer">Open listing <ArrowRight size={13}/></a>}<button className="delete-button" onClick={()=>deleteJob(job.id)} title="Delete application"><Trash2 size={15}/></button></div></article>)}
            {!filteredJobs.length && <div className="empty-state"><BriefcaseBusiness size={28}/><strong>No applications found</strong><p>Add a job or change your search filters.</p><button className="button primary" onClick={() => setShowAddJob(true)}><Plus size={16}/> Add a job</button></div>}</div>
          </div>
        </section>}
        {tab === "coverletter" && <section>
          <PageHeading eyebrow="MAKE EVERY APPLICATION COUNT" title="AI application studio" subtitle="Use the role description and your real experience to create a more targeted application."/>
          <div className="ai-grid"><div className="panel ai-input-panel"><div className="panel-title"><div><h3><WandSparkles size={18}/> Application details</h3><p>More context helps produce a more relevant draft.</p></div></div>
            <label className="input-label">Job description<textarea className="textarea" rows={8} value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description here…"/></label>
            <label className="input-label">Additional notes (optional)<textarea className="textarea" rows={3} value={extraNotes} onChange={e=>setExtraNotes(e.target.value)} placeholder="Why are you interested? Which relevant project should it highlight?"/></label>
            <div className="resume-context"><FileText size={18}/><div><strong>Using your resume</strong><span>{resume.fullName || "Your profile"} · {resume.headline || "Add a headline in Resume Builder"}</span></div><button className="text-button" onClick={()=>setTab("resume")}>Edit</button></div>
            <button className="button primary full-button" disabled={aiLoading || !jobDescription.trim()} onClick={()=>runAI("cover-letter")}>{aiLoading ? <span className="spinner"/> : <Sparkles size={16}/>} Generate cover letter</button>
            <button className="button secondary full-button" disabled={aiLoading || !jobDescription.trim()} onClick={()=>runAI("resume-feedback")}>{aiLoading ? <span className="spinner"/> : <Target size={16}/>} Review resume against role</button>
            <p className="privacy-note">AI features require a server-side OpenAI API key. Review all generated content before using it.</p>
          </div><div className="panel output-panel"><div className="output-header"><div><span className="eyebrow">YOUR DRAFT</span><h3>Application output</h3></div>{aiResult && <button className="button secondary small" onClick={()=>downloadText("jobpilot-application-draft.txt",aiResult)}><ArrowDownToLine size={15}/> Download</button>}</div>
            {aiError && <div className="error-box">{aiError}</div>}
            {aiResult ? <div className="ai-result">{aiResult.split("\n").map((line,i)=><p key={i}>{line || "\u00a0"}</p>)}</div> : <div className="output-empty"><div className="output-illustration"><Sparkles size={26}/></div><h4>Your next draft starts here</h4><p>Paste a job description, then generate a tailored cover letter or get specific feedback on your resume.</p><div className="output-tips"><span><Check size={14}/> Based on your experience</span><span><Check size={14}/> Tailored to the role</span><span><Check size={14}/> Editable and downloadable</span></div></div>}
          </div></div>
        </section>}
        {tab === "interview" && <section>
          <PageHeading eyebrow="PRACTICE MAKES CONFIDENCE" title="Interview practice" subtitle="Work through realistic questions, structure your answer, and improve one round at a time."/>
          <div className="interview-layout"><div className="panel question-panel"><div className="question-meta"><span className="eyebrow">QUESTION {questionIndex+1} OF {questions.length}</span><span className="difficulty">Common interview question</span></div><div className="progress-track"><div style={{width:`${(questionIndex+1)/questions.length*100}%`}}/></div><h2>{questions[questionIndex]}</h2><p className="question-hint">Tip: use a specific example. For experience-based questions, try the STAR structure: Situation, Task, Action, Result.</p><label className="input-label">Your answer<textarea className="textarea answer-area" rows={9} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Write the answer as if you were speaking to an interviewer…"/></label><div className="question-actions"><button className="button secondary" onClick={()=>{setQuestionIndex((questionIndex+questions.length-1)%questions.length);setAnswer("");setInterviewFeedback("");}}>Previous</button><button className="button secondary" onClick={()=>{setQuestionIndex((questionIndex+1)%questions.length);setAnswer("");setInterviewFeedback("");}}>Next question <ArrowRight size={15}/></button></div><button className="button primary full-button" disabled={!answer.trim()||aiLoading} onClick={()=>runAI("interview-feedback")}>{aiLoading?<span className="spinner"/>:<Sparkles size={16}/>} Get feedback on my answer</button></div>
            <div className="panel feedback-panel"><div className="panel-title"><div><h3><Sparkles size={18}/> Coach feedback</h3><p>Actionable notes to strengthen your response.</p></div></div>{interviewFeedback?<div className="ai-result">{interviewFeedback.split("\n").map((line,i)=><p key={i}>{line||"\u00a0"}</p>)}</div>:<div className="feedback-empty"><div className="feedback-icon"><TrendingUp size={22}/></div><h4>Your practice review</h4><p>Write your answer and select “Get feedback” to receive guidance on clarity, relevance, structure, and how to make your example stronger.</p><div className="rubric"><span>01 <b>Structure</b></span><span>02 <b>Specific evidence</b></span><span>03 <b>Clear impact</b></span></div></div>}</div></div>
        </section>}
      </div>
    </main>
    {showAddJob && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAddJob(false)}}><form className="modal" onSubmit={addJob}><div className="modal-heading"><div><span className="eyebrow">NEW OPPORTUNITY</span><h2>Add an application</h2><p>Save the role now; update its status as you go.</p></div><button type="button" className="icon-button" onClick={()=>setShowAddJob(false)}><X size={19}/></button></div><div className="form-grid two">{field("Job title",newJob.role,v=>setNewJob(p=>({...p,role:v})),"e.g. Junior Developer", "text", true)}{field("Company",newJob.company,v=>setNewJob(p=>({...p,company:v})),"e.g. Acme Studio","text",true)}{field("Location",newJob.location,v=>setNewJob(p=>({...p,location:v})),"Remote / City")}{field("Salary",newJob.salary,v=>setNewJob(p=>({...p,salary:v})),"Optional")}{field("Job listing URL",newJob.url,v=>setNewJob(p=>({...p,url:v})),"https://…","url")}{field("Deadline",newJob.deadline,v=>setNewJob(p=>({...p,deadline:v})),"","date")}</div><label className="input-label">Status<select className="select-control modal-select" value={newJob.status} onChange={e=>setNewJob(p=>({...p,status:e.target.value as JobStatus}))}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label className="input-label">Notes<textarea className="textarea" rows={3} value={newJob.notes} onChange={e=>setNewJob(p=>({...p,notes:e.target.value}))} placeholder="Contact, next step, or interview prep…"/></label><div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setShowAddJob(false)}>Cancel</button><button type="submit" className="button primary"><Plus size={16}/> Save application</button></div></form></div>}
  </div>;
}

function field(label: string, value: string, onChange: (value: string)=>void, placeholder="", type="text", required=false) {
  return <label className="input-label">{label}<input className="text-input" type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}/></label>;
}
function PageHeading({eyebrow,title,subtitle,right}:{eyebrow:string;title:string;subtitle:string;right?:ReactNode}) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{right&&<div className="heading-actions">{right}</div>}</div>;
}
function Metric({label,value,icon}:{label:string;value:number;icon:ReactNode}) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><strong>{value}</strong><small>Across your workspace</small></div>;
}
function Overview({resume,jobs,stats,setTab,add}:{resume:Resume;jobs:Job[];stats:{total:number;active:number;interviews:number;offers:number};setTab:(tab:Tab)=>void;add:()=>void}) {
  const completed = [!!resume.fullName,!!resume.headline,!!resume.summary,!!resume.skills,!!resume.experience,!!resume.education].filter(Boolean).length;
  const recent = [...jobs].slice(0,4);
  return <section><div className="welcome-row"><div><span className="eyebrow"><span className="eyebrow-dot"/> YOUR CAREER HQ</span><h1>Good things take <span>momentum.</span></h1><p>One focused step today can bring your next opportunity closer.</p></div><button className="button primary" onClick={add}><Plus size={16}/> Add a job</button></div>
    <div className="hero-banner"><div className="banner-copy"><span className="banner-label">YOUR NEXT CHAPTER</span><h2>Make your next move<br/>your best one.</h2><p>Build your story. Find the right fit. Show up ready.</p><button className="button white-button" onClick={()=>setTab("resume")}>Work on your resume <ArrowRight size={16}/></button></div><div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-card"><div className="art-check"><Check size={17}/></div><div><b>Application ready</b><small>You're making progress</small></div><TrendingUp size={23}/></div><div className="art-float"><Sparkles size={18}/><span>Keep going!</span></div></div></div>
    <div className="stats-grid"><Metric label="Applications tracked" value={stats.total} icon={<BriefcaseBusiness/>}/><Metric label="In progress" value={stats.active} icon={<TrendingUp/>}/><Metric label="Interviews" value={stats.interviews} icon={<Sparkles/>}/><Metric label="Offers" value={stats.offers} icon={<Check/>}/></div>
    <div className="overview-grid"><div className="panel recent-panel"><div className="panel-heading"><div><h3>Recent applications</h3><p>Your opportunities at a glance.</p></div><button className="text-button" onClick={()=>setTab("applications")}>View tracker <ArrowRight size={14}/></button></div>{recent.length?recent.map(j=><div className="recent-job" key={j.id}><div className="company-logo">{j.company.slice(0,1).toUpperCase()}</div><div className="recent-job-info"><b>{j.role}</b><span>{j.company}</span></div><StatusBadge status={j.status}/></div>):<p className="muted">No applications yet. Add your first opportunity.</p>}<button className="button secondary full-button" onClick={add}><Plus size={15}/> Add an application</button></div>
      <div className="panel progress-panel"><div className="panel-heading"><div><h3>Resume readiness</h3><p>Build a strong foundation.</p></div><div className="readiness-icon"><FileText size={19}/></div></div><div className="readiness-number">{Math.round(completed/6*100)}<small>%</small></div><div className="progress-track"><div style={{width:`${completed/6*100}%`}}/></div><p className="muted">{completed} of 6 key sections completed</p><div className="checklist">{[{label:"Personal details",done:!!resume.fullName&&!!resume.email},{label:"Professional headline",done:!!resume.headline},{label:"Profile summary",done:!!resume.summary},{label:"Skills & experience",done:!!resume.skills&&!!resume.experience},{label:"Education",done:!!resume.education}].map(item=><div key={item.label}><span className={item.done?"check-circle done":"check-circle"}>{item.done?<Check size={12}/>:null}</span>{item.label}</div>)}</div><button className="button primary full-button" onClick={()=>setTab("resume")}>Improve my resume <ArrowRight size={15}/></button></div></div>
    <div className="quick-actions"><div><span className="quick-icon purple"><Sparkles size={19}/></span><div><b>Tailor an application</b><p>Create a cover letter for a specific role.</p></div><button onClick={()=>setTab("coverletter")} aria-label="Open application studio"><ArrowRight size={18}/></button></div><div><span className="quick-icon peach"><CircleHelp size={19}/></span><div><b>Practice an interview</b><p>Build confidence with guided questions.</p></div><button onClick={()=>setTab("interview")} aria-label="Open interview practice"><ArrowRight size={18}/></button></div></div>
  </section>;
}
function StatusBadge({status}:{status:JobStatus}) { return <span className={`status-badge status-${status.toLowerCase()}`}><span/>{status}</span>; }
function ResumePreview({resume}:{resume:Resume}) {
  return <aside className="resume-preview-wrap"><div className="preview-toolbar"><span><span className="preview-dot"/> Live preview</span><span>A4 · Preview</span></div><article className="resume-paper"><div className="resume-accent"/><h2>{resume.fullName||"Your Name"}</h2><h3>{resume.headline||"Professional headline"}</h3><div className="resume-contact">{[resume.email,resume.phone,resume.location].filter(Boolean).join("  •  ")||"Email • Phone • Location"}</div><ResumeSection title="Profile" text={resume.summary}/><ResumeSection title="Skills" text={resume.skills}/><ResumeSection title="Experience" text={resume.experience}/><ResumeSection title="Education" text={resume.education}/><div className="paper-footer">Prepared with JobPilot</div></article><p className="preview-tip"><Sparkles size={14}/> Your preview updates as you type. Use Print / save PDF when you're ready.</p></aside>;
}
function ResumeSection({title,text}:{title:string;text:string}) {
  return <section className="resume-section"><h4>{title}</h4>{text?lines(text).map((line,i)=><p key={i}>{line}</p>):<p className="resume-placeholder">Your {title.toLowerCase()} will appear here.</p>}</section>;
}
