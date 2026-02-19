"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TourRow = {
  id: string;
  name: string;
  shortDescription: string | null;
  summary: string;
  continent: string;
  country: string;
  city: string;
  durationDays: number;
  price: string;
  isActive: boolean;
  deletedAt: string | Date | null;
};

type Props = {
  tours: TourRow[];
  selectedTourId?: string;
  deleteConfirmId?: string;
  isEn: boolean;
  adminLang: "es" | "en";
  query?: string;
  countryFilter?: string;
  tourStatus?: string;
};

export function AdminToursTable({
  tours,
  selectedTourId,
  deleteConfirmId,
  query,
  countryFilter,
  tourStatus,
}: Props) {
  const [rows, setRows] = useState<TourRow[]>(tours);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderingTourId, setReorderingTourId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setRows(tours);
  }, [tours]);

  const baseQuery = useMemo(
    () => ({
      tab: "tours",
      q: query || undefined,
      country: countryFilter || undefined,
      tourStatus: tourStatus || undefined,
    }),
    [countryFilter, query, tourStatus],
  );

  const adminTourHref = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ ...baseQuery, ...extra }).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    return `/admin/site?${params.toString()}`;
  };

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId || isReordering) {
      setDropTargetId(null);
      return;
    }

    setIsReordering(true);
    setReorderingTourId(draggingId);
    const previous = rows;
    const next = [...rows];
    const fromIndex = next.findIndex((row) => row.id === draggingId);
    const toIndex = next.findIndex((row) => row.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      setIsReordering(false);
      return;
    }

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setRows(next);

    try {
      const response = await fetch("/api/admin/tours/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ movedId: draggingId, targetId }),
      });

      if (!response.ok) {
        setRows(previous);
        setMessage({ kind: "error", text: "No se pudo reordenar." });
        return;
      }
      setMessage({ kind: "ok", text: "Orden actualizado." });
    } catch {
      setRows(previous);
      setMessage({ kind: "error", text: "No se pudo reordenar." });
    } finally {
      setDraggingId(null);
      setDropTargetId(null);
      setIsReordering(false);
      setReorderingTourId(null);
    }
  }

  async function updateTourState(payload: { action: "archive" | "restore" | "toggleActive"; tourId: string; isActive?: boolean }, successStatus: string) {
    const previous = rows;

    setPendingIds((current) => [...current, payload.tourId]);

    if (payload.action === "archive") {
      setRows((current) => current.map((row) => (row.id === payload.tourId ? { ...row, deletedAt: new Date().toISOString() } : row)));
    }

    if (payload.action === "restore") {
      setRows((current) => current.map((row) => (row.id === payload.tourId ? { ...row, deletedAt: null } : row)));
    }

    if (payload.action === "toggleActive") {
      setRows((current) => current.map((row) => (row.id === payload.tourId ? { ...row, isActive: Boolean(payload.isActive) } : row)));
    }

    try {
      const response = await fetch("/api/admin/tours/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setRows(previous);
        setMessage({ kind: "error", text: "No se pudo actualizar el tour." });
        return;
      }

      const successText =
        successStatus === "tour-archived"
          ? "Tour archivado."
          : successStatus === "tour-restored"
            ? "Tour restaurado."
            : "Estado actualizado.";
      setMessage({ kind: "ok", text: successText });
    } catch {
      setRows(previous);
      setMessage({ kind: "error", text: "No se pudo actualizar el tour." });
    } finally {
      setPendingIds((current) => current.filter((id) => id !== payload.tourId));
    }
  }

  return (
    <div className="space-y-2">
      {message && (
        <p className={`rounded-md px-3 py-2 text-xs ${message.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Orden</th>
            <th className="px-3 py-2">Tour</th>
            <th className="px-3 py-2">Ubicación</th>
            <th className="px-3 py-2">Duración</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {rows.map((tour) => {
            const isArchived = Boolean(tour.deletedAt);
            const isPending = pendingIds.includes(tour.id);

            return (
              <tr
                key={tour.id}
                draggable={!isArchived && !isReordering && !isPending}
                onDragStart={() => setDraggingId(tour.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropTargetId(null);
                }}
                onDragOver={(event) => {
                  if (isArchived || !draggingId || draggingId === tour.id) {
                    return;
                  }
                  event.preventDefault();
                  setDropTargetId(tour.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(tour.id);
                }}
                className={`${selectedTourId === tour.id ? "bg-sky-50/50" : ""} ${dropTargetId === tour.id ? "ring-2 ring-sky-300" : ""}`}
              >
                <td className="px-3 py-2 text-zinc-500">
                  {!isArchived ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="cursor-grab select-none">⋮⋮</span>
                      {reorderingTourId === tour.id && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-zinc-400 border-t-transparent" aria-label="loading" />
                      )}
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium text-zinc-900">{tour.name}</p>
                  <p className="text-xs text-zinc-500">{tour.shortDescription || tour.summary}</p>
                </td>
                <td className="px-3 py-2 text-zinc-700">{tour.continent} · {tour.country} · {tour.city}</td>
                <td className="px-3 py-2 text-zinc-700">{tour.durationDays} días</td>
                <td className="px-3 py-2 text-zinc-700">{tour.price}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isArchived ? "bg-zinc-200 text-zinc-700" : tour.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {isArchived ? "Archivado" : tour.isActive ? "Activo" : "Borrador"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={adminTourHref({ edit: tour.id })}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:border-sky-400 hover:bg-sky-50"
                    >
                      Editar
                    </Link>

                    {!isArchived ? (
                      <button
                        type="button"
                        disabled={isPending}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                        onClick={() => updateTourState({ action: "toggleActive", tourId: tour.id, isActive: !tour.isActive }, "tour-status-updated")}
                      >
                          {isPending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent align-[-2px]" aria-label="loading" />}
                          {tour.isActive ? "Pasar a borrador" : "Publicar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                        onClick={() => updateTourState({ action: "restore", tourId: tour.id }, "tour-restored")}
                      >
                          {isPending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent align-[-2px]" aria-label="loading" />}
                          Restaurar
                      </button>
                    )}

                    {!isArchived &&
                      (deleteConfirmId === tour.id ? (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            onClick={() => updateTourState({ action: "archive", tourId: tour.id }, "tour-archived")}
                          >
                            {isPending && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border border-red-500 border-t-transparent align-[-2px]" aria-label="loading" />}
                            Confirmar archivo
                          </button>
                          <Link href={adminTourHref({ edit: selectedTourId })} className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50">
                            Cancelar
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={adminTourHref({ delete: tour.id, edit: selectedTourId })}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:border-red-400 hover:bg-red-50"
                        >
                          Archivar
                        </Link>
                      ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
