import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { driverApi } from "../api/driver";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { queryKeys } from "../lib/queryKeys";
import { useSessionStore } from "../store/session";

export default function DriverOnboarding() {
  const token = useSessionStore((state) => state.token);

  const { data: me } = useCurrentUser();
  const { data: vehicles } = useQuery({
    queryKey: queryKeys.driver.vehicles,
    queryFn: driverApi.vehicles,
    enabled: Boolean(token)
  });

  const hasWhatsapp = Boolean(me?.whatsapp_number?.trim());
  const hasVehicle = Boolean(vehicles && vehicles.length > 0);
  const verified = me?.verification_status === "verified";

  const steps = [
    {
      done: hasWhatsapp,
      title: "Add your WhatsApp number",
      copy: "Passengers reach you on WhatsApp after a booking is confirmed.",
      cta: "Add in My Profile",
      to: "/profile"
    },
    {
      done: hasVehicle,
      title: "Add a verified vehicle",
      copy: "Add the car you will drive so passengers can compare before booking.",
      cta: "Add a vehicle",
      to: "/driver/vehicle"
    },
    {
      done: verified,
      title: "Verify your Govt. ID",
      copy: "Quick to do and inspires trust. Optional, but recommended.",
      cta: "Verify Aadhaar",
      to: "/verify"
    }
  ];

  const ready = hasWhatsapp && hasVehicle;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <div className="card rounded-3xl p-6 md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">Driver onboarding</h1>
        <p className="mt-1 text-sm text-muted">Finish these steps before you publish your first ride.</p>

        <div className="mt-6 flex flex-col gap-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                step.done ? "border-green-200 bg-green-50/40" : "border-sand bg-cream"
              }`}
            >
              <span className={`mt-0.5 shrink-0 ${step.done ? "text-green-600" : "text-muted"}`}>
                {step.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Step {index + 1}</p>
                <h3 className="mt-0.5 font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.copy}</p>
                {!step.done && (
                  <Link to={step.to} className="btn-outline mt-3 self-start text-sm">
                    {step.cta}
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/driver/create-ride"
          className={`btn-primary mt-6 w-full justify-center py-3 text-base ${ready ? "" : "pointer-events-none opacity-50"}`}
          aria-disabled={!ready}
        >
          Publish my first ride
          <ArrowRight size={18} />
        </Link>
        {!ready && <p className="mt-2 text-center text-xs text-muted">Add your WhatsApp number and a vehicle to continue.</p>}
      </div>
    </div>
  );
}
