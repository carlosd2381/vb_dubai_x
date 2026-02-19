import Link from "next/link";
import { db } from "@/lib/db";
import { createReviewAction, createTourAction, updateHeroAction } from "./actions";
import { AdminStatusToast } from "@/components/admin-status-toast";
import { AdminToursTable } from "@/components/admin-tours-table";
import { TourGalleryField } from "@/components/tour-gallery-field";
import { TourShortDescriptionField } from "@/components/tour-short-description-field";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SHORT_DESCRIPTION_MAX = 160;

export default async function AdminSitePage({ searchParams }: Props) {
  const params = await searchParams;
  const langRaw = params.lang;
  const adminLang = (Array.isArray(langRaw) ? langRaw[0] : langRaw) === "en" ? "en" : "es";
  const isEn = adminLang === "en";
  const adminSiteHref = (query: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      }
    });

    if (adminLang === "en") {
      urlParams.set("lang", "en");
    }

    return `/admin/site?${urlParams.toString()}`;
  };
  const statusRaw = params.status;
  const status = Array.isArray(statusRaw) ? statusRaw[0] : statusRaw;
  const queryRaw = params.q;
  const query = String(Array.isArray(queryRaw) ? queryRaw[0] : queryRaw || "").trim();
  const countryRaw = params.country;
  const countryFilter = String(Array.isArray(countryRaw) ? countryRaw[0] : countryRaw || "").trim();
  const tourStatusRaw = params.tourStatus;
  const tourStatus = (Array.isArray(tourStatusRaw) ? tourStatusRaw[0] : tourStatusRaw) || "all";
  const tabRaw = params.tab;
  const tab = (Array.isArray(tabRaw) ? tabRaw[0] : tabRaw) || "tours";
  const editRaw = params.edit;
  const editTourId = Array.isArray(editRaw) ? editRaw[0] : editRaw;
  const deleteRaw = params.delete;
  const deleteConfirmId = Array.isArray(deleteRaw) ? deleteRaw[0] : deleteRaw;
  const showFormRaw = params.showForm;
  const showForm = (Array.isArray(showFormRaw) ? showFormRaw[0] : showFormRaw) === "1";
  const hero = await db.heroSection.findFirst();
  const tourWhere: {
    deletedAt?: null | { not: null };
    isActive?: boolean;
    country?: string;
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      shortDescription?: { contains: string; mode: "insensitive" };
      country?: { contains: string; mode: "insensitive" };
      city?: { contains: string; mode: "insensitive" };
    }>;
  } = {};

  if (tourStatus === "archived") {
    tourWhere.deletedAt = { not: null };
  } else {
    tourWhere.deletedAt = null;
  }

  if (tourStatus === "active") {
    tourWhere.isActive = true;
  }

  if (tourStatus === "draft") {
    tourWhere.isActive = false;
  }

  if (countryFilter) {
    tourWhere.country = countryFilter;
  }

  if (query) {
    tourWhere.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { shortDescription: { contains: query, mode: "insensitive" } },
      { country: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
    ];
  }

  const tours = await db.tour.findMany({ where: tourWhere, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  const countries = await db.tour.findMany({ where: { deletedAt: null }, select: { country: true }, distinct: ["country"], orderBy: { country: "asc" } });
  const reviews = await db.review.findMany({ orderBy: { createdAt: "desc" } });
  const selectedTour = tab === "tours" && editTourId
    ? await db.tour.findUnique({
        where: { id: editTourId },
        include: { galleryImages: { orderBy: { sortOrder: "asc" } } },
      })
    : null;
  const selectedTourImageUrls = selectedTour
    ? Array.from(new Set(
        [
          ...selectedTour.galleryImages.map((image) => image.url),
          selectedTour.cardImageUrl,
          selectedTour.bannerImageUrl,
          selectedTour.photoUrl,
        ].filter((value): value is string => Boolean(value))
      ))
    : [];
  const tourFormOpen = tab === "tours" && (showForm || Boolean(selectedTour));
  const heroFormOpen = tab === "hero" && showForm;
  const reviewFormOpen = tab === "reviews" && showForm;
  const adminTourHref = (queryParams: Record<string, string | undefined>) =>
    adminSiteHref({
      tab: "tours",
      q: query || undefined,
      country: countryFilter || undefined,
      tourStatus: tourStatus || undefined,
      ...queryParams,
    });

  const tabs = [
    { key: "tours", label: "Carga de tours", shortLabel: "Tours" },
    { key: "hero", label: "Sección principal", shortLabel: "Principal" },
    { key: "reviews", label: "Carga de reseñas", shortLabel: "Reseñas" },
  ] as const;

  const statusMessages: Record<string, { es: string; en: string }> = {
    "hero-saved": { es: "Hero guardado correctamente.", en: "Hero saved successfully." },
    "tour-saved": { es: "Tour guardado correctamente.", en: "Tour saved successfully." },
    "tour-updated": { es: "Tour actualizado correctamente.", en: "Tour updated successfully." },
    "tour-archived": { es: "Tour archivado.", en: "Tour archived." },
    "tour-restored": { es: "Tour restaurado.", en: "Tour restored." },
    "tour-status-updated": { es: "Estado del tour actualizado.", en: "Tour status updated." },
    "tour-reordered": { es: "Orden de tours actualizado.", en: "Tours order updated." },
    "review-saved": { es: "Reseña guardada correctamente.", en: "Review saved successfully." },
    error: { es: "No se pudo guardar. Inténtalo nuevamente.", en: "Could not save. Please try again." },
  };
  const toastMessage = status ? statusMessages[status]?.[adminLang] : undefined;

  return (
    <div className="space-y-6">
      <AdminStatusToast status={status || undefined} message={toastMessage} />
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Modificación del sitio</h1>
            <p className="mt-1 text-sm text-zinc-600">Carga hero, tours y reseñas para el sitio público.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <Link
                key={item.key}
                href={adminSiteHref({ tab: item.key })}
                className={`rounded-md px-4 py-2 text-sm ${
                  tab === item.key
                    ? "bg-sky-600 text-white hover:bg-sky-700"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {tab === "hero" && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Sección principal</h2>
              <p className="mt-1 text-sm text-zinc-600">Configura el contenido principal del home.</p>
            </div>
            <Link href={adminSiteHref({ tab: "hero", showForm: "1" })} className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
              + Agregar hero
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="py-2">Título ES</th>
                  <th className="py-2">Título EN</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Actualizado</th>
                  <th className="py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {hero ? (
                  <tr className="border-b border-zinc-100">
                    <td className="py-2">{hero.titleEs}</td>
                    <td className="py-2">{hero.titleEn}</td>
                    <td className="py-2">{hero.mediaType || "image"}</td>
                    <td className="py-2">{hero.updatedAt.toLocaleDateString("es-ES")}</td>
                    <td className="py-2">
                      <Link href={adminSiteHref({ tab: "hero", showForm: "1" })} className="text-sky-700 underline hover:text-amber-600">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-3 text-zinc-600" colSpan={5}>No hay hero cargado todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {heroFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{isEn ? "Hero form" : "Formulario de hero"}</h3>
                  <Link href={adminSiteHref({ tab: "hero" })} className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50">
                    {isEn ? "Close" : "Cerrar"}
                  </Link>
                </div>
                <form action={updateHeroAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="redirectLang" value={adminLang} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Title ES *" : "Título ES *"}</label>
                    <input name="titleEs" defaultValue={hero?.titleEs || ""} placeholder="Título ES" minLength={3} title="Completa el título en español (mínimo 3 caracteres)" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Título EN *</label>
                    <input name="titleEn" defaultValue={hero?.titleEn || ""} placeholder="Title EN" minLength={3} title="Complete the English title (minimum 3 characters)" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Subtítulo ES *</label>
                    <input name="subtitleEs" defaultValue={hero?.subtitleEs || ""} placeholder="Subtítulo ES" minLength={8} title="Completa el subtítulo en español (mínimo 8 caracteres)" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Subtitle EN *</label>
                    <input name="subtitleEn" defaultValue={hero?.subtitleEn || ""} placeholder="Subtitle EN" minLength={8} title="Complete the English subtitle (minimum 8 characters)" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Media URL" : "URL media"}</label>
                    <input name="mediaUrl" defaultValue={hero?.mediaUrl || ""} placeholder="URL media (opcional)" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Optional. If you upload a file, it replaces this URL." : "Opcional. Si subes archivo, reemplaza esta URL."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Media file" : "Archivo media"}</label>
                    <input type="file" name="media" accept="image/*,video/*" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Optional. Allowed formats: image or video." : "Opcional. Formatos permitidos: imagen o video."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Media type *" : "Tipo de media *"}</label>
                    <select name="mediaType" defaultValue={hero?.mediaType || "image"} className="w-full rounded-md border border-zinc-300 px-3 py-2" required>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div className="flex items-end">
                    <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 md:w-fit">{isEn ? "Save hero" : "Guardar hero"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "tours" && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{isEn ? "Tour management" : "Carga de tours"}</h2>
              <p className="mt-1 text-sm text-zinc-600">{isEn ? "Manage tours and publication status." : "Administra tours, estado de publicación y orden."}</p>
            </div>
            <Link href={adminTourHref({ showForm: "1" })} className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
              {isEn ? "+ Add tour" : "+ Agregar tour"}
            </Link>
          </div>

          <form method="GET" action="/admin/site" className="mt-4 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-4">
            <input type="hidden" name="tab" value="tours" />
            {adminLang === "en" && <input type="hidden" name="lang" value="en" />}
            <input
              name="q"
              defaultValue={query}
              placeholder={isEn ? "Search by name, city, country" : "Buscar por nombre, ciudad, país"}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm md:col-span-2"
            />
            <select name="country" defaultValue={countryFilter} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="">{isEn ? "All countries" : "Todos los países"}</option>
              {countries.map((country) => (
                <option key={country.country} value={country.country}>{country.country}</option>
              ))}
            </select>
            <select name="tourStatus" defaultValue={tourStatus} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="all">{isEn ? "All statuses" : "Todos los estados"}</option>
              <option value="active">{isEn ? "Active" : "Activos"}</option>
              <option value="draft">{isEn ? "Draft" : "Borradores"}</option>
              <option value="archived">{isEn ? "Archived" : "Archivados"}</option>
            </select>
            <div className="md:col-span-4 flex gap-2">
              <button className="rounded-md bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700">{isEn ? "Apply filters" : "Aplicar filtros"}</button>
              <Link href={adminSiteHref({ tab: "tours" })} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
                {isEn ? "Clear" : "Limpiar"}
              </Link>
            </div>
          </form>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">{isEn ? "Tours" : "Tours existentes"}</h3>
              <p className="text-sm text-zinc-500">{tours.length} registros</p>
            </div>

            {tours.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-600">{isEn ? "No tours found for current filters." : "No hay tours para los filtros actuales."}</p>
            ) : (
              <AdminToursTable
                tours={tours}
                selectedTourId={selectedTour?.id || undefined}
                deleteConfirmId={deleteConfirmId || undefined}
                isEn={isEn}
                adminLang={adminLang}
                query={query || undefined}
                countryFilter={countryFilter || undefined}
                tourStatus={tourStatus || undefined}
              />
            )}
          </div>

          {tourFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{selectedTour ? (isEn ? "Edit tour" : "Editar tour") : (isEn ? "New tour" : "Nuevo tour")}</h3>
                  <Link href={adminTourHref({})} className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50">
                    {isEn ? "Close" : "Cerrar"}
                  </Link>
                </div>
                <form action={createTourAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="tourId" value={selectedTour?.id || ""} />
                  <input type="hidden" name="redirectLang" value={adminLang} />
                  <input type="hidden" name="redirectQ" value={query} />
                  <input type="hidden" name="redirectCountry" value={countryFilter} />
                  <input type="hidden" name="redirectTourStatus" value={tourStatus} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Tour name *" : "Nombre del tour *"}</label>
                    <input name="name" defaultValue={selectedTour?.name || ""} placeholder="Nombre del tour" minLength={3} title="Ingresa un nombre de tour (mínimo 3 caracteres)" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Price *" : "Precio *"}</label>
                    <input name="price" defaultValue={selectedTour?.price || ""} placeholder="Precio" minLength={1} title="Ingresa el precio del tour" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <TourShortDescriptionField defaultValue={selectedTour?.shortDescription || ""} maxLength={SHORT_DESCRIPTION_MAX} lang={adminLang} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Continent *" : "Continente *"}</label>
                    <input name="continent" defaultValue={selectedTour?.continent || ""} placeholder="Continente" minLength={2} title="Ingresa el continente" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Country *" : "País *"}</label>
                    <input name="country" defaultValue={selectedTour?.country || ""} placeholder="País" minLength={2} title="Ingresa el país" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "City *" : "Ciudad *"}</label>
                    <input name="city" defaultValue={selectedTour?.city || ""} placeholder="Ciudad" minLength={2} title="Ingresa la ciudad" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Duration (days) *" : "Duración (días) *"}</label>
                    <input type="number" name="durationDays" min={1} defaultValue={selectedTour?.durationDays || 5} title="Ingresa una duración mayor o igual a 1" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field. Minimum 1 day." : "Campo obligatorio. Mínimo 1 día."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Publication" : "Publicación"}</label>
                    <label className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2">
                      <input type="checkbox" name="isActive" defaultChecked={selectedTour?.isActive ?? true} />
                      <span className="text-sm text-zinc-700">{isEn ? "Active (visible on public site)" : "Activo (visible en sitio público)"}</span>
                    </label>
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "If disabled, this tour remains as draft." : "Si se desactiva, queda como borrador."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Full description *" : "Descripción completa *"}</label>
                    <textarea name="summary" defaultValue={selectedTour?.summary || ""} placeholder="Descripción completa" minLength={20} title="Ingresa una descripción completa (mínimo 20 caracteres)" className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field. Minimum 20 characters." : "Campo obligatorio. Mínimo 20 caracteres."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "What's included" : "Qué incluye"}</label>
                    <textarea name="includes" defaultValue={selectedTour?.includes || ""} placeholder={isEn ? "One item per line" : "Un ítem por línea"} className="min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2" />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Optional. Use one line per included item." : "Opcional. Usa una línea por cada ítem incluido."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "What's not included" : "Qué no incluye"}</label>
                    <textarea name="excludes" defaultValue={selectedTour?.excludes || ""} placeholder={isEn ? "One item per line" : "Un ítem por línea"} className="min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2" />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Optional. Use one line per excluded item." : "Opcional. Usa una línea por cada ítem no incluido."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Highlights" : "Destacados"}</label>
                    <textarea name="highlights" defaultValue={selectedTour?.highlights || ""} placeholder={isEn ? "One highlight per line" : "Un destacado por línea"} className="min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2" />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Optional. Main places or activities." : "Opcional. Principales lugares o actividades."}</p>
                  </div>
                  <TourGalleryField
                    defaultUrls={selectedTourImageUrls}
                    defaultCardUrl={selectedTour?.cardImageUrl || selectedTour?.photoUrl}
                    defaultBannerUrl={selectedTour?.bannerImageUrl || selectedTour?.photoUrl}
                    lang={adminLang}
                  />
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Video URL" : "URL video"}</label>
                    <input name="videoUrl" defaultValue={selectedTour?.videoUrl || ""} placeholder="URL video (opcional)" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Optional." : "Opcional."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 md:w-fit">
                      {selectedTour ? (isEn ? "Update tour" : "Actualizar tour") : (isEn ? "Save tour" : "Guardar tour")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "reviews" && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Carga de reseñas</h2>
              <p className="mt-1 text-sm text-zinc-600">Administra las reseñas visibles en el sitio público.</p>
            </div>
            <Link href={adminSiteHref({ tab: "reviews", showForm: "1" })} className="rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
              + Agregar reseña
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Rating</th>
                  <th className="py-2">Reseña ES</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b border-zinc-100">
                    <td className="py-2">{review.clientName}</td>
                    <td className="py-2">{review.rating}/5</td>
                    <td className="py-2">{review.quoteEs}</td>
                    <td className="py-2">{review.createdAt.toLocaleDateString("es-ES")}</td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td className="py-3 text-zinc-600" colSpan={4}>No hay reseñas cargadas todavía.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {reviewFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{isEn ? "New review" : "Nueva reseña"}</h3>
                  <Link href={adminSiteHref({ tab: "reviews" })} className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50">
                    {isEn ? "Close" : "Cerrar"}
                  </Link>
                </div>
                <form action={createReviewAction} className="grid gap-3 md:grid-cols-2">
                  <input type="hidden" name="redirectLang" value={adminLang} />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">{isEn ? "Client *" : "Cliente *"}</label>
                    <input name="clientName" placeholder="Cliente" minLength={2} title="Ingresa el nombre del cliente" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Rating *</label>
                    <input type="number" name="rating" min={1} max={5} defaultValue={5} title="Ingresa un valor entre 1 y 5" className="w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field. Between 1 and 5." : "Campo obligatorio. Entre 1 y 5."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Reseña ES *</label>
                    <textarea name="quoteEs" placeholder="Reseña ES" minLength={8} title="Ingresa la reseña en español (mínimo 8 caracteres)" className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Review EN *</label>
                    <textarea name="quoteEn" placeholder="Review EN" minLength={8} title="Enter the English review (minimum 8 characters)" className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2" required />
                    <p className="mt-1 text-xs text-zinc-500">{isEn ? "Required field." : "Campo obligatorio."}</p>
                  </div>
                  <div className="md:col-span-2">
                    <button className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 md:w-fit">{isEn ? "Save review" : "Guardar reseña"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
