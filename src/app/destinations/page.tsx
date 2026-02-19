import { db } from "@/lib/db";
import { dictionary, getLang } from "@/lib/lang";
import { PublicShell } from "@/components/public-shell";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DestinationsPage({ searchParams }: Props) {
  const lang = await getLang(searchParams);
  const t = dictionary[lang].destinations;
  const tours = await db.tour.findMany({ orderBy: [{ continent: "asc" }, { country: "asc" }, { city: "asc" }] });

  const grouped = tours.reduce<Record<string, Record<string, Set<string>>>>((acc, tour) => {
    acc[tour.continent] ??= {};
    acc[tour.continent][tour.country] ??= new Set();
    acc[tour.continent][tour.country].add(tour.city);
    return acc;
  }, {});

  return (
    <PublicShell lang={lang} path="/destinations">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-700 to-cyan-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-semibold">{t.title}</h1>
        <p className="mt-2 text-sky-50">{t.subtitle}</p>
      </section>

      <div className="space-y-4">
        {Object.entries(grouped).map(([continent, countries]) => (
          <section key={continent} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">{continent}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(countries).map(([country, cities]) => (
                <article key={country} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                  <h3 className="font-semibold text-slate-800">{country}</h3>
                  <p className="mt-1 text-sm text-slate-600">{Array.from(cities).join(", ")}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicShell>
  );
}
