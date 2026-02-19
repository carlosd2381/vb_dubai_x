import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { PublicShell } from "@/components/public-shell";
import { SocialLinks } from "@/components/social-links";
import { dictionary, getLang } from "@/lib/lang";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: Props) {
  const lang = await getLang(searchParams);
  const t = dictionary[lang].contact;

  return (
    <PublicShell lang={lang} path="/contact">
      <section className="rounded-3xl border border-slate-200 bg-linear-to-r from-sky-700 to-cyan-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-semibold">{t.title}</h1>
        <p className="mt-2 text-sky-50">{t.subtitle}</p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <ContactForm lang={lang} />
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Image src="/brand/logos/logo-color.png" alt="Viajes Bumeran Dubai" width={180} height={180} unoptimized className="h-auto w-36" />
          <h2 className="mt-2 font-semibold text-sky-700">Viajes Bumeran Dubai</h2>
          <p className="mt-3 text-sm text-slate-600">Cancun, Mexico</p>
          <p className="text-sm text-slate-600">+52 998 999 5555</p>
          <p className="text-sm text-slate-600">hola@vbdubai.com</p>
          <SocialLinks className="mt-4 flex items-center gap-2" />
        </aside>
      </div>
    </PublicShell>
  );
}
