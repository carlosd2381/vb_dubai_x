import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dictionary, getLang, withLang } from "@/lib/lang";
import { PublicShell } from "@/components/public-shell";
import { TourDetailGallery } from "@/components/tour-detail-gallery";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function splitLines(value: string | null | undefined) {
  return (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function TourDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const lang = await getLang(searchParams);
  const t = dictionary[lang].tours;

  const tour = await db.tour.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
    },
    include: {
      galleryImages: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!tour) {
    notFound();
  }

  const includes = splitLines(tour.includes);
  const excludes = splitLines(tour.excludes);
  const highlights = splitLines(tour.highlights);
  const galleryImages = tour.galleryImages.map((image: { url: string }) => image.url);
  const cardImage = tour.cardImageUrl || null;
  const bannerImage = tour.bannerImageUrl || tour.photoUrl || tour.cardImageUrl || galleryImages[0] || null;
  const excludedImages = new Set([cardImage, bannerImage].filter(Boolean));
  const galleryToShow = galleryImages.filter((image) => !excludedImages.has(image));

  return (
    <PublicShell lang={lang} path="/tours">
      <div className="mb-4">
        <Link href={withLang("/tours", lang)} className="text-sm text-sky-700 underline hover:text-amber-600">
          {lang === "es" ? "← Volver a tours" : "← Back to tours"}
        </Link>
      </div>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {bannerImage && (
          <div className="relative aspect-video w-full bg-slate-100">
            <Image src={bannerImage} alt={tour.name} fill sizes="100vw" unoptimized className="object-cover" />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{tour.name}</h1>
              <p className="mt-2 text-sm text-slate-500">{tour.continent} · {tour.country} · {tour.city}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">{tour.durationDays} {lang === "es" ? "días" : "days"}</p>
              <p className="text-xl font-semibold text-sky-700">{tour.price}</p>
            </div>
          </div>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">{lang === "es" ? "Descripción" : "Description"}</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{tour.summary}</p>
          </section>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{lang === "es" ? "Qué incluye" : "What's included"}</h3>
              {includes.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">{lang === "es" ? "Información no disponible." : "Information not available."}</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{lang === "es" ? "Qué no incluye" : "What's not included"}</h3>
              {excludes.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {excludes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">{lang === "es" ? "Información no disponible." : "Information not available."}</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{lang === "es" ? "Destacados" : "Highlights"}</h3>
              {highlights.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">{lang === "es" ? "Información no disponible." : "Information not available."}</p>
              )}
            </section>
          </div>

          <TourDetailGallery images={galleryToShow} lang={lang} />

          {tour.videoUrl && (
            <div className="mt-6">
              <a href={tour.videoUrl} target="_blank" rel="noreferrer" className="inline-block rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
                {lang === "es" ? "Ver video del tour" : "Watch tour video"}
              </a>
            </div>
          )}
        </div>
      </article>

      <p className="mt-6 text-sm text-slate-500">{t.subtitle}</p>
    </PublicShell>
  );
}
