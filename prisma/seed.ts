import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!");

  await prisma.advisor.upsert({
    where: { email: "admin@agencia.com" },
    update: { name: "Administrador", passwordHash },
    create: {
      name: "Administrador",
      email: "admin@agencia.com",
      passwordHash,
    },
  });

  const existingHero = await prisma.heroSection.findFirst();
  if (!existingHero) {
    await prisma.heroSection.create({
      data: {
        titleEs: "Viajes memorables, asesoría humana",
        titleEn: "Memorable travel, human guidance",
        subtitleEs: "Promociones exclusivas y tours seleccionados para cada cliente.",
        subtitleEn: "Exclusive promotions and curated tours for each client.",
      },
    });
  }

  const toursCount = await prisma.tour.count();
  if (toursCount === 0) {
    await prisma.tour.createMany({
      data: [
        {
          name: "Dubai Luxury Escape",
          shortDescription: "5 días con experiencias premium en Dubai.",
          summary: "5 días con experiencias premium en Dubai.",
          includes: "Hotel 5 estrellas\nTraslados aeropuerto-hotel-aeropuerto\nDesayuno diario\nCity tour guiado",
          excludes: "Vuelos internacionales\nSeguro de viaje\nGastos personales",
          highlights: "Burj Khalifa\nDesert Safari\nDubai Marina",
          isActive: true,
          sortOrder: 1,
          continent: "Asia",
          country: "EAU",
          city: "Dubai",
          durationDays: 5,
          price: "USD 2,900",
        },
        {
          name: "Roma y Toscana Clásico",
          shortDescription: "Historia, gastronomía y viñedos italianos.",
          summary: "Historia, gastronomía y viñedos italianos.",
          includes: "Hotel 4 estrellas\nDesayuno diario\nTraslados internos\nVisita guiada en Roma",
          excludes: "Vuelos internacionales\nEntradas no especificadas\nAlmuerzos y cenas",
          highlights: "Coliseo Romano\nFlorencia\nRuta de viñedos en Toscana",
          isActive: true,
          sortOrder: 2,
          continent: "Europa",
          country: "Italia",
          city: "Roma",
          durationDays: 7,
          price: "USD 2,200",
        },
      ],
    });
  }

  const specialsCount = await prisma.special.count();
  if (specialsCount === 0) {
    await prisma.special.createMany({
      data: [
        {
          titleEs: "Reserva anticipada 2026",
          titleEn: "Early booking 2026",
          descriptionEs: "Ahorra hasta 20% reservando 90 días antes.",
          descriptionEn: "Save up to 20% booking 90 days in advance.",
          price: "Hasta -20%",
        },
        {
          titleEs: "Luna de miel premium",
          titleEn: "Premium honeymoon",
          descriptionEs: "Upgrade de habitación y traslado privado incluido.",
          descriptionEn: "Room upgrade and private transfer included.",
          price: "Desde USD 3,500",
        },
      ],
    });
  }

  const reviewsCount = await prisma.review.count();
  if (reviewsCount === 0) {
    await prisma.review.createMany({
      data: [
        {
          clientName: "Valeria P.",
          quoteEs: "Servicio impecable de inicio a fin.",
          quoteEn: "Flawless service from start to finish.",
          rating: 5,
        },
        {
          clientName: "Carlos M.",
          quoteEs: "Todo claro y muy bien organizado.",
          quoteEn: "Everything was clear and well organized.",
          rating: 5,
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
