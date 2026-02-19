export type Lang = "es" | "en";

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

export async function getLang(searchParams: SearchParamsInput): Promise<Lang> {
  if (!searchParams) {
    return "es";
  }

  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const value = params.lang;
  const raw = Array.isArray(value) ? value[0] : value;

  return raw === "en" ? "en" : "es";
}

export function withLang(path: string, lang: Lang) {
  return `${path}?lang=${lang}`;
}

export const dictionary = {
  es: {
    nav: {
      home: "Inicio",
      destinations: "Destinos",
      tours: "Tours",
      contact: "Contacto",
      admin: "Admin",
      language: "Idioma",
    },
    home: {
      specials: "Promociones",
      tours: "Tours destacados",
      testimonials: "Testimonios",
      faq: "Preguntas frecuentes",
      cta: "Solicitar asesoría",
    },
    destinations: {
      title: "Destinos por continente",
      subtitle: "Explora continentes, países y ciudades más solicitadas.",
    },
    tours: {
      title: "Tours preconstruidos",
      subtitle: "Programas listos para personalizar según cada cliente.",
    },
    contact: {
      title: "Contáctanos",
      subtitle: "Déjanos tus datos y un asesor te contactará.",
      sent: "Gracias. Tu solicitud fue recibida.",
      send: "Enviar",
    },
    admin: {
      dashboard: "Panel de administración",
      site: "Modificación del sitio",
      crm: "CRM de clientes",
      logout: "Cerrar sesión",
      loginTitle: "Ingreso de asesores",
      loginButton: "Iniciar sesión",
    },
    footer: "Agencia de Viajes · Atención personalizada",
  },
  en: {
    nav: {
      home: "Home",
      destinations: "Destinations",
      tours: "Tours",
      contact: "Contact",
      admin: "Admin",
      language: "Language",
    },
    home: {
      specials: "Specials",
      tours: "Featured tours",
      testimonials: "Testimonials",
      faq: "Frequently asked questions",
      cta: "Request advice",
    },
    destinations: {
      title: "Destinations by continent",
      subtitle: "Explore top-requested continents, countries and cities.",
    },
    tours: {
      title: "Pre-built tours",
      subtitle: "Ready-made programs to customize for each client.",
    },
    contact: {
      title: "Contact us",
      subtitle: "Share your details and an advisor will contact you.",
      sent: "Thank you. Your request was received.",
      send: "Send",
    },
    admin: {
      dashboard: "Admin dashboard",
      site: "Site management",
      crm: "Client CRM",
      logout: "Sign out",
      loginTitle: "Advisor sign in",
      loginButton: "Sign in",
    },
    footer: "Travel Agency · Personalized service",
  },
};
