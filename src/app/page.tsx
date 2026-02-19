import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { dictionary, getLang, withLang } from "@/lib/lang";
import { PublicShell } from "@/components/public-shell";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const lang = await getLang(searchParams);
  const t = dictionary[lang].home;

  const [hero, tours, reviews] = await Promise.all([
    db.heroSection.findFirst(),
    db.tour.findMany({ where: { isActive: true, deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    db.review.findMany({ take: 4, orderBy: { createdAt: "desc" } }),
  ] as const);

  return (
    <PublicShell lang={lang} path="/">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-xl">
        {hero?.mediaUrl && (
          <Image
            src={hero.mediaUrl}
            alt="Hero"
            width={1600}
            height={800}
            unoptimized
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-slate-900 via-slate-900/80 to-transparent" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-200">
            Asesoría de viajes personalizada
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            {hero?.titleEs}
          </h1>
          <p className="mt-4 text-slate-200">{hero?.subtitleEs}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={withLang("/contact", lang)} className="rounded-xl bg-sky-600 px-5 py-2.5 font-medium text-white transition hover:bg-sky-700">
              {t.cta}
            </Link>
            <Link href={withLang("/tours", lang)} className="rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 font-medium text-white hover:bg-white/20">
              Ver tours
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-2xl font-semibold">50+</p>
            <p className="text-xs text-slate-300">Destinos</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-2xl font-semibold">200+</p>
            <p className="text-xs text-slate-300">Clientes felices</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-2xl font-semibold">98%</p>
            <p className="text-xs text-slate-300">Satisfacción</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-semibold text-slate-900">{t.tours}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour: { id: string; name: string; shortDescription: string | null; summary: string; continent: string; country: string; city: string; cardImageUrl: string | null; photoUrl: string | null }) => (
            <Link key={tour.id} href={withLang(`/tours/${tour.id}`, lang)} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              {(tour.cardImageUrl || tour.photoUrl) ? (
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image src={tour.cardImageUrl || tour.photoUrl || ""} alt={tour.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" unoptimized className="object-contain" />
                </div>
              ) : (
                <div className="aspect-square w-full bg-linear-to-r from-sky-600 to-cyan-500" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{tour.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{tour.shortDescription || tour.summary}</p>
                <p className="mt-3 text-xs text-slate-500">{tour.continent} · {tour.country} · {tour.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-slate-950 px-6 py-8 text-white">
        <h2 className="text-3xl font-semibold">{t.testimonials}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review: { id: string; clientName: string; quoteEs: string; quoteEn: string }) => (
            <article key={review.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="italic text-slate-100">“{review.quoteEs}”</p>
              <p className="mt-3 text-sm font-medium text-sky-200">{review.clientName}</p>
            </article>
          ))}
        </div>
      </section>

    </PublicShell>
  );
}
