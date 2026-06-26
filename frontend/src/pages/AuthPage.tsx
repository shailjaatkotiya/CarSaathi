import { useQueryClient } from "@tanstack/react-query";
import { Car, KeyRound, MessageSquare, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { carBrands } from "../data/carBrands";
import { apiErrorMessage } from "../lib/apiError";
import { queryKeys } from "../lib/queryKeys";
import { useSessionStore } from "../store/session";
import type { UserRole, VehiclePayload } from "../types";

const vehicleCategories = [
  { value: "Sedan", hint: "3 passenger seats" },
  { value: "SUV", hint: "3 passenger seats" },
  { value: "7 Seater", hint: "6 passenger seats" }
];

function homeForRole(role: UserRole) {
  if (role === "admin") return "/admin";
  // Drivers and passengers land on the home page, which shows the
  // role-specific workflow and primary actions.
  return "/";
}

function roleFromQuery(value: string | null): UserRole {
  return value === "driver" || value === "admin" || value === "passenger" ? value : "passenger";
}

function defaultsForRole(_role: UserRole) {
  // Keep inputs empty so users see placeholders, not pre-filled demo values.
  return { email: "", username: "", fullName: "" };
}

function defaultPassengerSeats(carType: string) {
  return carType.toLowerCase().includes("7") ? 6 : 3;
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const requiredRole = roleFromQuery(searchParams.get("role"));
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [selectedRole, setSelectedRole] = useState<UserRole>(requiredRole);
  const defaults = defaultsForRole(selectedRole);
  const [email, setEmail] = useState(defaults.email);
  const [username, setUsername] = useState(defaults.username);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(defaults.fullName);
  const [gender, setGender] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showVehicleForm, setShowVehicleForm] = useState(requiredRole === "driver");
  const [vehicleBrand, setVehicleBrand] = useState("Maruti Suzuki");
  const [customVehicleBrand, setCustomVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [carType, setCarType] = useState("Sedan");
  const [carColor, setCarColor] = useState("White");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = useSessionStore((state) => state.token);
  const setToken = useSessionStore((state) => state.setToken);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const from = (location.state as { from?: string } | null)?.from || null;
  const hasRequiredRole = Boolean(searchParams.get("role"));

  useEffect(() => {
    const nextDefaults = defaultsForRole(selectedRole);
    setEmail(nextDefaults.email);
    setUsername(nextDefaults.username);
    setFullName(nextDefaults.fullName);
    if (selectedRole !== "driver") {
      setShowVehicleForm(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (!token) return;
    authApi
      .me()
      .then((user) => {
        if (user.role === requiredRole || !hasRequiredRole) {
          navigate(from || homeForRole(user.role), { replace: true });
        }
      })
      .catch(() => {
        /* invalid token handled by interceptor */
      });
  }, [from, hasRequiredRole, navigate, requiredRole, token]);

  function chooseCarType(value: string) {
    setCarType(value);
  }

  function buildVehicle(): VehiclePayload | null {
    if (selectedRole !== "driver" || !showVehicleForm) return null;
    const resolvedBrand = vehicleBrand === "Other" ? customVehicleBrand.trim() : vehicleBrand;
    return {
      brand: resolvedBrand,
      model: vehicleModel.trim(),
      vehicle_number: vehicleNumber.trim(),
      fuel_type: fuelType,
      car_type: carType,
      color: carColor.trim() || "White",
      seats: defaultPassengerSeats(carType),
      photo_urls: []
    };
  }

  async function finishLogin(accessToken: string) {
    setToken(accessToken);
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    const me = await authApi.me();
    setMessage("Logged in successfully.");
    const canReturnToRequestedPage = from && (!hasRequiredRole || me.role === requiredRole);
    navigate(canReturnToRequestedPage ? from : homeForRole(me.role), { replace: true });
  }

  async function sendOtp() {
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await authApi.sendOtp({ mobile_number: mobileNumber.trim() });
      setMessage(response.message || "OTP sent. Check your mobile.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login" && loginMethod === "otp") {
        const data = await authApi.verifyOtp({
          mobile_number: mobileNumber.trim(),
          otp: otp.trim()
        });
        await finishLogin(data.access_token);
        return;
      }

      const data =
        mode === "login"
          ? await authApi.login({ username: username.trim(), password: password.trim() })
          : await authApi.register({
              full_name: fullName.trim(),
              gender: gender.trim(),
              mobile_number: mobileNumber.trim(),
              email: email.trim().toLowerCase(),
              username: fullName.trim(),
              password: password.trim(),
              whatsapp_number: mobileNumber.trim(),
              role: selectedRole,
              vehicle: buildVehicle()
            });
      await finishLogin(data.access_token);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="card rounded-3xl p-5 md:p-8">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {mode === "login" ? "Login to your account" : `Create ${selectedRole} account`}
            </h1>
            <p className="mt-2 text-sm text-muted md:text-base">
              {mode === "login"
                ? "Use username and password, or sign in quickly with an OTP sent to your mobile number."
                : selectedRole === "driver"
                  ? "Register with your details and add a car now or skip it for later."
                  : "Register with your details. Your own passenger profile is saved automatically."}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-full bg-sand-light p-1">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                  mode === value ? "bg-primary text-white" : "text-muted hover:text-ink"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {mode === "login" && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`btn ${loginMethod === "password" ? "bg-primary text-white" : "border border-sand bg-cream text-ink"}`}
              >
                <KeyRound size={16} />
                Username
              </button>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted">
                <span className="h-px flex-1 bg-sand" />
                or
                <span className="h-px flex-1 bg-sand" />
              </div>
              <button
                type="button"
                onClick={() => setLoginMethod("otp")}
                className={`btn ${loginMethod === "otp" ? "bg-primary text-white" : "border border-sand bg-cream text-ink"}`}
              >
                <MessageSquare size={16} />
                OTP
              </button>
            </div>
          )}

          {mode === "register" && (
            <>
              <select
                className="input"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as UserRole)}
              >
                <option value="passenger">Register as Passenger</option>
                <option value="driver">Register as Driver</option>
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required />
                <select className="input" value={gender} onChange={(event) => setGender(event.target.value)} required>
                  <option value="">Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </>
          )}

          {(mode === "register" || loginMethod === "otp") && (
            <div className={mode === "login" ? "grid gap-3 sm:grid-cols-[1fr_auto]" : ""}>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                pattern="(\+91|91|0)?[6-9][0-9]{9}"
                title="Enter a valid 10-digit Indian mobile number"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
                placeholder="Mobile number"
                required
              />
              {mode === "login" && loginMethod === "otp" && (
                <button className="btn-outline whitespace-nowrap px-5" type="button" onClick={sendOtp} disabled={isSubmitting || !mobileNumber.trim()}>
                  Send OTP
                </button>
              )}
            </div>
          )}

          {mode === "login" && loginMethod === "otp" ? (
            <input className="input" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter OTP" required />
          ) : (
            <>
              {mode === "login" && (
                <input
                  className="input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username or mobile number"
                  required
                />
              )}
              {mode === "register" && <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />}
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
            </>
          )}

          {mode === "register" && selectedRole === "driver" && (
            <div className="rounded-2xl border border-sand bg-cream p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 font-bold">
                    <Car size={16} />
                    Add car while registering
                  </p>
                  <p className="mt-1 text-sm text-muted">Skip now if you want to add it from profile later.</p>
                </div>
                <button type="button" className="btn-outline" onClick={() => setShowVehicleForm((value) => !value)}>
                  {showVehicleForm ? "Skip car" : "Add car"}
                </button>
              </div>

              {showVehicleForm && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <select className="input" value={vehicleBrand} onChange={(event) => setVehicleBrand(event.target.value)} required={showVehicleForm}>
                      {carBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {vehicleBrand === "Other" && (
                      <input
                        className="input mt-2"
                        value={customVehicleBrand}
                        onChange={(event) => setCustomVehicleBrand(event.target.value)}
                        placeholder="Brand name"
                        required={showVehicleForm}
                      />
                    )}
                  </div>
                  <input className="input" value={vehicleModel} onChange={(event) => setVehicleModel(event.target.value)} placeholder="Model" required={showVehicleForm} />
                  <input
                    className="input"
                    value={vehicleNumber}
                    onChange={(event) => setVehicleNumber(event.target.value)}
                    placeholder="Vehicle number"
                    required={showVehicleForm}
                  />
                  <select className="input" value={fuelType} onChange={(event) => setFuelType(event.target.value)} required={showVehicleForm}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="EV">EV</option>
                  </select>
                  <input className="input" value={carColor} onChange={(event) => setCarColor(event.target.value)} placeholder="Car color" required={showVehicleForm} />
                  <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
                    {vehicleCategories.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => chooseCarType(item.value)}
                        className={`rounded-xl border p-3 text-left transition ${
                          carType === item.value ? "border-primary bg-primary text-white" : "border-sand bg-white text-ink hover:border-primary"
                        }`}
                      >
                        <p className="font-bold">{item.value}</p>
                        <p className="text-xs">{item.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button className="btn-primary py-3 text-base" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "login" && loginMethod === "otp" ? "Verify OTP" : "Continue"}
          </button>
          {message && <p className="alert-success">{message}</p>}
          {error && <p className="alert-error">{error}</p>}

          {mode === "register" && (
            <p className="inline-flex items-start gap-2 text-sm text-muted">
              <UserRound size={16} className="mt-0.5 shrink-0" />
              Passenger signup saves you as the default passenger. Driver signup can save a vehicle immediately or later.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
