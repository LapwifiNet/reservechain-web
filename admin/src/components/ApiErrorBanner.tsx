export function ApiErrorBanner({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm">
      <div className="font-medium text-danger">Backend unreachable</div>
      <div className="mt-1 text-text-2">
        Could not reach the API ({error}). Start the P5 backend and set{" "}
        <code className="text-text">API_BASE_URL</code> in{" "}
        <code className="text-text">.env</code>. Showing empty state below.
      </div>
    </div>
  );
}
