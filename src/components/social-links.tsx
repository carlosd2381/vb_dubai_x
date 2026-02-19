import Image from "next/image";

const socialItems = [
  {
    name: "WhatsApp",
    href: "https://wa.me/971000000000",
    icon: "/brand/social/whatsapp.png",
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: "/brand/social/facebook.png",
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: "/brand/social/instagram.png",
  },
  {
    name: "TikTok",
    href: "https://tiktok.com",
    icon: "/brand/social/tiktok.png",
  },
  {
    name: "Indeed",
    href: "https://indeed.com",
    icon: "/brand/social/indeed.png",
  },
];

type Props = {
  className?: string;
};

export function SocialLinks({ className }: Props) {
  return (
    <div className={className}>
      {socialItems.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white hover:border-amber-400 hover:bg-amber-50"
          aria-label={item.name}
          title={item.name}
        >
          <Image src={item.icon} alt={item.name} width={18} height={18} unoptimized />
        </a>
      ))}
    </div>
  );
}
