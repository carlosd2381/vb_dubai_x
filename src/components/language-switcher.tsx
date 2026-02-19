import { type Lang } from "@/lib/lang";

type Props = {
  lang: Lang;
  path: string;
};

export function LanguageSwitcher({ lang, path }: Props) {
  void lang;
  void path;

  return (
    <span className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700">ES</span>
  );
}
