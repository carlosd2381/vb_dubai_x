import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { dictionary, getLang, withLang } from "@/lib/lang";
import { PublicShell } from "@/components/public-shell";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ToursPage({ searchParams }: Props) {
  const lang = await getLang(searchParams);
  const t = dictionary[lang].tours;
  const tours = await db.tour.findMany({ where: { isActive: true, deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <PublicShell lang={lang} path="/tours">
      <section className="rounded-3xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-semibold">{t.title}</h1>
        <p className="mt-2 text-slate-200">{t.subtitle}</p>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <Link key={tour.id} href={withLang(`/tours/${tour.id}`, lang)} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            {(tour.cardImageUrl || tour.photoUrl) && (
              <div className="relative aspect-square w-full bg-slate-100">
                <Image
                  src={tour.cardImageUrl || tour.photoUrl || ""}
                  alt={tour.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-slate-900">{tour.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{tour.shortDescription || tour.summary}</p>
              <p className="mt-3 text-xs text-slate-500">{tour.continent} · {tour.country} · {tour.city}</p>
              <p className="text-xs text-slate-500">{tour.durationDays} {lang === "es" ? "días" : "days"}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-semibold text-sky-700">{tour.price}</p>
                {tour.videoUrl && (
                  <span className="inline-block text-sm text-sky-700">
                    {lang === "es" ? "Video disponible" : "Video available"}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PublicShell>
  );
}
