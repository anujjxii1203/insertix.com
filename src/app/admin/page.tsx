"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FolderKanban,
  Users,
  MessageSquare,
  Mail,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  Upload,
  ExternalLink,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  Crop,
  Settings,
  Key,
  Shield,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { IProject, ITeamMember, ITestimonial, IContactMessage, ISiteSettings, IActivityLog } from "@/lib/models";
import { DEFAULT_SITE_SETTINGS } from "@/lib/defaultSettings";
import { PROJECT_CATEGORIES } from "@/constants/inquiry";
import ImageCropperModal from "@/components/ui/ImageCropperModal";
import SettingsTab from "@/components/admin/SettingsTab";
import { useLiveEvent } from "@/lib/liveSync";
import { authFetch, getAuthHeader, clearAdminToken, getReturnTab, clearDraft, saveDraft } from "@/lib/adminAuth";


export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "team" | "testimonials" | "leads" | "settings">("projects");


  const [projects, setProjects] = useState<IProject[]>([]);
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [testimonials, setTestimonials] = useState<ITestimonial[]>([]);
  const [leads, setLeads] = useState<IContactMessage[]>([]);
  const [settings, setSettings] = useState<ISiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activityLogs, setActivityLogs] = useState<IActivityLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; showLiveLink?: boolean } | null>(null);

  // Settings State & Form
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [openSection, setOpenSection] = useState<string>("hero");

  // Admin Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [editingProject, setEditingProject] = useState<Partial<IProject> | null>(null);
  const [editingTeam, setEditingTeam] = useState<Partial<ITeamMember> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<ITestimonial> | null>(null);
  const [uploading, setUploading] = useState(false);

  // Image Cropper Modal State
  const [cropperState, setCropperState] = useState<{
    imageSrc: string;
    initialAspectRatio?: "4:3" | "1:1" | "4:5";
    initialFocalX?: number;
    initialFocalY?: number;
    initialZoom?: number;
    allowedRatios?: ("4:3" | "1:1" | "4:5")[];
    title: string;
    onComplete: (data: { url?: string; focalX: number; focalY: number; zoom: number; aspectRatio: string }) => void;
  } | null>(null);


  const showToast = (message: string, showLiveLink = true) => {
    setToast({ message, showLiveLink });
    setTimeout(() => setToast(null), 4500);
  };

  // Check auth + restore tab from URL on mount
  useEffect(() => {
    let isMounted = true;

    // Restore tab from ?tab= param (set by login redirect after session expiry)
    const urlTab = new URLSearchParams(window.location.search).get("tab") as typeof activeTab | null;
    if (urlTab && ["projects", "team", "testimonials", "leads", "settings"].includes(urlTab)) {
      setActiveTab(urlTab);
      clearDraft(); // draft was restored, wipe it
    }

    fetch("/api/auth/me", { headers: getAuthHeader() })
      .then((res) => {
        if (!isMounted) return;
        if (!res.ok) {
          clearAdminToken();
          router.replace("/admin/login");
        } else {
          setAuthChecked(true);
          loadAllData();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        router.replace("/admin/login");
      });
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time sync for inquiries via shared connection
  useLiveEvent("leads-updated", () => {
    if (!authChecked) return;
    fetch("/api/admin/contacts")
      .then((r) => r.ok && r.json())
      .then((fresh) => Array.isArray(fresh) && setLeads(fresh))
      .catch(() => {});
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [projRes, teamRes, testRes, leadsRes, setRes, logsRes] = await Promise.all([
        fetch("/api/projects?admin=true"),
        fetch("/api/team?admin=true"),
        fetch("/api/testimonials?admin=true"),
        fetch("/api/admin/contacts"),
        fetch("/api/settings"),
        fetch("/api/admin/activity-logs"),
      ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (teamRes.ok) setTeam(await teamRes.json());
      if (testRes.ok) setTestimonials(await testRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (setRes.ok) {
        const setJson = await setRes.json();
        if (setJson && setJson.hero) setSettings(setJson);
      }
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        if (Array.isArray(logsJson)) setActivityLogs(logsJson);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: getAuthHeader() });
    clearAdminToken();
    clearDraft();
    router.push("/admin/login");
  };


  // Direct upload of a Blob or File to /api/upload with progress & retry
  const uploadBlob = async (blob: Blob | File, filename = "image.webp"): Promise<string | null> => {
    // Client-side file validation (max 8MB, valid image format)
    if (blob.size > 8 * 1024 * 1024) {
      showToast("File exceeds 8MB maximum upload limit. Please choose a smaller file.", false);
      return null;
    }

    setUploading(true);
    showToast("Compressing & uploading image...", false);
    const formData = new FormData();
    formData.append("file", blob, filename);

    try {
      const res = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        showToast("Image saved & compressed on ImageKit", false);
        return data.url;
      } else {
        const errorMsg = data.error || `Upload failed (Status ${res.status})`;
        console.error("Server upload error:", errorMsg);
        showToast(`Upload failed: ${errorMsg}`, false);
        return null;
      }
    } catch (err: any) {
      console.error("Network upload error:", err);
      showToast(`Upload failed: ${err.message || "Network error. Please try again."}`, false);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Process a selected or dropped/pasted file
  const processImageFile = (
    file: File,
    initialAspectRatio: "4:3" | "1:1" | "4:5",
    allowedRatios: ("4:3" | "1:1" | "4:5")[],
    title: string,
    callback: (data: { url?: string; focalX: number; focalY: number; zoom: number; aspectRatio: string }) => void,
    initialFocalX = 50,
    initialFocalY = 50,
    initialZoom = 1
  ) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp|avif)$/i.test(file.name)) {
      showToast("Unsupported file format. Please upload JPG, PNG, WebP, or AVIF.", false);
      return;
    }

    // Validate size (8MB)
    if (file.size > 8 * 1024 * 1024) {
      showToast("File size exceeds 8MB. Please choose a smaller image.", false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        // Upload the ORIGINAL file first to ImageKit
        const uploadedUrl = await uploadBlob(file, file.name);
        if (!uploadedUrl) return;

        setCropperState({
          imageSrc: reader.result,
          initialAspectRatio,
          allowedRatios,
          initialFocalX,
          initialFocalY,
          initialZoom,
          title,
          onComplete: (cropData) => {
            callback({
              url: uploadedUrl,
              ...cropData,
            });
          },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Pick file from input and open Cropper Modal
  const handleFileSelectForCrop = (
    e: React.ChangeEvent<HTMLInputElement>,
    initialAspectRatio: "4:3" | "1:1" | "4:5",
    allowedRatios: ("4:3" | "1:1" | "4:5")[],
    title: string,
    callback: (data: { url?: string; focalX: number; focalY: number; zoom: number; aspectRatio: string }) => void,
    initialFocalX = 50,
    initialFocalY = 50,
    initialZoom = 1
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    processImageFile(file, initialAspectRatio, allowedRatios, title, callback, initialFocalX, initialFocalY, initialZoom);
  };


  // ================= PROJECT ACTIONS =================
  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    let cleanLink = editingProject.link ? editingProject.link.trim() : "";
    if (cleanLink && !/^https?:\/\//i.test(cleanLink)) {
      if (/^[a-z0-9+.-]+:/i.test(cleanLink) && !/^https?:/i.test(cleanLink)) {
        alert("Only http:// and https:// URLs are permitted");
        return;
      }
      cleanLink = `https://${cleanLink}`;
    }

    const isEdit = Boolean(editingProject.id);
    const url = isEdit ? `/api/projects/${editingProject.id}` : "/api/projects";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...editingProject,
      link: cleanLink,
      order: editingProject.order ?? (projects.length + 1),
      visible: editingProject.visible ?? true,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      if (isEdit) {
        setProjects(prev => prev.map(p => p.id === saved.id ? saved : p));
      } else {
        setProjects(prev => [...prev, saved]);
      }
      setEditingProject(null);

      // Check whether ISR revalidation succeeded or was delayed/skipped
      if (saved._revalidation?.success) {
        showToast("Saved. Live on the website");
      } else {
        showToast("Saved, but the website may take a few minutes to update");
        if (saved._revalidation?.error) {
          console.warn("[Admin] Revalidation notice:", saved._revalidation.error);
        }
      }
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error || `Error saving project (${res.status})`);
    }
  };


  const toggleProjectVisibility = async (p: IProject) => {
    const newVisible = p.visible === false ? true : false;
    // Optimistic update
    setProjects(prev => prev.map(item => item.id === p.id ? { ...item, visible: newVisible } : item));
    const res = await authFetch(`/api/projects/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: newVisible }),
    });
    if (res.ok) {
      showToast(newVisible ? "Project published to website" : "Project hidden from website");
    } else {
      loadAllData();
    }
  };

  const moveProjectOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const updated = [...projects];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // re-assign sequential orders
    updated.forEach((p, i) => (p.order = i + 1));
    setProjects(updated);

    // Save orders
    await Promise.all([
      authFetch(`/api/projects/${updated[index].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updated[index].order }),
      }),
      authFetch(`/api/projects/${updated[targetIndex].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updated[targetIndex].order }),
      }),
    ]);
    showToast("Project order updated live");
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project from website and database?")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    const res = await authFetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Project deleted from live site");
    } else {
      loadAllData();
    }
  };

  // ================= TEAM ACTIONS =================
  const saveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const isEdit = Boolean(editingTeam.id);
    const url = isEdit ? `/api/team/${editingTeam.id}` : "/api/team";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...editingTeam,
      order: editingTeam.order ?? (team.length + 1),
      visible: editingTeam.visible ?? true,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      if (isEdit) {
        setTeam(prev => prev.map(m => m.id === saved.id ? saved : m));
      } else {
        setTeam(prev => [...prev, saved]);
      }
      setEditingTeam(null);
      if (saved._revalidation?.success) {
        showToast("Team member saved. Live on the website");
      } else {
        showToast("Team member saved, website will refresh shortly");
      }
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error || `Error saving team member (${res.status})`);
    }
  };

  const toggleTeamVisibility = async (m: ITeamMember) => {
    const newVisible = m.visible === false ? true : false;
    setTeam(prev => prev.map(item => item.id === m.id ? { ...item, visible: newVisible } : item));
    const res = await authFetch(`/api/team/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: newVisible }),
    });
    if (res.ok) {
      showToast(newVisible ? "Member published live" : "Member hidden from website");
    } else {
      loadAllData();
    }
  };

  const moveTeamOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= team.length) return;

    const updated = [...team];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((m, i) => (m.order = i + 1));
    setTeam(updated);

    await Promise.all([
      authFetch(`/api/team/${updated[index].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updated[index].order }),
      }),
      authFetch(`/api/team/${updated[targetIndex].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updated[targetIndex].order }),
      }),
    ]);
    showToast("Team order updated live");
  };

  const deleteTeamMember = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    setTeam(prev => prev.filter(m => m.id !== id));
    const res = await authFetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Team member removed from live site");
    } else {
      loadAllData();
    }
  };

  // ================= TESTIMONIAL ACTIONS =================
  const saveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    const isEdit = Boolean(editingTestimonial.id);
    const url = isEdit ? `/api/testimonials/${editingTestimonial.id}` : "/api/testimonials";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...editingTestimonial,
      order: editingTestimonial.order ?? (testimonials.length + 1),
      visible: editingTestimonial.visible ?? true,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      if (isEdit) {
        setTestimonials(prev => prev.map(t => t.id === saved.id ? saved : t));
      } else {
        setTestimonials(prev => [...prev, saved]);
      }
      setEditingTestimonial(null);
      if (saved._revalidation?.success) {
        showToast("Testimonial saved. Live on website");
      } else {
        showToast("Testimonial saved, website will refresh shortly");
      }
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error || `Error saving testimonial (${res.status})`);
    }
  };

  const toggleTestimonialVisibility = async (t: ITestimonial) => {
    const newVisible = t.visible === false ? true : false;
    setTestimonials(prev => prev.map(item => item.id === t.id ? { ...item, visible: newVisible } : item));
    const res = await authFetch(`/api/testimonials/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: newVisible }),
    });
    if (res.ok) {
      showToast(newVisible ? "Testimonial published live" : "Testimonial hidden from site");
    } else {
      loadAllData();
    }
  };

  const moveTestimonialOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const updated = [...testimonials];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((t, i) => (t.order = i + 1));
    setTestimonials(updated);

    await Promise.all([
      authFetch(`/api/testimonials/${updated[index].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updated[index].order }),
      }),
      authFetch(`/api/testimonials/${updated[targetIndex].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: updated[targetIndex].order }),
      }),
    ]);
    showToast("Testimonial order updated live");
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    setTestimonials(prev => prev.filter(t => t.id !== id));
    const res = await authFetch(`/api/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Testimonial deleted from live site");
    } else {
      loadAllData();
    }
  };

  // ================= LEAD ACTIONS =================
  const updateLeadStatus = async (id: string, status: "new" | "contacted" | "closed") => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await authFetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    showToast(`Inquiry status updated to ${status}`);
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this inquiry record?")) return;
    setLeads(prev => prev.filter(l => l.id !== id));
    const res = await authFetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Inquiry deleted");
    } else {
      loadAllData();
    }
  };

  // ================= SITE SETTINGS ACTIONS =================
  const saveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await authFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        onSessionExpired: () => saveDraft("settings", settings),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSettingsDirty(false);
        showToast("Site settings saved. Live on website");
        // refresh logs
        fetch("/api/admin/activity-logs")
          .then((r) => r.ok && r.json())
          .then((logs) => Array.isArray(logs) && setActivityLogs(logs));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save settings");
      }
    } catch {
      alert("Network error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const resetSection = (sectionKey: keyof ISiteSettings) => {
    if (!confirm(`Reset ${String(sectionKey)} section back to default content?`)) return;
    setSettings((prev) => ({
      ...prev,
      [sectionKey]: DEFAULT_SITE_SETTINGS[sectionKey],
    }));
    setSettingsDirty(true);
    showToast(`Section ${String(sectionKey)} reset to default (click Save to publish)`);
  };

  // ================= SECURITY ACTIONS =================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 12) {
      setPasswordMsg({ type: "error", text: "New password must be at least 12 characters" });
      return;
    }

    try {
      const res = await authFetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: "success", text: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        showToast("Password changed successfully", false);
        // refresh logs
        fetch("/api/admin/activity-logs")
          .then((r) => r.ok && r.json())
          .then((logs) => Array.isArray(logs) && setActivityLogs(logs));
      } else {
        setPasswordMsg({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Network error changing password" });
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm("Are you sure you want to log out of all active sessions? You will need to log in again.")) return;
    try {
      await authFetch("/api/admin/logout-all", { method: "POST" });
      clearAdminToken();
      clearDraft();
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  const unreadLeadsCount = leads.filter(l => l.status === "new").length;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] flex items-center justify-center text-[#0A0A0A] font-mono text-xs">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] text-[#0A0A0A] flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0A0A0A] text-white shadow-xl text-xs border border-white/10 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#FF5A4D]" />
          <span className="font-medium">{toast.message}</span>
          {toast.showLiveLink && (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-2 font-bold text-[#FF5A4D] hover:underline"
            >
              <span>View live</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Sticky Header matching 72px standard */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(10,10,10,0.08)] h-[72px] flex items-center">
        <div className="max-w-[1280px] w-full mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-24">
              <Image src="/logo.webp" alt="Insertix Media" fill sizes="96px" className="object-contain object-left" priority />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-[#FAF9F7] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)]">
              Admin Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FAF9F7] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)] text-xs font-mono font-semibold transition-colors shadow-xs"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#D40000]" />
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 border border-[rgba(10,10,10,0.08)] text-xs font-mono transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-12 py-8 sm:py-10">
        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all flex-shrink-0 cursor-pointer ${
              activeTab === "projects"
                ? "bg-[#0A0A0A] text-white shadow-sm"
                : "bg-white border border-[rgba(10,10,10,0.08)] text-[#6B6B6B] hover:text-[#0A0A0A]"
            }`}
          >
            <FolderKanban className="w-4 h-4 text-[#D40000]" />
            <span>Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all flex-shrink-0 cursor-pointer ${
              activeTab === "team"
                ? "bg-[#0A0A0A] text-white shadow-sm"
                : "bg-white border border-[rgba(10,10,10,0.08)] text-[#6B6B6B] hover:text-[#0A0A0A]"
            }`}
          >
            <Users className="w-4 h-4 text-[#D40000]" />
            <span>Specialists ({team.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("testimonials")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all flex-shrink-0 cursor-pointer ${
              activeTab === "testimonials"
                ? "bg-[#0A0A0A] text-white shadow-sm"
                : "bg-white border border-[rgba(10,10,10,0.08)] text-[#6B6B6B] hover:text-[#0A0A0A]"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#D40000]" />
            <span>Testimonials ({testimonials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all flex-shrink-0 cursor-pointer ${
              activeTab === "leads"
                ? "bg-[#0A0A0A] text-white shadow-sm"
                : "bg-white border border-[rgba(10,10,10,0.08)] text-[#6B6B6B] hover:text-[#0A0A0A]"
            }`}
          >
            <Mail className="w-4 h-4 text-[#D40000]" />
            <span>Inquiries ({leads.length})</span>
            {unreadLeadsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D40000] text-white">
                {unreadLeadsCount} New
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all flex-shrink-0 cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#0A0A0A] text-white shadow-sm"
                : "bg-white border border-[rgba(10,10,10,0.08)] text-[#6B6B6B] hover:text-[#0A0A0A]"
            }`}
          >
            <Settings className="w-4 h-4 text-[#D40000]" />
            <span>Site Settings</span>
            {settingsDirty && (
              <span className="w-2 h-2 rounded-full bg-[#D40000]" title="Unsaved changes" />
            )}
          </button>
        </div>

        {/* ================= TAB 1: PROJECTS ================= */}
        {activeTab === "projects" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
                  Portfolio <span className="font-serif italic font-normal text-[#D40000] lowercase first-letter:uppercase">Projects</span>
                </h2>
                <p className="text-[#6B6B6B] text-xs sm:text-sm mt-1">
                  Manage the 10 showcase projects featured in the Recent Work carousel
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingProject({
                    title: "",
                    category: "video",
                    client: "",
                    description: "",
                    coverImage: "/projects/proj-video-1.webp",
                    videoPreview: "",
                    link: "",
                    featured: true,
                    deliverables: ["4K Cinema", "Color Graded"],
                    metrics: "2.5M Views",
                    year: "2025",
                    order: projects.length + 1,
                    visible: true,
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:brightness-105 active:scale-95 cursor-pointer self-start sm:self-auto"
                style={{
                  background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>

            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 rounded-[24px] bg-white animate-pulse border border-[rgba(10,10,10,0.08)]" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] text-[#6B6B6B] text-sm">
                No projects found. Click &quot;Add Project&quot; above to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] overflow-hidden shadow-[0_10px_30px_rgba(10,10,10,0.04)] flex flex-col justify-between transition-all ${
                      p.visible === false ? "opacity-60 bg-[#FAF9F7]" : ""
                    }`}
                  >
                    <div>
                      {/* Media preview */}
                      <div className="relative w-full aspect-[16/10] bg-[#FAF9F7] overflow-hidden border-b border-[rgba(10,10,10,0.06)]">
                        <Image src={p.coverImage} alt={p.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/95 text-[#D40000] border border-[rgba(10,10,10,0.08)] shadow-xs">
                          {p.category}
                        </span>

                        <button
                          onClick={() => toggleProjectVisibility(p)}
                          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            p.visible !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                          }`}
                          title="Click to toggle visibility on website"
                        >
                          {p.visible !== false ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-xs font-mono text-[#6B6B6B] mb-1.5">
                          <span>{p.client}</span>
                          <span>{p.year}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#0A0A0A] mb-1.5 line-clamp-1">{p.title}</h3>
                        {p.description && (
                          <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed mb-3">{p.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {p.metrics && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FDECEC] text-[#D40000] border border-[#D40000]/20">
                              <Sparkles className="w-3 h-3" />
                              {p.metrics}
                            </span>
                          )}
                          {p.link ? (
                            <div className="inline-flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FAF9F7] text-[#0A0A0A] border border-[rgba(10,10,10,0.12)] max-w-[170px] truncate" title={p.link}>
                                🔗 {p.link.replace(/^https?:\/\/(www\.)?/, "")}
                              </span>
                              <a
                                href={p.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#D40000] hover:bg-[#D40000] hover:text-white border border-[#D40000]/30 transition-colors inline-flex items-center gap-1"
                                title="Test link in new tab"
                              >
                                <span>Test link</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-[#A0A0A0] italic">
                              No link attached (non-clickable on site)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>


                    {/* Bottom Actions */}
                    <div className="p-4 border-t border-[rgba(10,10,10,0.08)] bg-[#FAF9F7]/60 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveProjectOrder(idx, "up")}
                          className="w-8 h-8 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] disabled:opacity-30 cursor-pointer shadow-2xs"
                          title="Move project up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === projects.length - 1}
                          onClick={() => moveProjectOrder(idx, "down")}
                          className="w-8 h-8 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] disabled:opacity-30 cursor-pointer shadow-2xs"
                          title="Move project down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-mono text-[#6B6B6B] ml-1">#{p.order ?? idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProject(p)}
                          className="w-9 h-9 rounded-full bg-white hover:bg-[#0A0A0A] text-[#0A0A0A] hover:text-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="w-9 h-9 rounded-full bg-white hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: TEAM ================= */}
        {activeTab === "team" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
                  Team <span className="font-serif italic font-normal text-[#D40000] lowercase first-letter:uppercase">Collective</span>
                </h2>
                <p className="text-[#6B6B6B] text-xs sm:text-sm mt-1">
                  Manage agency specialists, roles, and profiles shown on the main site
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingTeam({
                    name: "",
                    role: "Creative Director",
                    bio: "",
                    avatar: "/assets/team-1.webp",
                    socials: { linkedin: "", instagram: "", twitter: "" },
                    order: team.length + 1,
                    visible: true,
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:brightness-105 active:scale-95 cursor-pointer self-start sm:self-auto"
                style={{
                  background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Specialist</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((m, idx) => (
                <div
                  key={m.id}
                  className={`bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] p-5 shadow-[0_10px_30px_rgba(10,10,10,0.04)] flex flex-col justify-between transition-all ${
                    m.visible === false ? "opacity-60 bg-[#FAF9F7]" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] flex-shrink-0">
                      <Image src={m.avatar} alt={m.name} fill sizes="80px" className="object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#D40000] truncate">{m.role}</span>
                        <button
                          onClick={() => toggleTeamVisibility(m)}
                          className="text-xs text-[#6B6B6B] hover:text-[#0A0A0A] p-1 cursor-pointer"
                          title="Toggle member visibility"
                        >
                          {m.visible !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <h3 className="font-bold text-base text-[#0A0A0A] mt-0.5 truncate">{m.name}</h3>
                      <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2 leading-relaxed">{m.bio}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[rgba(10,10,10,0.08)] flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveTeamOrder(idx, "up")}
                        className="w-7 h-7 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === team.length - 1}
                        onClick={() => moveTeamOrder(idx, "down")}
                        className="w-7 h-7 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-mono text-[#6B6B6B] ml-1">#{m.order ?? idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTeam(m)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-[#0A0A0A] text-[#0A0A0A] hover:text-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTeamMember(m.id)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: TESTIMONIALS ================= */}
        {activeTab === "testimonials" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
                  Client <span className="font-serif italic font-normal text-[#D40000] lowercase first-letter:uppercase">Testimonials</span>
                </h2>
                <p className="text-[#6B6B6B] text-xs sm:text-sm mt-1">
                  Manage client reviews and shoot endorsements in the carousel
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingTestimonial({
                    clientName: "",
                    company: "",
                    role: "",
                    content: "",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
                    rating: 5,
                    order: testimonials.length + 1,
                    visible: true,
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:brightness-105 active:scale-95 cursor-pointer self-start sm:self-auto"
                style={{
                  background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Testimonial</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className={`bg-white rounded-[24px] border border-[rgba(10,10,10,0.08)] p-6 shadow-[0_10px_30px_rgba(10,10,10,0.04)] flex flex-col justify-between transition-all ${
                    t.visible === false ? "opacity-60 bg-[#FAF9F7]" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-1 text-[#D40000]">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <span key={i} className="text-sm">★</span>
                        ))}
                      </div>
                      <button
                        onClick={() => toggleTestimonialVisibility(t)}
                        className="text-xs text-[#6B6B6B] hover:text-[#0A0A0A] p-1 cursor-pointer"
                        title="Toggle visibility"
                      >
                        {t.visible !== false ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="text-sm italic text-[#0A0A0A] font-normal leading-relaxed mb-4">
                      &ldquo;{t.content}&rdquo;
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[rgba(10,10,10,0.08)]">
                        <Image src={t.avatar} alt={t.clientName} fill sizes="44px" className="object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0A0A0A]">{t.clientName}</h4>
                        <p className="text-xs font-mono text-[#6B6B6B]">
                          {t.role}, <span className="font-semibold text-[#0A0A0A]">{t.company}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[rgba(10,10,10,0.08)] mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveTestimonialOrder(idx, "up")}
                        className="w-7 h-7 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === testimonials.length - 1}
                        onClick={() => moveTestimonialOrder(idx, "down")}
                        className="w-7 h-7 rounded-full bg-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-mono text-[#6B6B6B] ml-1">#{t.order ?? idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingTestimonial(t)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-[#0A0A0A] text-[#0A0A0A] hover:text-white border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTestimonial(t.id)}
                        className="w-9 h-9 rounded-full bg-white hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: LEADS ================= */}
        {activeTab === "leads" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
                  Client <span className="font-serif italic font-normal text-[#D40000] lowercase first-letter:uppercase">Inquiries</span>
                </h2>
                <p className="text-[#6B6B6B] text-xs sm:text-sm mt-1">
                  Incoming contact form leads with budget, target service, and direct WhatsApp actions
                </p>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="bg-white p-12 rounded-[24px] border border-[rgba(10,10,10,0.08)] text-center text-[#6B6B6B] text-sm">
                No inquiries received yet. Submit the contact form on the home page to test leads.
              </div>
            ) : (
              <div className="space-y-5">
                {leads.map((l) => {
                  const cleanPhone = l.phone.replace(/[^0-9]/g, "");
                  const waReplyUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hi ${l.name}, thank you for reaching out to Insertix Media regarding ${l.service}. Let's discuss your project requirements.`
                  )}`;

                  return (
                    <div
                      key={l.id}
                      className="bg-white p-6 rounded-[24px] border border-[rgba(10,10,10,0.08)] shadow-[0_10px_30px_rgba(10,10,10,0.03)] flex flex-col gap-4"
                    >
                      {/* Top Row: Name, Badges, Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-bold text-lg text-[#0A0A0A]">{l.name}</h3>

                          {l.status === "new" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#D40000] text-white">
                              New
                            </span>
                          )}

                          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#FDECEC] text-[#D40000] border border-[#D40000]/20">
                            {l.service}
                          </span>

                          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FAF9F7] text-[#0A0A0A] border border-[rgba(10,10,10,0.08)]">
                            {l.budget}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#6B6B6B]">
                          <Clock className="w-3.5 h-3.5 text-[#D40000]" />
                          <span>{new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>

                      {/* Contact metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#6B6B6B] pt-1">
                        <span>Email: <a href={`mailto:${l.email}`} className="text-[#0A0A0A] font-semibold hover:text-[#D40000] underline">{l.email}</a></span>
                        <span>•</span>
                        <span>Phone: <a href={`tel:${l.phone}`} className="text-[#0A0A0A] font-semibold hover:text-[#D40000]">{l.phone}</a></span>
                      </div>

                      {/* Inquiry Message Box (high contrast light surface) */}
                      <div className="bg-[#FAF9F7] p-4 rounded-[16px] border border-[rgba(10,10,10,0.08)] text-sm text-[#0A0A0A] leading-relaxed">
                        {l.message}
                      </div>

                      {/* Actions footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        {/* Status selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#6B6B6B] uppercase font-bold">Status:</span>
                          <select
                            value={l.status || "new"}
                            onChange={(e) => updateLeadStatus(l.id, e.target.value as any)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[rgba(10,10,10,0.12)] text-xs font-mono font-semibold text-[#0A0A0A] cursor-pointer"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>

                        {/* WhatsApp Reply and Delete */}
                        <div className="flex items-center gap-3">
                          <a
                            href={waReplyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Reply on WhatsApp</span>
                          </a>

                          <button
                            onClick={() => deleteLead(l.id)}
                            className="w-9 h-9 rounded-full bg-white hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 border border-[rgba(10,10,10,0.08)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Delete inquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= SITE SETTINGS TAB ================= */}
        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            setSettingsDirty={setSettingsDirty}
            saveSettings={saveSettings}
            resetSection={resetSection}
            savingSettings={savingSettings}
            settingsDirty={settingsDirty}
            activityLogs={activityLogs}
            handleChangePassword={handleChangePassword}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            passwordMsg={passwordMsg}
            handleLogoutAllSessions={handleLogoutAllSessions}
          />
        )}
      </main>

      {/* ================= PROJECT EDIT MODAL ================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 max-w-2xl w-full border border-[rgba(10,10,10,0.08)] text-[#0A0A0A] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-[rgba(10,10,10,0.08)] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D40000]">Recent Work Showcase</span>
                <h3 className="text-xl font-black uppercase text-[#0A0A0A] mt-0.5">
                  {editingProject.id ? "Edit Project" : "New Showcase Project"}
                </h3>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-2 rounded-full hover:bg-[#FAF9F7] text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveProject} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Project Title</label>
                <input
                  required
                  type="text"
                  value={editingProject.title || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="e.g. Zomato Gold Commercial & Cinema Ad"
                  className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Category</label>
                  <select
                    value={editingProject.category || "video"}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                    className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm font-semibold cursor-pointer focus:outline-none focus:border-[#D40000]"
                  >
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Client Name</label>
                  <input
                    required
                    type="text"
                    value={editingProject.client || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                    placeholder="e.g. Zomato Dining"
                    className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">
                  Link (opens when thumbnail is clicked)
                </label>
                <input
                  type="text"
                  value={editingProject.link || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, link: e.target.value })}
                  placeholder="https://youtube.com/... or https://instagram.com/..."
                  className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
                <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mt-1 font-mono">
                  <span>
                    {editingProject.link && editingProject.link.trim() !== "" ? (
                      editingProject.link.startsWith("javascript:") ? (
                        <span className="text-red-500 font-bold">⚠️ Dangerous scheme not allowed</span>
                      ) : !/^https?:\/\//i.test(editingProject.link.trim()) ? (
                        <span className="text-amber-600">Auto-prefixes https:// upon save</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">✓ Valid web link</span>
                      )
                    ) : (
                      "Leave blank to make card non-clickable"
                    )}
                  </span>
                  {editingProject.link && editingProject.link.trim() !== "" && (
                    <a
                      href={
                        editingProject.link.startsWith("http")
                          ? editingProject.link
                          : `https://${editingProject.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D40000] hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <span>Test link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">
                  Description <span className="text-zinc-400 font-normal lowercase">(optional — internal archive)</span>
                </label>
                <textarea
                  rows={2}
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Optional project notes or archive details..."
                  className="w-full p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#6B6B6B] uppercase font-bold">Cover Image (URL or Local WebP)</label>
                  <span className="text-[11px] font-mono text-[#D40000]">
                    Card ratio: {editingProject.aspectRatio || "4:3"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={editingProject.coverImage || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, coverImage: e.target.value })}
                    className="flex-1 h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                  <label className="h-13 px-5 rounded-xl bg-white hover:bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] cursor-pointer flex items-center gap-1.5 text-xs text-[#0A0A0A] font-bold shadow-2xs hover:border-[#D40000]/40 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#D40000]" />
                    <span>{uploading ? "Uploading..." : "Upload & Crop"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelectForCrop(
                          e,
                          (editingProject.aspectRatio as any) || "4:3",
                          ["4:3", "1:1", "4:5"],
                          "Position & Frame Project Image",
                          (data) => {
                            setEditingProject((prev) => ({
                              ...prev,
                              coverImage: data.url || prev?.coverImage,
                              focalX: data.focalX,
                              focalY: data.focalY,
                              zoom: data.zoom,
                              aspectRatio: data.aspectRatio,
                            }));
                          },
                          editingProject.focalX ?? 50,
                          editingProject.focalY ?? 50,
                          editingProject.zoom ?? 1
                        )
                      }
                    />
                  </label>
                </div>

                {/* Drag-and-drop & paste dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) {
                      processImageFile(
                        droppedFile,
                        (editingProject.aspectRatio as any) || "4:3",
                        ["4:3", "1:1", "4:5"],
                        "Position & Frame Project Image",
                        (data) => {
                          setEditingProject((prev) => ({
                            ...prev,
                            coverImage: data.url || prev?.coverImage,
                            focalX: data.focalX,
                            focalY: data.focalY,
                            zoom: data.zoom,
                            aspectRatio: data.aspectRatio,
                          }));
                        },
                        editingProject.focalX ?? 50,
                        editingProject.focalY ?? 50,
                        editingProject.zoom ?? 1
                      );
                    }
                  }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith("image/")) {
                        const pasted = items[i].getAsFile();
                        if (pasted) {
                          processImageFile(
                            pasted,
                            (editingProject.aspectRatio as any) || "4:3",
                            ["4:3", "1:1", "4:5"],
                            "Position & Frame Project Image",
                            (data) => {
                              setEditingProject((prev) => ({
                                ...prev,
                                coverImage: data.url || prev?.coverImage,
                                focalX: data.focalX,
                                focalY: data.focalY,
                                zoom: data.zoom,
                                aspectRatio: data.aspectRatio,
                              }));
                            },
                            editingProject.focalX ?? 50,
                            editingProject.focalY ?? 50,
                            editingProject.zoom ?? 1
                          );
                          break;
                        }
                      }
                    }
                  }}
                  className="mt-2 p-3 rounded-xl border border-dashed border-[rgba(10,10,10,0.15)] bg-[#FAF9F7]/60 text-center text-[11px] font-mono text-[#6B6B6B] hover:border-[#D40000]/40 transition-colors cursor-pointer"
                >
                  Drag & drop file here or paste directly (Ctrl+V / Cmd+V)
                </div>

                {/* Live Image Preview with Crop & Reposition action */}
                {editingProject.coverImage && (
                  <div className="mt-2.5 p-2 rounded-2xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] flex flex-col gap-2">
                    <div
                      className={`relative w-full ${
                        editingProject.aspectRatio === "1:1"
                          ? "aspect-[1/1] max-h-56"
                          : editingProject.aspectRatio === "4:5"
                          ? "aspect-[4/5] max-h-56"
                          : "aspect-[4/3] max-h-56"
                      } rounded-xl overflow-hidden border border-[rgba(10,10,10,0.08)] bg-[#EAE8E4]`}
                    >
                      <div
                        className="relative w-full h-full overflow-hidden"
                        style={{
                          transform:
                            (editingProject.zoom ?? 1) > 1
                              ? `scale(${editingProject.zoom})`
                              : "none",
                          transformOrigin: `${editingProject.focalX ?? 50}% ${editingProject.focalY ?? 50}%`,
                        }}
                      >
                        <Image
                          src={editingProject.coverImage}
                          alt="Preview"
                          fill
                          sizes="400px"
                          style={{
                            objectFit: "cover",
                            objectPosition: `${editingProject.focalX ?? 50}% ${editingProject.focalY ?? 50}%`,
                          }}
                          className="object-cover"
                          unoptimized={editingProject.coverImage.startsWith("data:")}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-mono text-[#6B6B6B]">
                        ✓ Live card framing ({editingProject.aspectRatio || "4:3"}, focal {editingProject.focalX ?? 50}% {editingProject.focalY ?? 50}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingProject.coverImage) {
                            setCropperState({
                              imageSrc: editingProject.coverImage,
                              initialAspectRatio: (editingProject.aspectRatio as any) || "4:3",
                              allowedRatios: ["4:3", "1:1", "4:5"],
                              initialFocalX: editingProject.focalX ?? 50,
                              initialFocalY: editingProject.focalY ?? 50,
                              initialZoom: editingProject.zoom ?? 1,
                              title: "Reposition Project Image",
                              onComplete: (data) =>
                                setEditingProject((prev) => ({
                                  ...prev,
                                  focalX: data.focalX,
                                  focalY: data.focalY,
                                  zoom: data.zoom,
                                  aspectRatio: data.aspectRatio,
                                })),
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white hover:bg-[#D40000] text-[#0A0A0A] hover:text-white border border-[rgba(10,10,10,0.12)] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Crop className="w-3.5 h-3.5 text-[#D40000] group-hover:text-white" />
                        <span>Recrop / Reposition</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Key Metric Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. 4.8M Views, Sold Out in 4 Days"
                    value={editingProject.metrics || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, metrics: e.target.value })}
                    className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Year</label>
                  <input
                    type="text"
                    value={editingProject.year || "2025"}
                    onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={editingProject.visible !== false}
                    onChange={(e) => setEditingProject({ ...editingProject, visible: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D40000] focus:ring-[#D40000]"
                  />
                  <span>Publish live on website</span>
                </label>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t border-[rgba(10,10,10,0.08)]">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-5 py-2.5 rounded-full border border-[rgba(10,10,10,0.08)] bg-white hover:bg-[#FAF9F7] text-[#6B6B6B] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-white font-bold cursor-pointer shadow-md hover:brightness-105"
                  style={{
                    background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                  }}
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TEAM EDIT MODAL ================= */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 max-w-lg w-full border border-[rgba(10,10,10,0.08)] text-[#0A0A0A] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-[rgba(10,10,10,0.08)] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D40000]">Specialist Profile</span>
                <h3 className="text-xl font-black uppercase text-[#0A0A0A] mt-0.5">
                  {editingTeam.id ? "Edit Specialist" : "New Specialist"}
                </h3>
              </div>
              <button onClick={() => setEditingTeam(null)} className="p-2 rounded-full hover:bg-[#FAF9F7] text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveTeamMember} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Full Name</label>
                <input
                  required
                  type="text"
                  value={editingTeam.name || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Role / Title</label>
                <input
                  required
                  type="text"
                  value={editingTeam.role || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, role: e.target.value })}
                  placeholder="e.g. Creative Director, Cinematographer, Video Editor"
                  className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Bio</label>
                <textarea
                  required
                  rows={3}
                  value={editingTeam.bio || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, bio: e.target.value })}
                  placeholder="Specialist craft description..."
                  className="w-full p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#6B6B6B] uppercase font-bold">Photo URL</label>
                  <span className="text-[11px] font-mono text-[#D40000]">Ratio: 1:1</span>
                </div>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={editingTeam.avatar || ""}
                    onChange={(e) => setEditingTeam({ ...editingTeam, avatar: e.target.value })}
                    className="flex-1 h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                  <label className="h-13 px-5 rounded-xl bg-white hover:bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] cursor-pointer flex items-center gap-1.5 text-xs text-[#0A0A0A] font-bold shadow-2xs hover:border-[#D40000]/40 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#D40000]" />
                    <span>Upload & Crop</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelectForCrop(
                          e,
                          "1:1",
                          ["1:1"],
                          "Position Specialist Photo (1:1)",
                          (data) =>
                            setEditingTeam((prev) => ({
                              ...prev,
                              avatar: data.url || prev?.avatar,
                              focalX: data.focalX,
                              focalY: data.focalY,
                              zoom: data.zoom,
                            })),
                          editingTeam.focalX ?? 50,
                          editingTeam.focalY ?? 25,
                          editingTeam.zoom ?? 1
                        )
                      }
                    />
                  </label>
                </div>

                {/* Dropzone for Team */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) {
                      processImageFile(
                        dropped,
                        "1:1",
                        ["1:1"],
                        "Position Specialist Photo (1:1)",
                        (data) =>
                          setEditingTeam((prev) => ({
                            ...prev,
                            avatar: data.url || prev?.avatar,
                            focalX: data.focalX,
                            focalY: data.focalY,
                            zoom: data.zoom,
                          })),
                        editingTeam.focalX ?? 50,
                        editingTeam.focalY ?? 25,
                        editingTeam.zoom ?? 1
                      );
                    }
                  }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith("image/")) {
                        const pasted = items[i].getAsFile();
                        if (pasted) {
                          processImageFile(
                            pasted,
                            "1:1",
                            ["1:1"],
                            "Position Specialist Photo (1:1)",
                            (data) =>
                              setEditingTeam((prev) => ({
                                ...prev,
                                avatar: data.url || prev?.avatar,
                                focalX: data.focalX,
                                focalY: data.focalY,
                                zoom: data.zoom,
                              })),
                            editingTeam.focalX ?? 50,
                            editingTeam.focalY ?? 25,
                            editingTeam.zoom ?? 1
                          );
                          break;
                        }
                      }
                    }
                  }}
                  className="mt-2 p-2.5 rounded-xl border border-dashed border-[rgba(10,10,10,0.15)] bg-[#FAF9F7]/60 text-center text-[11px] font-mono text-[#6B6B6B] hover:border-[#D40000]/40 transition-colors cursor-pointer"
                >
                  Drag & drop photo here or paste (Ctrl+V)
                </div>

                {editingTeam.avatar && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.08)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#0A0A0A]">
                        Live Face Positioning (4:5 Aspect Ratio)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingTeam.avatar) {
                            setCropperState({
                              imageSrc: editingTeam.avatar,
                              initialAspectRatio: "4:5",
                              allowedRatios: ["4:5", "1:1"],
                              initialFocalX: editingTeam.focalX ?? 50,
                              initialFocalY: editingTeam.focalY ?? 22,
                              initialZoom: editingTeam.zoom ?? 1,
                              title: "Position Specialist Photo (4:5 & 1:1)",
                              onComplete: (data) =>
                                setEditingTeam((prev) => ({
                                  ...prev,
                                  focalX: data.focalX,
                                  focalY: data.focalY,
                                  zoom: data.zoom,
                                })),
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white hover:bg-[#D40000] text-[#0A0A0A] hover:text-white border border-[rgba(10,10,10,0.12)] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Crop className="w-3.5 h-3.5 text-[#D40000] group-hover:text-white" />
                        <span>Focal-Point Tool</span>
                      </button>
                    </div>

                    {/* Dual previews: Desktop Card & Mobile Card */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-[#6B6B6B] mb-1">Desktop Card (4:5)</div>
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[rgba(10,10,10,0.08)] bg-[#111]">
                          <Image
                            src={editingTeam.avatar}
                            alt="Desktop preview"
                            fill
                            sizes="200px"
                            style={{
                              objectFit: "cover",
                              objectPosition: `${editingTeam.focalX ?? 50}% ${editingTeam.focalY ?? 22}%`,
                              transform: (editingTeam.zoom ?? 1) > 1 ? `scale(${editingTeam.zoom})` : undefined,
                            }}
                            className="object-cover"
                            unoptimized={editingTeam.avatar.startsWith("data:")}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#6B6B6B] mb-1">Phone Card (390px viewport)</div>
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[rgba(10,10,10,0.08)] bg-[#111]">
                          <Image
                            src={editingTeam.avatar}
                            alt="Mobile preview"
                            fill
                            sizes="160px"
                            style={{
                              objectFit: "cover",
                              objectPosition: `${editingTeam.focalX ?? 50}% ${editingTeam.focalY ?? 22}%`,
                              transform: (editingTeam.zoom ?? 1) > 1 ? `scale(${editingTeam.zoom})` : undefined,
                            }}
                            className="object-cover"
                            unoptimized={editingTeam.avatar.startsWith("data:")}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[#6B6B6B]">
                      ✓ Default: 50% X / 22% Y keeps face in upper-third safe zone on all viewports.
                    </div>
                  </div>
                )}
              </div>

              {/* Instagram Only */}
              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">
                  Instagram Profile / Handle (Only social link shown)
                </label>
                <input
                  type="text"
                  value={editingTeam.instagram || ""}
                  onChange={(e) => setEditingTeam({ ...editingTeam, instagram: e.target.value })}
                  placeholder="@username or https://www.instagram.com/username"
                  className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
                <span className="text-[10px] font-mono text-[#6B6B6B] mt-1 block">
                  Only Instagram is displayed as a circle button. LinkedIn/X/YouTube have been retired.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={editingTeam.visible !== false}
                    onChange={(e) => setEditingTeam({ ...editingTeam, visible: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D40000] focus:ring-[#D40000]"
                  />
                  <span>Publish live on website</span>
                </label>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t border-[rgba(10,10,10,0.08)]">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-5 py-2.5 rounded-full border border-[rgba(10,10,10,0.08)] bg-white hover:bg-[#FAF9F7] text-[#6B6B6B] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-white font-bold cursor-pointer shadow-md hover:brightness-105"
                  style={{
                    background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                  }}
                >
                  Save Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TESTIMONIAL EDIT MODAL ================= */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 max-w-lg w-full border border-[rgba(10,10,10,0.08)] text-[#0A0A0A] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-[rgba(10,10,10,0.08)] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D40000]">Client Review</span>
                <h3 className="text-xl font-black uppercase text-[#0A0A0A] mt-0.5">
                  {editingTestimonial.id ? "Edit Testimonial" : "New Testimonial"}
                </h3>
              </div>
              <button onClick={() => setEditingTestimonial(null)} className="p-2 rounded-full hover:bg-[#FAF9F7] text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveTestimonial} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Client Name</label>
                  <input
                    required
                    type="text"
                    value={editingTestimonial.clientName || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, clientName: e.target.value })}
                    placeholder="e.g. Rohan Verma"
                    className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Company Name</label>
                  <input
                    required
                    type="text"
                    value={editingTestimonial.company || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })}
                    placeholder="e.g. Zomato Dining"
                    className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Role / Title</label>
                <input
                  required
                  type="text"
                  value={editingTestimonial.role || ""}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                  placeholder="e.g. Brand Marketing Lead"
                  className="w-full h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#6B6B6B] uppercase font-bold">Endorsement Quote (Max 280 chars)</label>
                  <span className={`text-[11px] font-mono font-bold ${
                    (editingTestimonial.content?.length || 0) > 280 ? "text-red-600" : "text-[#6B6B6B]"
                  }`}>
                    {editingTestimonial.content?.length || 0}/280
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={280}
                  value={editingTestimonial.content || ""}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                  placeholder="Client feedback on shoots, turnaround, or results..."
                  className="w-full p-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[#6B6B6B] mb-1.5 uppercase font-bold">Client Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: star })}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        (editingTestimonial.rating || 5) >= star
                          ? "bg-[#D40000] text-white border-[#D40000]"
                          : "bg-[#FAF9F7] text-[#6B6B6B] border-[rgba(10,10,10,0.12)] hover:border-[#D40000]"
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                  <span className="text-[11px] font-mono text-[#6B6B6B] ml-2">
                    {editingTestimonial.rating || 5} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#6B6B6B] uppercase font-bold">Avatar URL</label>
                  <span className="text-[11px] font-mono text-[#D40000]">Ratio: 1:1</span>
                </div>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={editingTestimonial.avatar || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar: e.target.value })}
                    className="flex-1 h-13 px-4 rounded-xl bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] text-[#0A0A0A] text-sm focus:outline-none focus:border-[#D40000]"
                  />
                  <label className="h-13 px-5 rounded-xl bg-white hover:bg-[#FAF9F7] border border-[rgba(10,10,10,0.12)] cursor-pointer flex items-center gap-1.5 text-xs text-[#0A0A0A] font-bold shadow-2xs hover:border-[#D40000]/40 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#D40000]" />
                    <span>Upload & Crop</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploading}
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelectForCrop(
                          e,
                          "1:1",
                          ["1:1"],
                          "Crop Client Avatar (1:1)",
                          (data) =>
                            setEditingTestimonial((prev) => ({
                              ...prev,
                              avatar: data.url || prev?.avatar,
                              focalX: data.focalX,
                              focalY: data.focalY,
                              zoom: data.zoom,
                            })),
                          editingTestimonial.focalX ?? 50,
                          editingTestimonial.focalY ?? 50,
                          editingTestimonial.zoom ?? 1
                        )
                      }
                    />
                  </label>
                </div>

                {/* Dropzone for Testimonial */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) {
                      processImageFile(
                        dropped,
                        "1:1",
                        ["1:1"],
                        "Crop Client Avatar (1:1)",
                        (data) =>
                          setEditingTestimonial((prev) => ({
                            ...prev,
                            avatar: data.url || prev?.avatar,
                            focalX: data.focalX,
                            focalY: data.focalY,
                            zoom: data.zoom,
                          })),
                        editingTestimonial.focalX ?? 50,
                        editingTestimonial.focalY ?? 50,
                        editingTestimonial.zoom ?? 1
                      );
                    }
                  }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith("image/")) {
                        const pasted = items[i].getAsFile();
                        if (pasted) {
                          processImageFile(
                            pasted,
                            "1:1",
                            ["1:1"],
                            "Crop Client Avatar (1:1)",
                            (data) =>
                              setEditingTestimonial((prev) => ({
                                ...prev,
                                avatar: data.url || prev?.avatar,
                                focalX: data.focalX,
                                focalY: data.focalY,
                                zoom: data.zoom,
                              })),
                            editingTestimonial.focalX ?? 50,
                            editingTestimonial.focalY ?? 50,
                            editingTestimonial.zoom ?? 1
                          );
                          break;
                        }
                      }
                    }
                  }}
                  className="mt-2 p-2.5 rounded-xl border border-dashed border-[rgba(10,10,10,0.15)] bg-[#FAF9F7]/60 text-center text-[11px] font-mono text-[#6B6B6B] hover:border-[#D40000]/40 transition-colors cursor-pointer"
                >
                  Drag & drop avatar here or paste (Ctrl+V)
                </div>

                {editingTestimonial.avatar && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[rgba(10,10,10,0.08)] bg-[#EAE8E4]">
                      <div
                        className="relative w-full h-full overflow-hidden rounded-full"
                        style={{
                          transform:
                            (editingTestimonial.zoom ?? 1) > 1
                              ? `scale(${editingTestimonial.zoom})`
                              : "none",
                          transformOrigin: `${editingTestimonial.focalX ?? 50}% ${editingTestimonial.focalY ?? 50}%`,
                        }}
                      >
                        <Image
                          src={editingTestimonial.avatar}
                          alt="Preview"
                          fill
                          sizes="64px"
                          style={{
                            objectFit: "cover",
                            objectPosition: `${editingTestimonial.focalX ?? 50}% ${editingTestimonial.focalY ?? 50}%`,
                          }}
                          className="object-cover"
                          unoptimized={editingTestimonial.avatar.startsWith("data:")}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-[#6B6B6B]">
                        ✓ 1:1 Avatar ({editingTestimonial.focalX ?? 50}% {editingTestimonial.focalY ?? 50}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingTestimonial.avatar) {
                            setCropperState({
                              imageSrc: editingTestimonial.avatar,
                              initialAspectRatio: "1:1",
                              allowedRatios: ["1:1"],
                              initialFocalX: editingTestimonial.focalX ?? 50,
                              initialFocalY: editingTestimonial.focalY ?? 50,
                              initialZoom: editingTestimonial.zoom ?? 1,
                              title: "Recrop Client Avatar (1:1)",
                              onComplete: (data) =>
                                setEditingTestimonial((prev) => ({
                                  ...prev,
                                  focalX: data.focalX,
                                  focalY: data.focalY,
                                  zoom: data.zoom,
                                })),
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-white hover:bg-[#D40000] text-[#0A0A0A] hover:text-white border border-[rgba(10,10,10,0.12)] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Crop className="w-3.5 h-3.5 text-[#D40000] group-hover:text-white" />
                        <span>Recrop</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold text-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={editingTestimonial.visible !== false}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, visible: e.target.checked })}
                    className="w-4 h-4 rounded text-[#D40000] focus:ring-[#D40000]"
                  />
                  <span>Publish live on website</span>
                </label>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t border-[rgba(10,10,10,0.08)]">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="px-5 py-2.5 rounded-full border border-[rgba(10,10,10,0.08)] bg-white hover:bg-[#FAF9F7] text-[#6B6B6B] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-white font-bold cursor-pointer shadow-md hover:brightness-105"
                  style={{
                    background: "linear-gradient(135deg, #FF5A4D 0%, #D40000 55%, #7A0000 100%)",
                  }}
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= IMAGE CROPPER MODAL ================= */}
      {cropperState && (
        <ImageCropperModal
          imageSrc={cropperState.imageSrc}
          initialAspectRatio={cropperState.initialAspectRatio || "4:3"}
          allowedRatios={cropperState.allowedRatios}
          initialFocalX={cropperState.initialFocalX ?? 50}
          initialFocalY={cropperState.initialFocalY ?? 50}
          initialZoom={cropperState.initialZoom ?? 1}
          title={cropperState.title}
          onCropComplete={(cropResult) => {
            cropperState.onComplete(cropResult);
            setCropperState(null);
          }}
          onCancel={() => setCropperState(null)}
        />
      )}
    </div>
  );
}

