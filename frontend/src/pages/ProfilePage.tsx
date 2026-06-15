import {
  Car,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Star,
  User as UserIcon,
  Wallet,
  X
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";
import VerifiedBadge from "../components/VerifiedBadge";

type VerificationStatus = {
  status: "pending" | "verified" | "rejected";
  masked_aadhaar?: string;
  rejection_reason?: string;
};

type ProfileForm = {
  full_name: string;
  whatsapp_number: string;
};

const emptyForm: ProfileForm = {
  full_name: "",
  whatsapp_number: ""
};

function formFromUser(user?: User): ProfileForm {
  if (!user) return emptyForm;
  return {
    full_name: user.full_name || "",
    whatsapp_number: user.whatsapp_number || ""
  };
}

function optionalText(value: string) {
  return value.trim() ? value.trim() : null;
}

function SettingsRow({
  icon,
  label,
  sublabel,
  to,
  onClick,
  danger = false
}: {
  icon?: ReactNode;
  label: string;
  sublabel?: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const cls = `flex items-center gap-3 w-full px-4 py-3.5 text-left transition hover:bg-sand-light ${danger ? "text-red-600" : "text-ink"}`;
  const inner = (
    <>
      {icon && <span className={`shrink-0 ${danger ? "text-red-500" : "text-muted"}`}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {sublabel && <span className="block text-xs text-muted mt-0.5">{sublabel}</span>}
      </span>
      {!danger && <ChevronRight size={16} className="shrink-0 text-muted" />}
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" className={cls} onClick={onClick}>{inner}</button>;
}

function SettingsGroup({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-hidden divide-y divide-sand-light">
      {children}
    </div>
  );
}


export default function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useSessionStore((state) => state.logout);
  const [tab, setTab] = useState<"about" | "account">("about");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data, isError, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data
  });

  const { data: verification } = useQuery({
    queryKey: ["profile-verification"],
    queryFn: async () => (await api.get<VerificationStatus>("/profile/verification-status")).data,
    enabled: Boolean(data)
  });

  useEffect(() => {
    if (data && !isEditing) {
      setForm(formFromUser(data));
    }
  }, [data, isEditing]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        whatsapp_number: optionalText(form.whatsapp_number)
      };
      return (await api.put<User>("/profile", payload)).data;
    },
    onSuccess: async (updatedUser) => {
      setMessage("Profile updated successfully.");
      setError("");
      setIsEditing(false);
      setForm(formFromUser(updatedUser));
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not update profile. Please check the fields and try again.");
      setMessage("");
    }
  });

  function setField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      queryClient.clear();
      navigate("/auth", { replace: true });
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    setError("");
    setMessage("");
    setForm(formFromUser(data));
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <p className="alert-info">Loading your profile...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <div className="flex flex-col gap-4">
          <p className="alert-warning">Please login to view your profile.</p>
          <Link to="/auth" className="btn-primary self-start">Login to continue</Link>
        </div>
      </div>
    );
  }

  const isDriver = data.role === "driver";
  const phoneVerified = Boolean(data.whatsapp_number);
  const emailVerified = false; // not in current API
  const govtIdVerified = verification?.status === "verified";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-0">
      {/* Tab bar */}
      <div className="sticky top-16 z-30 flex border-b border-sand bg-cream/95 backdrop-blur">
        {(["about", "account"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold capitalize transition ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-ink"
            }`}
          >
            {t === "about" ? "About you" : "Account"}
          </button>
        ))}
      </div>

      <div className="py-4 flex flex-col gap-4">
        {message && <p className="alert-success">{message}</p>}
        {error && <p className="alert-error">{error}</p>}

        {/* ─── ABOUT YOU TAB ─── */}
        {tab === "about" && (
          <>
            {/* Profile header card */}
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-2xl font-bold text-white">
                    {data.full_name?.slice(0, 1).toUpperCase() || "?"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold">{data.full_name || "My Profile"}</h1>
                    <VerifiedBadge verified={data.verification_status === "verified"} />
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {isDriver ? "Driver" : "Newcomer"}
                    {isDriver && data.rating_count > 0 && ` · ${data.rating_average} ★ (${data.rating_count})`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 btn-outline px-3 py-2 text-xs"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>


            {/* Edit personal details (inline) */}
            {isEditing ? (
              <div className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Edit personal details</h2>
                  <button type="button" onClick={cancelEdit} className="text-muted hover:text-ink">
                    <X size={18} />
                  </button>
                </div>
                <label>
                  <span className="field-label">Name</span>
                  <input className="input" required value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
                </label>
                <label>
                  <span className="field-label">WhatsApp number</span>
                  <input className="input" value={form.whatsapp_number} onChange={(e) => setField("whatsapp_number", e.target.value)} placeholder="+91 98765 43210" />
                </label>
                <div className="flex gap-2 pt-1">
                  <button type="button" className="btn-outline flex-1" onClick={cancelEdit}>Cancel</button>
                  <button type="button" className="btn-primary flex-1" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                    <Save size={16} />
                    {updateProfile.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <SettingsGroup>
                <SettingsRow icon={<Pencil size={16} />} label="Edit personal details" onClick={() => setIsEditing(true)} />
              </SettingsGroup>
            )}

            {/* Verify your profile */}
            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Verify your profile</h2>
              <SettingsGroup>
                <SettingsRow
                  icon={govtIdVerified ? <ShieldCheck size={16} className="text-green-600" /> : <Plus size={16} />}
                  label="Verify your Govt. ID"
                  sublabel={govtIdVerified ? `Aadhaar ****${verification?.masked_aadhaar?.slice(-4) || ""}` : "Quick to do and inspires trust"}
                  to="/verify"
                />
                <SettingsRow
                  icon={emailVerified ? <ShieldCheck size={16} className="text-green-600" /> : <Plus size={16} />}
                  label={`Confirm email ${data.email}`}
                  sublabel={emailVerified ? "Email verified" : "Verify your email address"}
                  onClick={() => {}}
                />
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="shrink-0 text-muted">
                    {phoneVerified ? <ShieldCheck size={16} className="text-green-600" /> : <Phone size={16} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold">{data.whatsapp_number || "Add phone number"}</span>
                    {phoneVerified && <span className="block text-xs text-muted mt-0.5">Phone number added</span>}
                  </span>
                  {phoneVerified && <Shield size={16} className="shrink-0 text-green-600" />}
                </div>
              </SettingsGroup>
            </div>

            {/* About you */}
            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">About you</h2>
              <SettingsGroup>
                <SettingsRow icon={<Plus size={16} />} label="Add a mini bio" onClick={() => {}} />
                <SettingsRow icon={<Plus size={16} />} label="Edit travel preferences" onClick={() => {}} />
              </SettingsGroup>
            </div>

            {/* Vehicles */}
            {isDriver && (
              <div>
                <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Vehicles</h2>
                <SettingsGroup>
                  <SettingsRow icon={<Plus size={16} />} label="Add a vehicle" to="/driver/vehicle" />
                </SettingsGroup>
              </div>
            )}

            {/* Ratings (driver) */}
            {isDriver && (
              <div>
                <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Reviews</h2>
                <SettingsGroup>
                  <div className="px-4 py-3.5 flex items-center gap-3">
                    <Star size={16} className="text-muted shrink-0" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">Rating</span>
                      <span className="block text-xs text-muted">{data.rating_average || 0} ★ from {data.rating_count || 0} reviews</span>
                    </span>
                  </div>
                </SettingsGroup>
              </div>
            )}

            {/* My rides */}
            {isDriver && (
              <SettingsGroup>
                <SettingsRow icon={<Car size={16} />} label="My published rides" to="/my-rides" />
              </SettingsGroup>
            )}
          </>
        )}

        {/* ─── ACCOUNT TAB ─── */}
        {tab === "account" && (
          <>
            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Profile</h2>
              <SettingsGroup>
                <SettingsRow icon={<Star size={16} />} label="Ratings" sublabel={`${data.rating_average || 0} ★ (${data.rating_count || 0} reviews)`} onClick={() => {}} />
                <SettingsRow icon={<UserIcon size={16} />} label="Saved passengers" onClick={() => {}} />
              </SettingsGroup>
            </div>

            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Preferences</h2>
              <SettingsGroup>
                <SettingsRow icon={<Mail size={16} />} label="Communication preferences" onClick={() => {}} />
              </SettingsGroup>
            </div>

            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Security</h2>
              <SettingsGroup>
                <SettingsRow icon={<Lock size={16} />} label="Password" onClick={() => {}} />
                <SettingsRow icon={<MapPin size={16} />} label="Postal address" onClick={() => {}} />
              </SettingsGroup>
            </div>

            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Payments</h2>
              <SettingsGroup>
                <SettingsRow icon={<Wallet size={16} />} label="Payout methods" onClick={() => {}} />
                <SettingsRow icon={<Wallet size={16} />} label="Payouts" onClick={() => {}} />
                <SettingsRow icon={<CreditCard size={16} />} label="Payment methods" onClick={() => {}} />
                <SettingsRow icon={<CreditCard size={16} />} label="Payments & refunds" onClick={() => {}} />
              </SettingsGroup>
            </div>

            <div>
              <h2 className="text-xs font-bold text-muted uppercase tracking-wide px-1 mb-2">Support</h2>
              <SettingsGroup>
                <SettingsRow icon={<HelpCircle size={16} />} label="Help" onClick={() => {}} />
                <SettingsRow icon={<FileText size={16} />} label="Terms and Conditions" onClick={() => {}} />
                <SettingsRow icon={<Shield size={16} />} label="Data protection" onClick={() => {}} />
              </SettingsGroup>
            </div>

            <SettingsGroup>
              <SettingsRow icon={<LogOut size={16} />} label="Log out" onClick={handleLogout} danger />
              <SettingsRow label="Close my account" onClick={() => {}} danger />
            </SettingsGroup>
          </>
        )}
      </div>
    </div>
  );
}
