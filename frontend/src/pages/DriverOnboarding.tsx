export default function DriverOnboarding() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="card rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-bold">Driver onboarding</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Verify Aadhaar", "Add driving license", "Add verified vehicle"].map((item, index) => (
            <div key={item} className="card p-5 shadow-none">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Step {index + 1}</p>
              <h3 className="mt-1 font-bold">{item}</h3>
              <p className="mt-1 text-sm text-muted">Required before listing intercity journeys.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
