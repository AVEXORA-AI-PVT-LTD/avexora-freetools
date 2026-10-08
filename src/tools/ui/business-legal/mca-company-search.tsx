"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  decodeCin,
  decodeLlpin,
  validateDinNumber,
  analyzeCompanyName,
  type DecodedCinResult,
  type DecodedLlpinResult,
  type NameAnalysisResult,
} from "../../compute/legal/mca-company-search";
import {
  Building2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileCheck,
  UserCheck,
  ArrowRight,
  Info,
  Scale,
  Copy,
  Check,
  Building,
  Briefcase,
  MapPin,
  Clock,
  Coins,
  Loader2,
} from "lucide-react";

interface DisplayCompany {
  name: string;
  cin: string;
  status: string;
  state?: string;
  roc?: string;
  year?: string | number;
  companyAge?: number;
  class?: string;
  listingStatus?: string;
  industry?: string;
  address?: string;
  paidUpCapital?: string;
  authorizedCapital?: string;
  complianceDueDates?: { form: string; purpose: string; deadline: string }[];
  statutoryNotice?: string;
  mcaMasterDataUrl?: string;
  source?: string;
}

export default function McaCompanySearch() {
  const [activeTab, setActiveTab] = useState<"name" | "number" | "din">("name");

  // Name Search State (Option 1) - Empty by default
  const [nameInput, setNameInput] = useState("");
  const [submittedNameQuery, setSubmittedNameQuery] = useState("");
  const [companyResult, setCompanyResult] = useState<DisplayCompany | null>(null);
  const [entityType, setEntityType] = useState<"pvt-ltd" | "public-ltd" | "opc" | "llp">("pvt-ltd");
  const [unregisteredAnalysis, setUnregisteredAnalysis] = useState<NameAnalysisResult | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");

  // Live Autocomplete / Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // CIN / LLPIN Number Search State (Option 2) - Empty by default
  const [numberInput, setNumberInput] = useState("");
  const [cinResult, setCinResult] = useState<DecodedCinResult | null>(null);
  const [llpinResult, setLlpinResult] = useState<DecodedLlpinResult | null>(null);
  const [numberStatus, setNumberStatus] = useState<"idle" | "loading" | "found" | "error">("idle");

  // DIN State
  const [dinInput, setDinInput] = useState("");
  const [dinResult, setDinResult] = useState<{
    din: string;
    isValid: boolean;
    message?: string;
    explanation?: string;
  } | null>(null);

  // Copied state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live suggestions via Google Suggest & Web
  useEffect(() => {
    const query = nameInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mca/search?q=${encodeURIComponent(query)}&suggest=true`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
            setShowDropdown(false);
          }
        }
      } catch (err) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [nameInput]);

  // Option 1: Handle Name Search Submit
  const handleNameSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const query = (overrideQuery ?? nameInput).trim();
    if (!query) return;

    setShowDropdown(false);
    setSubmittedNameQuery(query);
    setSearchStatus("loading");
    setCompanyResult(null);
    setUnregisteredAnalysis(null);

    try {
      const res = await fetch(`/api/mca/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();

        if (data.type === "company" && data.company) {
          setCompanyResult(data.company);
          setSearchStatus("found");
          return;
        }

        if (data.type === "company_overview" && data.company) {
          setCompanyResult(data.company);
          setSearchStatus("found");
          return;
        }

        if (data.type === "unregistered") {
          setSearchStatus("not_found");
          setUnregisteredAnalysis(data.analysis || analyzeCompanyName(query, entityType));
          return;
        }
      }

      // Fallback if API returned non-ok
      setSearchStatus("not_found");
      setUnregisteredAnalysis(analyzeCompanyName(query, entityType));
    } catch (err) {
      console.error("Live MCA search error", err);
      setSearchStatus("not_found");
      setUnregisteredAnalysis(analyzeCompanyName(query, entityType));
    }
  };

  const handleSelectSuggestion = (sug: string) => {
    setNameInput(sug);
    setShowDropdown(false);
    handleNameSearch(undefined, sug);
  };

  const loadExampleName = (example: string) => {
    setNameInput(example);
    setShowDropdown(false);
    handleNameSearch(undefined, example);
  };

  // Option 2: Handle Number Search Submit
  const handleNumberSubmit = async (e?: React.FormEvent, overrideNum?: string) => {
    if (e) e.preventDefault();
    const clean = (overrideNum ?? numberInput).trim().toUpperCase();
    if (!clean) return;

    if (clean.replace("-", "").length === 7) {
      setLlpinResult(decodeLlpin(clean));
      setCinResult(null);
      setNumberStatus("found");
      return;
    }

    // Decode CIN format
    const initialDecoded = decodeCin(clean);
    setCinResult(initialDecoded);
    setLlpinResult(null);

    if (!initialDecoded.isValid) {
      setNumberStatus("error");
      return;
    }

    setNumberStatus("loading");

    // Dynamically fetch actual company legal name and address for this CIN
    try {
      const res = await fetch(`/api/mca/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === "cin" && data.company) {
          setCinResult((prev) =>
            prev
              ? {
                  ...prev,
                  companyName: data.company.name,
                  companyStatus: data.company.status || "Active",
                  registeredAddress: data.company.address || prev.registeredAddress,
                }
              : null
          );
        }
      }
      setNumberStatus("found");
    } catch (err) {
      setNumberStatus("found");
    }
  };

  const loadExampleNumber = (example: string) => {
    setNumberInput(example);
    handleNumberSubmit(undefined, example);
  };

  // Handle DIN Submit
  const handleDinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dinInput.trim()) return;
    setDinResult(validateDinNumber(dinInput));
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 font-sans">
      {/* Primary 2-Option Selector Navigation */}
      <div className="flex border-b border-stone-200 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("name")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "name"
              ? "border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-lg"
              : "border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Option 1: Search by Company Name</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("number")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "number"
              ? "border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-lg"
              : "border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Option 2: Search by Number (CIN / LLPIN)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("din")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "din"
              ? "border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-lg"
              : "border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Director DIN Validator</span>
        </button>
      </div>

      {/* ========================================================
          OPTION 1: SEARCH BY COMPANY NAME (DYNAMIC LIVE WEB LOOKUP)
          ======================================================== */}
      {activeTab === "name" && (
        <div className="space-y-6">
          {/* Search Box Card */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              <span>Search Indian Companies by Name</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-4">
              Enter any Indian company name (small or large, startup or enterprise). Live search fetches official registered details, 21-digit CIN, RoC jurisdiction, incorporation year, and compliance schedule dynamically.
            </p>

            <form onSubmit={(e) => handleNameSearch(e)} className="space-y-3 relative">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1" ref={dropdownRef}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Enter company name (e.g. Reliance, Tata Motors, Infosys, Zomato...)"
                    className="w-full px-4 py-3 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />

                  {/* Autocomplete Suggestions Dropdown */}
                  {showDropdown && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-stone-100">
                      <div className="p-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50 flex items-center justify-between">
                        <span>Live Suggestions</span>
                        <Search className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      {suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(sug)}
                          className="w-full text-left p-3 hover:bg-orange-50/60 transition flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <span className="font-semibold text-stone-900 text-sm group-hover:text-orange-600 transition truncate">
                            {sug}
                          </span>
                          <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={searchStatus === "loading"}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-70"
                >
                  {searchStatus === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search Company</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample Quick Queries */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500">
                <span className="font-medium text-stone-400">Quick Searches:</span>
                {[
                  "Reliance Industries Limited",
                  "Tata Consultancy Services",
                  "Infosys Limited",
                  "Zomato Limited",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => loadExampleName(item)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] rounded-md transition cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Loading Indicator */}
          {searchStatus === "loading" && (
            <div className="p-8 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-stone-600">
              <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
              <span className="text-sm font-medium">
                Searching official MCA, RoC & corporate registry records for &quot;{submittedNameQuery}&quot;...
              </span>
            </div>
          )}

          {/* Result Card: Found Company */}
          {searchStatus === "found" && companyResult && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-sm border border-stone-700">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-700/80 pb-4 mb-5">
                  <div>
                    <span className="text-[11px] font-mono tracking-wider text-orange-400 uppercase font-semibold">
                      Official Legal Registered Entity
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                      {companyResult.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {companyResult.status || "Active on MCA"}
                    </span>
                    {companyResult.listingStatus && (
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold rounded-full">
                        {companyResult.listingStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* CIN Display with Copy button */}
                <div className="p-4 bg-stone-800/80 rounded-xl border border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <span className="text-xs text-stone-400 font-mono block">Corporate Identity Number (CIN)</span>
                    <span className="text-lg font-mono font-bold text-white tracking-wide">
                      {companyResult.cin}
                    </span>
                  </div>
                  {companyResult.cin && companyResult.cin.length === 21 && (
                    <button
                      type="button"
                      onClick={() => handleCopy(companyResult.cin)}
                      className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      {copiedText === companyResult.cin ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy CIN</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* 4-Column Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">Company Class</span>
                    <span className="font-semibold text-white">{companyResult.class || "Corporate Entity"}</span>
                  </div>

                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">RoC Jurisdiction</span>
                    <span className="font-semibold text-white">{companyResult.roc || "RoC India"}</span>
                    {companyResult.state && (
                      <span className="text-[11px] text-stone-400 block mt-0.5">State: {companyResult.state}</span>
                    )}
                  </div>

                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">Incorporation Year / Date</span>
                    <span className="font-semibold text-white">{companyResult.year || "Registered"}</span>
                    {companyResult.companyAge !== undefined && (
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        (~{companyResult.companyAge} years old)
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">Capital Structure</span>
                    <span className="font-semibold text-white">
                      {companyResult.paidUpCapital || "Authorized & Paid-up"}
                    </span>
                    {companyResult.authorizedCapital && (
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        Auth: {companyResult.authorizedCapital}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address & Industry */}
                <div className="mt-4 pt-4 border-t border-stone-700/60 space-y-2 text-xs text-stone-300">
                  {companyResult.industry && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span><strong>Industry / Business Activity:</strong> {companyResult.industry}</span>
                    </div>
                  )}
                  {companyResult.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span><strong>Registered Office Address:</strong> {companyResult.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Annual Compliances Card */}
              <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span>Mandatory Annual RoC Compliances for {companyResult.name}</span>
                  </div>
                  <span className="text-xs text-stone-500 font-normal">Companies Act 2013</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      form: "AOC-4",
                      purpose: "Filing of Financial Statements (Balance Sheet, P&L, Audit Report)",
                      deadline: "Within 30 days of AGM (typically 29 October)",
                    },
                    {
                      form: "MGT-7",
                      purpose: "Filing of Annual Return (Shareholding, Directors, Indebtedness)",
                      deadline: "Within 60 days of AGM (typically 29 November)",
                    },
                    {
                      form: "DIR-3 KYC",
                      purpose: "Annual Director Identification Number KYC for all board members",
                      deadline: "30 September every year (₹5,000 late fee if missed)",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-stone-900 text-sm font-mono">{item.form}</span>
                        <span className="text-[10px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full">
                          Mandatory
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mb-2 leading-relaxed">{item.purpose}</p>
                      <div className="text-[11px] font-semibold text-stone-700 pt-2 border-t border-stone-200/60 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>Due: {item.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Link to Official MCA Portal */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-stone-500">
                    Verify official charges, director list, and signatory details directly on MCA V3.
                  </p>
                  <a
                    href={companyResult.mcaMasterDataUrl || "https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                  >
                    <span>Open MCA V3 Master Data</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Result Card: Unregistered / Not Found */}
          {searchStatus === "not_found" && (
            <div className="space-y-6">
              <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">
                      No Registered Company Found Matching &quot;{submittedNameQuery}&quot;
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                      No corporate filings matching this exact name were identified in the active registry. If you are planning to incorporate a new company or startup with this name, see the MCA Rule 8 Feasibility assessment below.
                    </p>
                  </div>
                </div>
              </div>

              {/* MCA Rule 8 Name Feasibility Checker */}
              {unregisteredAnalysis && (
                <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-orange-600" />
                        <span>MCA Rule 8 Name Feasibility: &quot;{unregisteredAnalysis.name}&quot;</span>
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Statutory naming rules under Companies (Incorporation) Rules 2014 & SPICe+ Part A
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={entityType}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setEntityType(val);
                          setUnregisteredAnalysis(analyzeCompanyName(submittedNameQuery, val));
                        }}
                        className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="pvt-ltd">Private Limited (Pvt Ltd)</option>
                        <option value="public-ltd">Public Limited (Ltd)</option>
                        <option value="opc">One Person Company (OPC)</option>
                        <option value="llp">Limited Liability Partnership (LLP)</option>
                      </select>

                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 ${
                          unregisteredAnalysis.isValid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {unregisteredAnalysis.isValid ? "Eligible for Registration" : "Requires Modifications"}
                      </span>
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="space-y-3">
                    {unregisteredAnalysis.findings.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                          item.type === "success"
                            ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-800"
                            : item.type === "warning"
                            ? "bg-amber-50/60 border-amber-200/80 text-amber-800"
                            : "bg-red-50/60 border-red-200/80 text-red-800"
                        }`}
                      >
                        {item.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <span>{item.message}</span>
                      </div>
                    ))}
                  </div>

                  {/* MCA Official Name Portal Link */}
                  <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
                    <span>Perform a live real-time name reservation check on Ministry of Corporate Affairs (RUN / SPICe+ Part A):</span>
                    <a
                      href="https://www.mca.gov.in/content/mca/global/en/mca/fo-llp-services/company-name-search.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0"
                    >
                      <span>Check on MCA Name Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          OPTION 2: SEARCH BY NUMBER (CIN / LLPIN)
          ======================================================== */}
      {activeTab === "number" && (
        <div className="space-y-6">
          {/* Search Box Card */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <Search className="w-5 h-5 text-orange-600" />
              <span>Verify & Decode CIN or LLPIN Number</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-4">
              Enter any 21-character Company CIN or 7-character LLPIN. It decodes the statutory structure and fetches the company legal name and RoC details dynamically.
            </p>

            <form onSubmit={(e) => handleNumberSubmit(e)} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    placeholder="Enter 21-digit CIN (e.g. L17110MH1973PLC019786)"
                    className="w-full px-4 py-3 text-sm font-mono uppercase bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    maxLength={25}
                  />
                </div>
                <button
                  type="submit"
                  disabled={numberStatus === "loading"}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-70"
                >
                  {numberStatus === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Decode Master Data</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500">
                <span className="font-medium text-stone-400">Try Samples:</span>
                <button
                  type="button"
                  onClick={() => loadExampleNumber("L17110MH1973PLC019786")}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[11px] rounded-md transition cursor-pointer"
                >
                  L17110MH1973PLC019786 (Reliance)
                </button>
                <button
                  type="button"
                  onClick={() => loadExampleNumber("L22210MH1995PLC084781")}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[11px] rounded-md transition cursor-pointer"
                >
                  L22210MH1995PLC084781 (TCS)
                </button>
                <button
                  type="button"
                  onClick={() => loadExampleNumber("AAB-1234")}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[11px] rounded-md transition cursor-pointer"
                >
                  AAB-1234 (LLPIN)
                </button>
              </div>
            </form>
          </div>

          {/* Results: Invalid State */}
          {cinResult && !cinResult.isValid && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900">Invalid Corporate Identity Number</h4>
                <p className="text-xs sm:text-sm text-red-700 mt-1">{cinResult.message}</p>
              </div>
            </div>
          )}

          {/* Results: Valid CIN Display */}
          {cinResult && cinResult.isValid && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-sm border border-stone-700">
                {/* Resolved Company Name Display */}
                {cinResult.companyName && (
                  <div className="mb-5 pb-4 border-b border-stone-700/80">
                    <span className="text-[11px] font-mono tracking-wider text-orange-400 uppercase font-semibold block">
                      Resolved Company Legal Name
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                      {cinResult.companyName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-md border border-emerald-500/30">
                        Status: {cinResult.companyStatus ?? "Active on MCA"}
                      </span>
                      {cinResult.registeredAddress && (
                        <span className="text-xs text-stone-300">
                          📍 {cinResult.registeredAddress}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-700/80 pb-4 mb-5">
                  <div>
                    <span className="text-[11px] font-mono tracking-wider text-orange-400 uppercase font-semibold">
                      Validated Corporate Identifier
                    </span>
                    <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white mt-0.5">
                      {cinResult.cin}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Statutory Format Valid
                    </span>
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold rounded-full">
                      {cinResult.listingStatus}
                    </span>
                  </div>
                </div>

                {/* 4-Column Decoded Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">Company Class</span>
                    <span className="font-semibold text-white text-base">
                      {cinResult.companyClass}
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Code: {cinResult.classCode}
                    </span>
                  </div>

                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">State & RoC Jurisdiction</span>
                    <span className="font-semibold text-white text-base">
                      {cinResult.stateName}
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      {cinResult.rocOffice}
                    </span>
                  </div>

                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">Incorporation Year</span>
                    <span className="font-semibold text-white text-base">
                      {cinResult.yearOfIncorporation}
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Age: ~{cinResult.companyAge} years
                    </span>
                  </div>

                  <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/50">
                    <span className="text-xs text-stone-400 block mb-1">RoC Registration No.</span>
                    <span className="font-semibold text-white text-base font-mono">
                      {cinResult.registrationNumber}
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      Entity Tax Type: {cinResult.panHolderType}
                    </span>
                  </div>
                </div>

                {/* Industry Classification Banner */}
                <div className="mt-4 p-3.5 bg-stone-800/90 rounded-xl border border-stone-700 flex items-start gap-3">
                  <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-semibold text-white">
                      NIC Industry Code: {cinResult.industryCode}
                    </span>
                    <span className="text-stone-300 block mt-0.5">
                      {cinResult.industryName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance Deadlines */}
              <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span>Statutory RoC Compliance Calendar</span>
                  </div>
                  <span className="text-xs text-stone-500 font-normal">MCA Annual Filing Cycle</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cinResult.complianceDueDates?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-stone-900 text-sm font-mono">
                          {item.form}
                        </span>
                        <span className="text-[10px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full">
                          Mandatory
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mb-2 leading-relaxed">
                        {item.purpose}
                      </p>
                      <div className="text-[11px] font-semibold text-stone-700 pt-2 border-t border-stone-200/60 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>Due: {item.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Link to Official MCA V3 Portal */}
              <div className="p-5 bg-stone-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-stone-200">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Need live authorized share capital or director list?
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Query the official Ministry of Corporate Affairs (MCA V3) master data portal directly.
                  </p>
                </div>
                <a
                  href={cinResult.mcaMasterDataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Open MCA V3 Master Data</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Results: Valid LLPIN Display */}
          {llpinResult && llpinResult.isValid && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-sm border border-stone-700">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-700/80 pb-4 mb-5">
                  <div>
                    <span className="text-[11px] font-mono tracking-wider text-orange-400 uppercase font-semibold">
                      Validated LLP Identification Number
                    </span>
                    <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white mt-0.5">
                      {llpinResult.formatted}
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid LLPIN Format
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-300">
                  {llpinResult.statutoryNotice}
                </p>
              </div>

              {/* LLP Compliance Calendar */}
              <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span>Mandatory Annual Compliance for LLPs</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {llpinResult.complianceDueDates?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80">
                      <span className="font-bold text-stone-900 text-sm font-mono block mb-1">
                        {item.form}
                      </span>
                      <p className="text-xs text-stone-600 mb-3">{item.purpose}</p>
                      <div className="text-[11px] font-semibold text-orange-700 pt-2 border-t border-stone-200">
                        Due: {item.deadline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          OPTION 3: DIRECTOR IDENTIFICATION NUMBER (DIN) VALIDATOR
          ======================================================== */}
      {activeTab === "din" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-600" />
              <span>Director Identification Number (DIN) Validator</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-4">
              Validate 8-digit DIN format for Indian corporate directors and review DIR-3 KYC compliance rules to avoid disqualification.
            </p>

            <form onSubmit={handleDinSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={dinInput}
                  onChange={(e) => setDinInput(e.target.value)}
                  placeholder="Enter 8-digit DIN (e.g. 01234567)"
                  className="w-full sm:max-w-xs px-4 py-3 text-sm font-mono bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  maxLength={8}
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify DIN</span>
                </button>
              </div>
            </form>
          </div>

          {dinResult && (
            <div
              className={`p-6 rounded-2xl border ${
                dinResult.isValid ? "bg-white border-stone-200" : "bg-red-50 border-red-200"
              }`}
            >
              {dinResult.isValid ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Valid 8-Digit Director Identification Number ({dinResult.din})</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {dinResult.explanation}
                  </p>
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      Mandatory Annual Filing: Form DIR-3 KYC by 30 September.
                    </span>
                    <a
                      href="https://www.mca.gov.in/content/mca/global/en/mca/master-data/view-director-master-data.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <span>View Director Details on MCA</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-red-800 text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Invalid DIN Format</h4>
                    <p className="text-xs mt-1">{dinResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
