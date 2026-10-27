"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Key,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ISiteSettings, IActivityLog } from "@/lib/models";

interface SettingsTabProps {
  settings: ISiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<ISiteSettings>>;
  setSettingsDirty: (dirty: boolean) => void;
  saveSettings: (e?: React.FormEvent) => Promise<void>;
  resetSection: (key: keyof ISiteSettings) => void;
  savingSettings: boolean;
  settingsDirty: boolean;
  activityLogs: IActivityLog[];
  handleChangePassword: (e: React.FormEvent) => Promise<void>;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  passwordMsg: { type: "success" | "error"; text: string } | null;
  handleLogoutAllSessions: () => Promise<void>;
}

export default function SettingsTab({
  settings,
  setSettings,
  setSettingsDirty,
  saveSettings,
  resetSection,
  savingSettings,
  settingsDirty,
  activityLogs,
  handleChangePassword,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  passwordMsg,
  handleLogoutAllSessions,
}: SettingsTabProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    heroStats: false,
    about: false,
    trustedBrands: false,
    services: false,
    contact: false,
    seo: false,
    sectionHeadings: false,
    theme: false,
    security: false,
    activityLog: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateHero = (field: string, val: any) => {
    setSettings((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: val },
    }));
    setSettingsDirty(true);
  };

  const updateContact = (field: string, val: any) => {
    setSettings((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: val },
    }));
    setSettingsDirty(true);
  };

  const updateSeo = (field: string, val: any) => {
    setSettings((prev) => ({
      ...prev,
      seo: { ...prev.seo, [field]: val },
    }));
    setSettingsDirty(true);
  };

  const updateHeading = (section: string, field: string, val: any) => {
    setSettings((prev) => ({
      ...prev,
      sectionHeadings: {
        ...prev.sectionHeadings,
        [section]: {
          ...(prev.sectionHeadings as any)[section],
          [field]: val,
        },
      },
    }));
    setSettingsDirty(true);
  };

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(10,10,10,0.08)]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
            Site <span className="font-serif italic font-normal text-[#D40000] lowercase first-letter:uppercase">Settings</span>
          </h2>
          <p className="text-[#6B6B6B] text-xs sm:text-sm mt-1">
            Edit all headlines, stats, story, brands, contact info, and themes live without code deployments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-[#FAF9F7] text-[#0A0A0A] border border-[rgba(10,10,10,0.12)] text-xs font-mono font-bold transition-all shadow-xs"
          >
            <span>View on site</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#D40000]" />
          </a>

          <button
            type="button"
            onClick={() => saveSettings()}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
            }}
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Unsaved changes notice banner */}
      {settingsDirty && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold">You have unsaved changes.</span>
            <span>Click &ldquo;Save Settings&rdquo; to publish them live to the site.</span>
          </div>
          <button
            type="button"
            onClick={() => saveSettings()}
            disabled={savingSettings}
            className="px-4 py-1.5 rounded-full bg-amber-900 text-white font-bold text-xs hover:bg-amber-800 transition-colors cursor-pointer"
          >
            Publish Now
          </button>
        </div>
      )}

      {/* ════════ ACCORDION 1: HERO SECTION ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("hero")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("hero"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">1. Hero Section</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Headline, badge, calligraphy accent word & buttons</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("hero");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset Hero to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.hero ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.hero && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">REC Pill Badge Text</label>
                <input
                  type="text"
                  value={settings.hero?.badge || ""}
                  onChange={(e) => updateHero("badge", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Accent Word (Calligraphy Script)</label>
                <input
                  type="text"
                  value={settings.hero?.accentWord || ""}
                  onChange={(e) => updateHero("accentWord", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Headline Line 1</label>
                <input
                  type="text"
                  value={settings.hero?.headlineLine1 || ""}
                  onChange={(e) => updateHero("headlineLine1", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Headline Line 2</label>
                <input
                  type="text"
                  value={settings.hero?.headlineLine2 || ""}
                  onChange={(e) => updateHero("headlineLine2", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Hero Subtitle Paragraph</label>
              <textarea
                rows={2}
                value={settings.hero?.subtitle || ""}
                onChange={(e) => updateHero("subtitle", e.target.value)}
                className="w-full p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Primary Button Label (Red Pill)</label>
                <input
                  type="text"
                  value={settings.hero?.primaryBtnText || ""}
                  onChange={(e) => updateHero("primaryBtnText", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Secondary Button Label (WhatsApp Pill)</label>
                <input
                  type="text"
                  value={settings.hero?.secondaryBtnText || ""}
                  onChange={(e) => updateHero("secondaryBtnText", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 2: HERO STATS ROW ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("heroStats")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("heroStats"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">2. Hero Stats Row</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">
              — {settings.heroStats?.length || 0} counter chips below hero
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("heroStats");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset Hero Stats"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.heroStats ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.heroStats && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="pt-4 space-y-3">
              {(settings.heroStats || []).map((stat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">Value (e.g. 140+)</label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...settings.heroStats];
                        next[idx].value = e.target.value;
                        setSettings((prev) => ({ ...prev, heroStats: next }));
                        setSettingsDirty(true);
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] font-bold text-sm"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">Label</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...settings.heroStats];
                        next[idx].label = e.target.value;
                        setSettings((prev) => ({ ...prev, heroStats: next }));
                        setSettingsDirty(true);
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4 sm:pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={stat.visible !== false}
                        onChange={(e) => {
                          const next = [...settings.heroStats];
                          next[idx].visible = e.target.checked;
                          setSettings((prev) => ({ ...prev, heroStats: next }));
                          setSettingsDirty(true);
                        }}
                        className="w-4 h-4 rounded text-[#D40000]"
                      />
                      <span>Visible</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = settings.heroStats.filter((_, i) => i !== idx);
                        setSettings((prev) => ({ ...prev, heroStats: next }));
                        setSettingsDirty(true);
                      }}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                      title="Remove stat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setSettings((prev) => ({
                    ...prev,
                    heroStats: [
                      ...(prev.heroStats || []),
                      { value: "50+", label: "New Metric", visible: true, order: (prev.heroStats?.length || 0) + 1 },
                    ],
                  }));
                  setSettingsDirty(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(10,10,10,0.12)] bg-white hover:bg-[#FAF9F7] text-xs font-bold text-[#0A0A0A] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D40000]" />
                <span>Add Hero Stat</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 3: ABOUT & METRIC COUNTERS ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("about")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("about"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">3. About & 4 Counter Cards</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Story text and animated counters</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("about");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset About section"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.about ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.about && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Heading Prefix</label>
                <input
                  type="text"
                  value={settings.about?.heading || ""}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      about: { ...prev.about, heading: e.target.value },
                    }));
                    setSettingsDirty(true);
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Accent Word (Italic Serif)</label>
                <input
                  type="text"
                  value={settings.about?.accentWord || ""}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      about: { ...prev.about, accentWord: e.target.value },
                    }));
                    setSettingsDirty(true);
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Story Paragraphs</label>
              {(settings.about?.paragraphs || []).map((para, pIdx) => (
                <div key={pIdx} className="mb-2 flex gap-2">
                  <textarea
                    rows={2}
                    value={para}
                    onChange={(e) => {
                      const next = [...settings.about.paragraphs];
                      next[pIdx] = e.target.value;
                      setSettings((prev) => ({
                        ...prev,
                        about: { ...prev.about, paragraphs: next },
                      }));
                      setSettingsDirty(true);
                    }}
                    className="flex-1 p-3 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = settings.about.paragraphs.filter((_, i) => i !== pIdx);
                      setSettings((prev) => ({
                        ...prev,
                        about: { ...prev.about, paragraphs: next },
                      }));
                      setSettingsDirty(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSettings((prev) => ({
                    ...prev,
                    about: {
                      ...prev.about,
                      paragraphs: [...(prev.about?.paragraphs || []), "New story paragraph..."],
                    },
                  }));
                  setSettingsDirty(true);
                }}
                className="mt-1 text-xs font-bold text-[#D40000] hover:underline"
              >
                + Add Paragraph
              </button>
            </div>

            {/* 4 Counter Cards */}
            <div className="pt-4 border-t border-[rgba(10,10,10,0.08)]">
              <label className="block text-[#6B6B6B] mb-2 uppercase font-bold">4 Metric Counter Cards</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(settings.about?.counters || []).map((cnt, cIdx) => (
                  <div key={cIdx} className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] space-y-2">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] uppercase font-bold">Label</span>
                      <input
                        type="text"
                        value={cnt.label}
                        onChange={(e) => {
                          const next = [...settings.about.counters];
                          next[cIdx].label = e.target.value;
                          setSettings((prev) => ({
                            ...prev,
                            about: { ...prev.about, counters: next },
                          }));
                          setSettingsDirty(true);
                        }}
                        className="w-full h-8 px-2 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] uppercase font-bold">Number</span>
                        <input
                          type="number"
                          value={cnt.number}
                          onChange={(e) => {
                            const next = [...settings.about.counters];
                            next[cIdx].number = Number(e.target.value);
                            setSettings((prev) => ({
                              ...prev,
                              about: { ...prev.about, counters: next },
                            }));
                            setSettingsDirty(true);
                          }}
                          className="w-full h-8 px-2 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6B6B] uppercase font-bold">Suffix</span>
                        <input
                          type="text"
                          value={cnt.suffix || ""}
                          onChange={(e) => {
                            const next = [...settings.about.counters];
                            next[cIdx].suffix = e.target.value;
                            setSettings((prev) => ({
                              ...prev,
                              about: { ...prev.about, counters: next },
                            }));
                            setSettingsDirty(true);
                          }}
                          className="w-full h-8 px-2 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 4: TRUSTED BRANDS STRIP ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("trustedBrands")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("trustedBrands"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">4. Trusted Brands Strip</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">
              — {settings.trustedBrands?.brands?.length || 0} client logos/names marquee
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("trustedBrands");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset Trusted Brands"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.trustedBrands ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.trustedBrands && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="pt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0A0A0A]">
                <input
                  type="checkbox"
                  checked={settings.trustedBrands?.visible !== false}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      trustedBrands: { ...prev.trustedBrands, visible: e.target.checked },
                    }));
                    setSettingsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-[#D40000]"
                />
                <span>Display Trusted Brands Strip on Website</span>
              </label>

              <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Notice: Only list real client partners.
              </span>
            </div>

            <div>
              <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Strip Heading</label>
              <input
                type="text"
                value={settings.trustedBrands?.heading || ""}
                onChange={(e) => {
                  setSettings((prev) => ({
                    ...prev,
                    trustedBrands: { ...prev.trustedBrands, heading: e.target.value },
                  }));
                  setSettingsDirty(true);
                }}
                className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[#6B6B6B] uppercase font-bold">Brands List</label>
              {(settings.trustedBrands?.brands || []).map((brand, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)]">
                  <input
                    type="text"
                    value={brand.name}
                    onChange={(e) => {
                      const next = [...settings.trustedBrands.brands];
                      next[bIdx].name = e.target.value;
                      setSettings((prev) => ({
                        ...prev,
                        trustedBrands: { ...prev.trustedBrands, brands: next },
                      }));
                      setSettingsDirty(true);
                    }}
                    className="flex-1 h-9 px-3 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs font-bold"
                  />
                  <label className="flex items-center gap-1 cursor-pointer text-[11px] px-2">
                    <input
                      type="checkbox"
                      checked={brand.visible !== false}
                      onChange={(e) => {
                        const next = [...settings.trustedBrands.brands];
                        next[bIdx].visible = e.target.checked;
                        setSettings((prev) => ({
                          ...prev,
                          trustedBrands: { ...prev.trustedBrands, brands: next },
                        }));
                        setSettingsDirty(true);
                      }}
                      className="w-3.5 h-3.5 rounded text-[#D40000]"
                    />
                    <span>Show</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = settings.trustedBrands.brands.filter((_, i) => i !== bIdx);
                      setSettings((prev) => ({
                        ...prev,
                        trustedBrands: { ...prev.trustedBrands, brands: next },
                      }));
                      setSettingsDirty(true);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setSettings((prev) => ({
                    ...prev,
                    trustedBrands: {
                      ...prev.trustedBrands,
                      brands: [
                        ...(prev.trustedBrands?.brands || []),
                        { name: "NEW BRAND", order: (prev.trustedBrands?.brands?.length || 0) + 1, visible: true },
                      ],
                    },
                  }));
                  setSettingsDirty(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[rgba(10,10,10,0.12)] bg-white hover:bg-[#FAF9F7] text-xs font-bold text-[#0A0A0A]"
              >
                <Plus className="w-3.5 h-3.5 text-[#D40000]" />
                <span>Add Brand</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 5: SERVICES (WORK SECTION) ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("services")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("services"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">5. Services (Work Showcase)</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">
              — {settings.services?.length || 0} service carousel cards
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("services");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset Services"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.services ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.services && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="pt-4 space-y-4">
              {(settings.services || []).map((srv, sIdx) => (
                <div key={srv.id} className="p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">Service Title</label>
                      <input
                        type="text"
                        value={srv.title}
                        onChange={(e) => {
                          const next = [...settings.services];
                          next[sIdx].title = e.target.value;
                          setSettings((prev) => ({ ...prev, services: next }));
                          setSettingsDirty(true);
                        }}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">Tag Pill</label>
                      <input
                        type="text"
                        value={srv.tag}
                        onChange={(e) => {
                          const next = [...settings.services];
                          next[sIdx].tag = e.target.value;
                          setSettings((prev) => ({ ...prev, services: next }));
                          setSettingsDirty(true);
                        }}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">Icon</label>
                      <select
                        value={srv.icon || "Video"}
                        onChange={(e) => {
                          const next = [...settings.services];
                          next[sIdx].icon = e.target.value;
                          setSettings((prev) => ({ ...prev, services: next }));
                          setSettingsDirty(true);
                        }}
                        className="w-full h-9 px-3 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs cursor-pointer"
                      >
                        <option value="Video">Video (Cinema Camera)</option>
                        <option value="Camera">Camera (Photo)</option>
                        <option value="Megaphone">Megaphone (Marketing)</option>
                        <option value="Package">Package (Product Shoot)</option>
                        <option value="Calendar">Calendar (Event Coverage)</option>
                        <option value="Film">Film</option>
                        <option value="Sparkles">Sparkles</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">Description</label>
                    <textarea
                      rows={2}
                      value={srv.description}
                      onChange={(e) => {
                        const next = [...settings.services];
                        next[sIdx].description = e.target.value;
                        setSettings((prev) => ({ ...prev, services: next }));
                        setSettingsDirty(true);
                      }}
                      className="w-full p-2.5 rounded-lg bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#6B6B6B] mb-1 font-bold">3 Bullet Features</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[0, 1, 2].map((fIdx) => (
                        <input
                          key={fIdx}
                          type="text"
                          value={srv.features[fIdx] || ""}
                          onChange={(e) => {
                            const next = [...settings.services];
                            const feats = [...next[sIdx].features];
                            feats[fIdx] = e.target.value;
                            next[sIdx].features = feats;
                            setSettings((prev) => ({ ...prev, services: next }));
                            setSettingsDirty(true);
                          }}
                          placeholder={`Feature ${fIdx + 1}`}
                          className="h-8 px-2.5 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(10,10,10,0.06)]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={srv.visible !== false}
                        onChange={(e) => {
                          const next = [...settings.services];
                          next[sIdx].visible = e.target.checked;
                          setSettings((prev) => ({ ...prev, services: next }));
                          setSettingsDirty(true);
                        }}
                        className="w-4 h-4 rounded text-[#D40000]"
                      />
                      <span>Visible in Carousel</span>
                    </label>

                    <span className="text-[10px] text-[#6B6B6B]">
                      Auto WhatsApp Inquiry Link: <code className="text-[#D40000]">Hi Insertix Media, I am interested in {srv.title}</code>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 6: CONTACT & FOOTER ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("contact")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("contact"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">6. Contact & Footer Info</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Phone numbers, email, hours, location & WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("contact");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset Contact Info"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.contact ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.contact && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Contact Email</label>
                <input
                  type="email"
                  value={settings.contact?.email || ""}
                  onChange={(e) => updateContact("email", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">City / Location</label>
                <input
                  type="text"
                  value={settings.contact?.city || ""}
                  onChange={(e) => updateContact("city", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Phone 1 (Primary Call Us)</label>
                <input
                  type="text"
                  value={settings.contact?.phone1 || ""}
                  onChange={(e) => updateContact("phone1", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Phone 2 (Secondary Call Link)</label>
                <input
                  type="text"
                  value={settings.contact?.phone2 || ""}
                  onChange={(e) => updateContact("phone2", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>
            </div>

            {/* WhatsApp Number with Critical Warning */}
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200">
              <label className="block text-[#D40000] mb-1.5 uppercase font-bold">
                WhatsApp Phone Number (used for all WhatsApp buttons & floating bubble)
              </label>
              <input
                type="text"
                value={settings.contact?.whatsappNumber || "919717150055"}
                onChange={(e) => updateContact("whatsappNumber", e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-white border border-red-300 text-[#0A0A0A] text-sm font-bold focus:outline-none focus:border-[#D40000]"
              />
              <p className="mt-1.5 text-[11px] text-[#6B6B6B]">
                Default is <strong>919717150055</strong> (+91 97171 50055). This single number powers every direct inquiry button across the entire site.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Company Legal Name (Copyright line)</label>
                <input
                  type="text"
                  value={settings.contact?.copyrightCompany || ""}
                  onChange={(e) => updateContact("copyrightCompany", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Working Hours Text</label>
                <input
                  type="text"
                  value={settings.contact?.workingHours || ""}
                  onChange={(e) => updateContact("workingHours", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Footer Agency Tagline</label>
              <textarea
                rows={2}
                value={settings.contact?.footerTagline || ""}
                onChange={(e) => updateContact("footerTagline", e.target.value)}
                className="w-full p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Instagram URL</label>
                <input
                  type="text"
                  value={settings.contact?.instagram || ""}
                  onChange={(e) => updateContact("instagram", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">LinkedIn URL</label>
                <input
                  type="text"
                  value={settings.contact?.linkedin || ""}
                  onChange={(e) => updateContact("linkedin", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 7: SECTION HEADINGS & ACCENTS ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("sectionHeadings")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("sectionHeadings"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">7. Section Headings & Accent Words</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Work, About, Members, Recent Work, Partners, Contact</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("sectionHeadings");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset Section Headings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.sectionHeadings ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.sectionHeadings && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(settings.sectionHeadings || {}).map(([key, heading]) => (
                <div key={key} className="p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] space-y-2">
                  <span className="text-[10px] text-[#D40000] uppercase font-bold">{key} Section</span>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B]">Title</label>
                    <input
                      type="text"
                      value={heading.title}
                      onChange={(e) => updateHeading(key, "title", e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B]">Accent Word (Red)</label>
                    <input
                      type="text"
                      value={heading.accentWord}
                      onChange={(e) => updateHeading(key, "accentWord", e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B6B6B]">Subtext</label>
                    <input
                      type="text"
                      value={heading.subtext}
                      onChange={(e) => updateHeading(key, "subtext", e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-white border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 8: THEME & SEO ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("theme")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("theme"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">8. Theme Default & SEO Metadata</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Dark/Light default, page title, meta description & OG image</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetSection("seo");
              }}
              className="p-1.5 rounded-lg text-xs font-mono text-[#6B6B6B] hover:text-[#D40000] hover:bg-red-50 transition-colors"
              title="Reset SEO"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

        {openSections.theme ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
          </div>
        </div>

        {openSections.theme && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Default Theme Mode</label>
                <select
                  value={settings.themeDefault || "system"}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, themeDefault: e.target.value as any }));
                    setSettingsDirty(true);
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm cursor-pointer"
                >
                  <option value="system">System Preference (prefers-color-scheme)</option>
                  <option value="light">Always Light Mode by Default</option>
                  <option value="dark">Always Dark Mode by Default</option>
                </select>
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">SEO Page Title</label>
                <input
                  type="text"
                  value={settings.seo?.title || ""}
                  onChange={(e) => updateSeo("title", e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Meta Description</label>
              <textarea
                rows={2}
                value={settings.seo?.description || ""}
                onChange={(e) => updateSeo("description", e.target.value)}
                className="w-full p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 9: ADMIN SECURITY & SESSIONS ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("security")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("security"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">9. Admin Password & Security</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Change password & session logout</span>
          </div>
          {openSections.security ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
        </div>

        {openSections.security && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-4 text-xs font-mono">
            <form onSubmit={handleChangePassword} className="pt-4 max-w-md space-y-4">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Current Password</label>
                <input
                  required
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">New Password (min 12 characters)</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#0A0A0A] hover:bg-[#202020] text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Update Password
                </button>

                <button
                  type="button"
                  onClick={handleLogoutAllSessions}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-red-50 text-red-600 border border-[rgba(10,10,10,0.12)] font-bold text-xs cursor-pointer"
                >
                  Log out of all sessions
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 10: RECENT ACTIVITY LOG ════════ */}
      <div className="bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-xs overflow-hidden">
        <div onClick={() => toggleSection("activityLog")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSection("activityLog"); }} className="w-full p-6 flex items-center justify-between text-left hover:bg-[#FAF9F7]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#D40000]" />
            <h3 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wide">10. Recent Admin Activity Log</h3>
            <span className="text-xs font-mono text-[#6B6B6B] hidden sm:inline">— Last {activityLogs.length} admin actions</span>
          </div>
          {openSections.activityLog ? <ChevronDown className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />}
        </div>

        {openSections.activityLog && (
          <div className="p-6 pt-0 border-t border-[rgba(10,10,10,0.08)] space-y-2 text-xs font-mono">
            {activityLogs.length === 0 ? (
              <p className="text-[#6B6B6B] pt-4">No recent activity logged.</p>
            ) : (
              <div className="pt-4 divide-y divide-[rgba(10,10,10,0.06)] max-h-72 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-bold text-[#0A0A0A]">{log.action}</span>
                      {log.details && <p className="text-[11px] text-[#6B6B6B]">{log.details}</p>}
                    </div>
                    <div className="text-right text-[10px] text-[#6B6B6B] shrink-0">
                      <span>{log.adminEmail}</span>
                      <br />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
