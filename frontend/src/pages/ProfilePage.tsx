import { Car, Pencil, Phone, Save, Shield, Star, User as UserIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, User } from "../api/client";
import VerifiedBadge from "../components/VerifiedBadge";

type VerificationStatus = {
  status: "pending" | "verified" | "rejected";
  masked_aadhaar?: string;
  rejection_reason?: string;
};

type ProfileForm = {
  full_name: string;
  age: string;
  whatsapp_number: string;
  personal_car_brand: string;
  personal_car_model: string;
  personal_car_number: string;
  personal_car_fuel_type: string;
  personal_car_category: string;
  personal_car_seats: string;
};

const emptyForm: ProfileForm = {
  full_name: "",
  age: "",
  whatsapp_number: "",
  personal_car_brand: "",
  personal_car_model: "",
  personal_car_number: "",
  personal_car_fuel_type: "",
  personal_car_category: "",
  personal_car_seats: ""
};

function formFromUser(user?: User): ProfileForm {
  if (!user) return emptyForm;
  return {
    full_name: user.full_name || "",
    age: user.age ? String(user.age) : "",
    whatsapp_number: user.whatsapp_number || "",
    personal_car_brand: user.personal_car_brand || "",
    personal_car_model: user.personal_car_model || "",
    personal_car_number: user.personal_car_number || "",
    personal_car_fuel_type: user.personal_car_fuel_type || "",
    personal_car_category: user.personal_car_category || "",
    personal_car_seats: user.personal_car_seats ? String(user.personal_car_seats) : ""
  };
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

function optionalText(value: string) {
  return value.trim() ? value.trim() : null;
}

function DetailTile({ label, value, icon }: { label: string; value?: string | number | null; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-sand bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-bold text-muted">{label}</p>
      </div>
      <p className="mt-1.5 font-bold">{value || "Not added"}</p>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
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
        age: optionalNumber(form.age),
        whatsapp_number: optionalText(form.whatsapp_number),
        personal_car_brand: optionalText(form.personal_car_brand),
        personal_car_model: optionalText(form.personal_car_model),
        personal_car_number: optionalText(form.personal_car_number)?.toUpperCase() || null,
        personal_car_fuel_type: optionalText(form.personal_car_fuel_type),
        personal_car_category: optionalText(form.personal_car_category),
        personal_car_seats: optionalNumber(form.personal_car_seats)
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

  function cancelEdit() {
    setIsEditing(false);
    setError("");
    setMessage("");
    setForm(formFromUser(data));
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <p className="alert-info">Loading your profile...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <div className="flex flex-col gap-4">
          <p className="alert-warning">
            Please login to view and update your profile. Profile data is saved separately for each logged-in user.
          </p>
          <Link to="/auth" className="btn-primary self-start">
            Login to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="card overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-4">
              <span className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-primary text-3xl font-bold text-white">
                {data?.full_name?.slice(0, 1).toUpperCase() || "R"}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{data?.full_name || "My Profile"}</h1>
                  {data && <VerifiedBadge verified={data.verification_status === "verified"} />}
                </div>
                <p className="mt-1 text-muted">Carthi account</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <p className="flex items-center gap-2 text-sm text-muted">
                <Star size={16} />
                Rating {data?.rating_average || 0} from {data?.rating_count || 0} reviews
              </p>
              {!isEditing ? (
                <button type="button" className="btn-primary" onClick={() => setIsEditing(true)}>
                  <Pencil size={16} />
                  Edit profile
                </button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" className="btn-outline" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => updateProfile.mutate()}
                    disabled={updateProfile.isPending}
                  >
                    <Save size={16} />
                    Save profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && <p className="alert-success">{message}</p>}
        {error && <p className="alert-error">{error}</p>}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-5">
            <div className="card p-5 md:p-6">
              <h2 className="text-xl font-bold">User profile details</h2>
              <p className="mt-1.5 text-sm text-muted">
                Update your profile identity and WhatsApp contact. These values are saved against the logged-in user.
              </p>

              {isEditing ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="field-label">User name</span>
                    <input className="input" required value={form.full_name} onChange={(event) => setField("full_name", event.target.value)} />
                  </label>
                  <label>
                    <span className="field-label">Age</span>
                    <input className="input" type="number" min={18} max={100} value={form.age} onChange={(event) => setField("age", event.target.value)} />
                  </label>
                  <label>
                    <span className="field-label">WhatsApp contact</span>
                    <input className="input" value={form.whatsapp_number} onChange={(event) => setField("whatsapp_number", event.target.value)} />
                  </label>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <DetailTile label="User name" value={data?.full_name} icon={<UserIcon size={16} className="text-primary" />} />
                  <DetailTile label="Age" value={data?.age} icon={<UserIcon size={16} className="text-primary" />} />
                  <DetailTile label="WhatsApp contact" value={data?.whatsapp_number} icon={<Phone size={16} className="text-primary" />} />
                </div>
              )}
            </div>

            <div className="card p-5 md:p-6">
              <h2 className="text-xl font-bold">Personal car details optional</h2>
              <p className="mt-1.5 text-sm text-muted">
                Add a personal car reference for your profile. Driver ride vehicle details remain handled in the publish
                ride and vehicle flows.
              </p>

              {isEditing ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="field-label">Car brand optional</span>
                    <input className="input" value={form.personal_car_brand} onChange={(event) => setField("personal_car_brand", event.target.value)} placeholder="Honda, Hyundai, Maruti Suzuki" />
                  </label>
                  <label>
                    <span className="field-label">Car model optional</span>
                    <input className="input" value={form.personal_car_model} onChange={(event) => setField("personal_car_model", event.target.value)} placeholder="City, Aura, Dzire" />
                  </label>
                  <label>
                    <span className="field-label">Vehicle number optional</span>
                    <input className="input" value={form.personal_car_number} onChange={(event) => setField("personal_car_number", event.target.value)} placeholder="GJ01AB1234" />
                  </label>
                  <label>
                    <span className="field-label">Fuel type optional</span>
                    <select className="input" value={form.personal_car_fuel_type} onChange={(event) => setField("personal_car_fuel_type", event.target.value)}>
                      <option value="">Not added</option>
                      <option value="Petrol">Petrol</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">EV</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </label>
                  <label>
                    <span className="field-label">Car category optional</span>
                    <select className="input" value={form.personal_car_category} onChange={(event) => setField("personal_car_category", event.target.value)}>
                      <option value="">Not added</option>
                      <option value="Mini">Mini</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="7 Seater">7 Seater</option>
                    </select>
                  </label>
                  <label>
                    <span className="field-label">Seats optional</span>
                    <input className="input" type="number" min={1} max={8} value={form.personal_car_seats} onChange={(event) => setField("personal_car_seats", event.target.value)} />
                  </label>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <DetailTile label="Car" value={[data?.personal_car_brand, data?.personal_car_model].filter(Boolean).join(" ")} icon={<Car size={16} className="text-primary" />} />
                  <DetailTile label="Vehicle number" value={data?.personal_car_number} />
                  <DetailTile label="Fuel type" value={data?.personal_car_fuel_type} />
                  <DetailTile label="Category" value={data?.personal_car_category} />
                  <DetailTile label="Seats" value={data?.personal_car_seats} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2.5">
                <Shield size={22} className="text-primary" />
                <h2 className="text-xl font-bold">Verification details</h2>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <DetailTile label="Profile verification" value={data?.verification_status} />
                <DetailTile label="Aadhaar verification" value={verification?.status} />
                <DetailTile label="Masked Aadhaar" value={verification?.masked_aadhaar || "Not submitted"} />
                {verification?.rejection_reason && <p className="alert-error">{verification.rejection_reason}</p>}
              </div>
              <hr className="my-5 border-sand" />
              <span className={data?.verification_status === "verified" ? "chip-solid" : "chip-outline"}>
                {data?.verification_status === "verified" ? "Verified profile" : "Verification pending"}
              </span>
            </div>

            <Link to="/my-rides" className="card block p-5 shadow-none transition hover:-translate-y-0.5 hover:border-primary">
              <Car size={22} className="text-primary" />
              <h3 className="mt-2 font-bold">Published Rides</h3>
              <p className="mt-1.5 text-sm text-muted">Published rides with all passengers who booked each ride.</p>
            </Link>

            <Link to="/profile/passenger" className="card block p-5 shadow-none transition hover:-translate-y-0.5 hover:border-primary">
              <UserIcon size={22} className="text-primary" />
              <h3 className="mt-2 font-bold">Booked Rides</h3>
              <p className="mt-1.5 text-sm text-muted">Booked unfinished rides for this passenger account.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
