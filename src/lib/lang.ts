export type Lang = "es" | "en";

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

export async function getLang(searchParams: SearchParamsInput): Promise<Lang> {
  void searchParams;
  return "es";
}

export function withLang(path: string, lang: Lang) {
  return `${path}?lang=${lang}`;
}

const spanishDictionary = {
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
};

export const dictionary = {
  es: spanishDictionary,
  en: spanishDictionary,
};
