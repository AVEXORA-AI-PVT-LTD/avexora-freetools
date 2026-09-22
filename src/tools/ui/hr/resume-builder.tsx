"use client";

import { useId, useState } from "react";
import { useToolGate } from "@/components/lead/email-gate";
import { OutputBlock } from "@/components/tools/tool-shapes/output-block";
import { inputCls, labelCls, primaryBtn, secondaryBtn } from "../ui-tokens";
import {
  buildResumeText,
  resumeFilename,
  validateResume,
  type ResumeEducation,
  type ResumeExperience,
} from "@/tools/compute/hr/resume";

const emptyExperience = (): ResumeExperience => ({ company: "", title: "", duration: "", highlights: "" });
const emptyEducation = (): ResumeEducation => ({ degree: "", institution: "", year: "" });

const removeBtn = "shrink-0 rounded px-2 py-1 text-sm text-slate-500 hover:text-red-600";
const addBtn = "text-sm font-medium text-orange-700 hover:text-orange-900";

export default function ResumeBuilder() {
  const requireEmail = useToolGate();
  const idPrefix = useId();

  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<ResumeExperience[]>([emptyExperience()]);
  const [education, setEducation] = useState<ResumeEducation[]>([emptyEducation()]);

  const [output, setOutput] = useState<{ text: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateExperience = (index: number, patch: Partial<ResumeExperience>) =>
    setExperiences((prev) => prev.map((exp, i) => (i === index ? { ...exp, ...patch } : exp)));
  const updateEducation = (index: number, patch: Partial<ResumeEducation>) =>
    setEducation((prev) => prev.map((edu, i) => (i === index ? { ...edu, ...patch } : edu)));

  const reset = () => {
    setFullName("");
    setTargetRole("");
    setEmail("");
    setPhone("");
    setLocation("");
    setLinkedin("");
    setSummary("");
    setSkills("");
    setExperiences([emptyExperience()]);
    setEducation([emptyEducation()]);
    setOutput(null);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { fullName, targetRole, email, phone, location, linkedin, summary, skills, experiences, education };
    const validationError = validateResume(input);
    if (validationError) {
      setError(validationError);
      setOutput(null);
      return;
    }
    setError(null);
    setOutput({ text: buildResumeText(input), filename: resumeFilename(fullName) });
  };

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-name`}>Full name</label>
          <input id={`${idPrefix}-name`} className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Sharma" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-role`}>Target job title</label>
          <input id={`${idPrefix}-role`} className={inputCls} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Product Manager" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-email`}>Email</label>
          <input id={`${idPrefix}-email`} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya.sharma@email.com" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-phone`}>Phone</label>
          <input id={`${idPrefix}-phone`} className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-location`}>City</label>
          <input id={`${idPrefix}-location`} className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru" />
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idPrefix}-linkedin`}>LinkedIn / portfolio URL</label>
          <input id={`${idPrefix}-linkedin`} className={inputCls} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/priyasharma" />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-summary`}>Professional summary (2-3 sentences)</label>
        <textarea id={`${idPrefix}-summary`} rows={3} className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Product manager with 5 years building B2B SaaS features from discovery to launch." />
      </div>

      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-skills`}>Skills (comma-separated)</label>
        <textarea id={`${idPrefix}-skills`} rows={2} className={inputCls} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Product strategy, SQL, Figma, A/B testing, Agile" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Work experience</h3>
          <button type="button" className={addBtn} onClick={() => setExperiences((prev) => [...prev, emptyExperience()])}>
            + Add experience
          </button>
        </div>
        {experiences.map((exp, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {i === 0 ? "Most recent role" : `Role ${i + 1}`}
              </span>
              {experiences.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove role ${i + 1}`}
                  className={removeBtn}
                  onClick={() => setExperiences((prev) => prev.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor={`${idPrefix}-exp-${i}-company`}>Employer</label>
                <input id={`${idPrefix}-exp-${i}-company`} className={inputCls} value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} placeholder="Avexora Technologies" />
              </div>
              <div>
                <label className={labelCls} htmlFor={`${idPrefix}-exp-${i}-title`}>Job title</label>
                <input id={`${idPrefix}-exp-${i}-title`} className={inputCls} value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} placeholder="Senior Product Manager" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor={`${idPrefix}-exp-${i}-duration`}>Duration</label>
                <input id={`${idPrefix}-exp-${i}-duration`} className={inputCls} value={exp.duration} onChange={(e) => updateExperience(i, { duration: e.target.value })} placeholder="Jan 2022 – Present" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor={`${idPrefix}-exp-${i}-highlights`}>Key achievements (one per line)</label>
                <textarea id={`${idPrefix}-exp-${i}-highlights`} rows={3} className={inputCls} value={exp.highlights} onChange={(e) => updateExperience(i, { highlights: e.target.value })} placeholder="Launched a feature that grew activation by 18%" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Education</h3>
          <button type="button" className={addBtn} onClick={() => setEducation((prev) => [...prev, emptyEducation()])}>
            + Add education
          </button>
        </div>
        {education.map((edu, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {i === 0 ? "Most recent" : `Education ${i + 1}`}
              </span>
              {education.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove education ${i + 1}`}
                  className={removeBtn}
                  onClick={() => setEducation((prev) => prev.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls} htmlFor={`${idPrefix}-edu-${i}-degree`}>Degree</label>
                <input id={`${idPrefix}-edu-${i}-degree`} className={inputCls} value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} placeholder="B.Tech, Computer Science" />
              </div>
              <div>
                <label className={labelCls} htmlFor={`${idPrefix}-edu-${i}-institution`}>Institution</label>
                <input id={`${idPrefix}-edu-${i}-institution`} className={inputCls} value={edu.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} placeholder="IIT Bombay" />
              </div>
              <div>
                <label className={labelCls} htmlFor={`${idPrefix}-edu-${i}-year`}>Year of graduation</label>
                <input id={`${idPrefix}-edu-${i}-year`} className={inputCls} value={edu.year} onChange={(e) => updateEducation(i, { year: e.target.value })} placeholder="2019" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={primaryBtn}>Generate resume</button>
        <button type="button" onClick={reset} className={secondaryBtn}>Clear</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {output && (
        <OutputBlock text={output.text} filename={output.filename} gated onGatedAction={requireEmail} />
      )}
    </form>
  );
}
