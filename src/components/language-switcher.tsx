import Link from "next/link";
import { type Lang, withLang } from "@/lib/lang";

type Props = {
  lang: Lang;
  path: string;
};

export function LanguageSwitcher({ lang, path }: Props) {
  const nextLang = lang === "es" ? "en" : "es";

  return (
    <Link
      href={withLang(path, nextLang)}
      className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:border-amber-400 hover:bg-amber-50"
    >
      {lang === "es" ? "EN" : "ES"}
    </Link>
  );
}
