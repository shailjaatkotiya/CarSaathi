import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
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
  email: string;
  age: string;
  mobile_number: string;
  whatsapp_number: string;
  emergency_contact: string;
  personal_car_brand: string;
  personal_car_model: string;
  personal_car_number: string;
  personal_car_fuel_type: string;
  personal_car_category: string;
  personal_car_seats: string;
};

const emptyForm: ProfileForm = {
  full_name: "",
  email: "",
  age: "",
  mobile_number: "",
  whatsapp_number: "",
  emergency_contact: "",
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
    email: user.email || "",
    age: user.age ? String(user.age) : "",
    mobile_number: user.mobile_number || "",
    whatsapp_number: user.whatsapp_number || "",
    emergency_contact: user.emergency_contact || "",
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
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {icon}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.75, fontWeight: 800 }}>{value || "Not added"}</Typography>
    </Box>
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
        email: form.email.trim(),
        age: optionalNumber(form.age),
        mobile_number: optionalText(form.mobile_number),
        whatsapp_number: optionalText(form.whatsapp_number),
        emergency_contact: optionalText(form.emergency_contact),
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
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
        <Alert severity="info">Loading your profile...</Alert>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
        <Stack spacing={2}>
          <Alert severity="warning">
            Please login to view and update your profile. Profile data is saved separately for each logged-in user.
          </Alert>
          <Button component={Link} to="/auth" variant="contained" sx={{ alignSelf: "flex-start" }}>
            Login to continue
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Stack spacing={2.5}>
        <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ justifyContent: "space-between" }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontSize: 28,
                    fontWeight: 900
                  }}
                >
                  {data?.full_name?.slice(0, 1).toUpperCase() || "R"}
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="h4">{data?.full_name || "My Profile"}</Typography>
                    {data && <VerifiedBadge verified={data.verification_status === "verified"} />}
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {data?.role ? `${data.role} account` : "RideSaathi account"}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.25} sx={{ alignItems: { xs: "stretch", md: "flex-end" } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
                  <StarRoundedIcon fontSize="small" />
                  <Typography variant="body2">
                    Rating {data?.rating_average || 0} from {data?.rating_count || 0} reviews
                  </Typography>
                </Stack>
                {!isEditing ? (
                  <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={() => setIsEditing(true)}>
                    Edit profile
                  </Button>
                ) : (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="outlined" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                      Save profile
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" }, gap: 2.5 }}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
                <Typography variant="h5">User profile details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Update your account identity and contact details. These values are saved against the logged-in user.
                </Typography>

                {isEditing ? (
                  <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
                    <TextField required label="User name" value={form.full_name} onChange={(event) => setField("full_name", event.target.value)} />
                    <TextField label="Age" type="number" value={form.age} onChange={(event) => setField("age", event.target.value)} slotProps={{ htmlInput: { min: 18, max: 100 } }} />
                    <TextField required label="Email" value={form.email} onChange={(event) => setField("email", event.target.value)} />
                    <TextField label="Phone no" value={form.mobile_number} onChange={(event) => setField("mobile_number", event.target.value)} />
                    <TextField label="WhatsApp no" value={form.whatsapp_number} onChange={(event) => setField("whatsapp_number", event.target.value)} />
                    <TextField label="Emergency contact" value={form.emergency_contact} onChange={(event) => setField("emergency_contact", event.target.value)} />
                  </Box>
                ) : (
                  <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
                    <DetailTile label="User name" value={data?.full_name} icon={<PersonRoundedIcon color="primary" fontSize="small" />} />
                    <DetailTile label="Age" value={data?.age} icon={<PersonRoundedIcon color="primary" fontSize="small" />} />
                    <DetailTile label="Email" value={data?.email} icon={<EmailRoundedIcon color="primary" fontSize="small" />} />
                    <DetailTile label="Phone no" value={data?.mobile_number} icon={<PhoneRoundedIcon color="primary" fontSize="small" />} />
                    <DetailTile label="WhatsApp no" value={data?.whatsapp_number} icon={<PhoneRoundedIcon color="primary" fontSize="small" />} />
                    <DetailTile label="Emergency contact" value={data?.emergency_contact} icon={<PhoneRoundedIcon color="primary" fontSize="small" />} />
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
                <Typography variant="h5">Personal car details optional</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Add a personal car reference for your profile. Driver ride vehicle details remain handled in the publish ride and vehicle flows.
                </Typography>

                {isEditing ? (
                  <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
                    <TextField label="Car brand optional" value={form.personal_car_brand} onChange={(event) => setField("personal_car_brand", event.target.value)} placeholder="Honda, Hyundai, Maruti Suzuki" />
                    <TextField label="Car model optional" value={form.personal_car_model} onChange={(event) => setField("personal_car_model", event.target.value)} placeholder="City, Aura, Dzire" />
                    <TextField label="Vehicle number optional" value={form.personal_car_number} onChange={(event) => setField("personal_car_number", event.target.value)} placeholder="GJ01AB1234" />
                    <TextField label="Fuel type optional" select value={form.personal_car_fuel_type} onChange={(event) => setField("personal_car_fuel_type", event.target.value)}>
                      <MenuItem value="">Not added</MenuItem>
                      <MenuItem value="Petrol">Petrol</MenuItem>
                      <MenuItem value="CNG">CNG</MenuItem>
                      <MenuItem value="EV">EV</MenuItem>
                      <MenuItem value="Diesel">Diesel</MenuItem>
                    </TextField>
                    <TextField label="Car category optional" select value={form.personal_car_category} onChange={(event) => setField("personal_car_category", event.target.value)}>
                      <MenuItem value="">Not added</MenuItem>
                      <MenuItem value="Mini">Mini</MenuItem>
                      <MenuItem value="Sedan">Sedan</MenuItem>
                      <MenuItem value="SUV">SUV</MenuItem>
                      <MenuItem value="7 Seater">7 Seater</MenuItem>
                    </TextField>
                    <TextField label="Seats optional" type="number" value={form.personal_car_seats} onChange={(event) => setField("personal_car_seats", event.target.value)} slotProps={{ htmlInput: { min: 1, max: 8 } }} />
                  </Box>
                ) : (
                  <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.5 }}>
                    <DetailTile label="Car" value={[data?.personal_car_brand, data?.personal_car_model].filter(Boolean).join(" ")} icon={<DirectionsCarRoundedIcon color="primary" fontSize="small" />} />
                    <DetailTile label="Vehicle number" value={data?.personal_car_number} />
                    <DetailTile label="Fuel type" value={data?.personal_car_fuel_type} />
                    <DetailTile label="Category" value={data?.personal_car_category} />
                    <DetailTile label="Seats" value={data?.personal_car_seats} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={2.5}>
            <Card>
              <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <ShieldRoundedIcon color="primary" />
                  <Typography variant="h5">Verification details</Typography>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                  <DetailTile label="Profile verification" value={data?.verification_status} />
                  <DetailTile label="Aadhaar verification" value={verification?.status} />
                  <DetailTile label="Masked Aadhaar" value={verification?.masked_aadhaar || "Not submitted"} />
                  <DetailTile label="Account role" value={data?.role} icon={<VerifiedUserRoundedIcon color="primary" fontSize="small" />} />
                  {verification?.rejection_reason && <Alert severity="error">{verification.rejection_reason}</Alert>}
                </Stack>
                <Divider sx={{ my: 2.5 }} />
                <Chip
                  color={data?.verification_status === "verified" ? "primary" : "warning"}
                  label={data?.verification_status === "verified" ? "Ride listing and booking enabled" : "Verification pending"}
                />
              </CardContent>
            </Card>

            <Card component={Link} to="/profile/driver" variant="outlined" sx={{ transition: "160ms ease", "&:hover": { transform: "translateY(-2px)", borderColor: "primary.main" } }}>
              <CardContent>
                <DirectionsCarRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Driver Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Passenger details section for rides published by the driver.
                </Typography>
              </CardContent>
            </Card>

            <Card component={Link} to="/profile/passenger" variant="outlined" sx={{ transition: "160ms ease", "&:hover": { transform: "translateY(-2px)", borderColor: "primary.main" } }}>
              <CardContent>
                <PersonRoundedIcon color="primary" />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Passenger Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Booked unfinished rides for the passenger.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
