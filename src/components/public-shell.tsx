import Link from "next/link";
import Image from "next/image";
import { dictionary, type Lang, withLang } from "@/lib/lang";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SocialLinks } from "@/components/social-links";

type Props = {
  lang: Lang;
  path: string;
  children: React.ReactNode;
};

export function PublicShell({ lang, path, children }: Props) {
  const t = dictionary[lang];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href={withLang("/", lang)} className="flex items-center gap-2">
            <Image src="/brand/logos/logo-main.png" alt="Viajes Bumeran Dubai" width={46} height={46} unoptimized className="h-11 w-auto" />
            <span className="text-sm font-semibold text-sky-700">Viajes Bumeran Dubai</span>
          </Link>
          <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 text-sm shadow-sm">
            <Link href={withLang("/", lang)} className="rounded-full px-3 py-1.5 hover:bg-slate-100">{t.nav.home}</Link>
            <Link href={withLang("/destinations", lang)} className="rounded-full px-3 py-1.5 hover:bg-slate-100">{t.nav.destinations}</Link>
            <Link href={withLang("/tours", lang)} className="rounded-full px-3 py-1.5 hover:bg-slate-100">{t.nav.tours}</Link>
            <Link href={withLang("/contact", lang)} className="rounded-full px-3 py-1.5 hover:bg-slate-100">{t.nav.contact}</Link>
            <Link href="/admin/login" className="rounded-full bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-700">
              {t.nav.admin}
            </Link>
            <LanguageSwitcher lang={lang} path={path} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <footer className="mt-10 border-t border-slate-800 bg-slate-950 text-slate-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm">
          <div className="flex items-center gap-2">
            <Image src="/brand/logos/logo-main.png" alt="Viajes Bumeran Dubai" width={34} height={34} unoptimized className="h-8 w-auto" />
            <div>
              <p className="font-medium text-white">Viajes Bumeran Dubai</p>
              <p className="text-slate-400">{t.footer}</p>
            </div>
          </div>
          <SocialLinks className="flex items-center gap-2" />
        </div>
      </footer>
    </div>
  );
}
