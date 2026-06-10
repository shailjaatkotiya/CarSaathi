import { Shield } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";

export default function VerificationPage() {
  const [aadhaar, setAadhaar] = useState("444455556666");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const { data } = await api.post("/profile/aadhaar", { aadhaar_number: aadhaar });
    setStatus(`Submitted ${data.masked_aadhaar}. Verification review is pending.`);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 pb-24 md:py-14">
      <div className="card rounded-3xl p-6 md:p-8">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Shield size={42} className="text-primary" />
          <h1 className="text-3xl font-bold">Aadhaar verification</h1>
          <p className="text-muted">
            Aadhaar is masked after submission. The backend stores encrypted and tokenized values only, then verification
            can be reviewed manually in the MVP.
          </p>
          <label>
            <span className="field-label">Aadhaar number</span>
            <input className="input" maxLength={16} value={aadhaar} onChange={(event) => setAadhaar(event.target.value)} />
          </label>
          <button className="btn-primary py-3 text-base" type="submit">
            Submit securely
          </button>
          {status && <p className="alert-success">{status}</p>}
        </form>
      </div>
    </div>
  );
}
