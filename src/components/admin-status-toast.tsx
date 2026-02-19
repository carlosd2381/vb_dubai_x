"use client";

type Props = {
  status?: string;
  message?: string;
};

export function AdminStatusToast({ status, message }: Props) {
  if (!status || !message) {
    return null;
  }

  const isError = status === "error";

  return (
    <div className="fixed right-4 top-4 z-70">
      <div className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
        {message}
      </div>
    </div>
  );
}
