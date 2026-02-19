"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-zinc-900">
      <form
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          setLoading(true);
          setError("");

          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
          });

          setLoading(false);

          if (!response.ok) {
            setError("Credenciales inválidas");
            return;
          }

          router.push("/admin");
          router.refresh();
        }}
      >
        <h1 className="text-2xl font-semibold">Ingreso de asesores</h1>
        <p className="mt-1 text-sm text-zinc-600">Acceso seguro para el equipo interno.</p>

        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
          />
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            type="password"
            name="password"
            placeholder="Contraseña"
            required
          />
        </div>

        <button disabled={loading} className="mt-4 w-full rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-60">
          {loading ? "..." : "Iniciar sesión"}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-4 text-xs text-zinc-500">Usuario inicial: admin@agencia.com / Admin12345!</p>
      </form>
    </div>
  );
}
