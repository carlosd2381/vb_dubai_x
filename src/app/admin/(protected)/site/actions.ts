"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { savePublicUpload } from "@/lib/upload";

const SHORT_DESCRIPTION_MAX = 160;

function parseGalleryUrls(raw: FormDataEntryValue | null) {
  if (!raw || typeof raw !== "string") {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function adminSiteHref(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/admin/site?${params.toString()}`;
}

async function syncTourGalleryImages(tourId: string, galleryUrls: string[]) {
  await db.tourGalleryImage.deleteMany({ where: { tourId } });

  if (!galleryUrls.length) {
    return;
  }

  await db.tourGalleryImage.createMany({
    data: galleryUrls.map((url, index) => ({
      tourId,
      url,
      sortOrder: index + 1,
    })),
  });
}

export async function updateHeroAction(formData: FormData) {
  await requireRole(["DEVELOPER", "MANAGEMENT"]);
  let statusValue: "hero-saved" | "error" = "hero-saved";

  const lang = String(formData.get("redirectLang") || "").trim();
  const langParam = lang === "en" ? "en" : undefined;

  try {
    const hero = await db.heroSection.findFirst();

    const mediaInput = formData.get("media") as File;
    let mediaUrl = (formData.get("mediaUrl") as string) || null;

    if (mediaInput && mediaInput.size > 0) {
      mediaUrl = await savePublicUpload(mediaInput);
    }

    const payload = {
      titleEs: String(formData.get("titleEs") || ""),
      titleEn: String(formData.get("titleEn") || ""),
      subtitleEs: String(formData.get("subtitleEs") || ""),
      subtitleEn: String(formData.get("subtitleEn") || ""),
      mediaUrl,
      mediaType: String(formData.get("mediaType") || "image"),
    };

    if (hero) {
      await db.heroSection.update({ where: { id: hero.id }, data: payload });
    } else {
      await db.heroSection.create({ data: payload });
    }

    revalidatePath("/");
    revalidatePath("/admin/site");
  } catch (error) {
    console.error("updateHeroAction failed", error);
    statusValue = "error";
  }

  redirect(adminSiteHref({
    tab: "hero",
    status: statusValue,
    showForm: statusValue === "error" ? "1" : undefined,
    lang: langParam,
  }));
}

export async function createTourAction(formData: FormData) {
  await requireRole(["DEVELOPER", "MANAGEMENT"]);
  let statusValue: "tour-saved" | "tour-updated" | "error" = "tour-saved";
  let currentTourId = "";

  const lang = String(formData.get("redirectLang") || "").trim();
  const langParam = lang === "en" ? "en" : undefined;
  const query = String(formData.get("redirectQ") || "").trim() || undefined;
  const country = String(formData.get("redirectCountry") || "").trim() || undefined;
  const tourStatus = String(formData.get("redirectTourStatus") || "").trim() || undefined;

  try {
    const tourId = String(formData.get("tourId") || "").trim();
    currentTourId = tourId;
    const galleryUrls = parseGalleryUrls(formData.get("galleryUrls"));
    const isActive = String(formData.get("isActive") || "") === "on";
    const selectedCardImageUrl = String(formData.get("cardImageUrl") || "").trim();
    const selectedBannerImageUrl = String(formData.get("bannerImageUrl") || "").trim();
    const cardImageUrl = galleryUrls.includes(selectedCardImageUrl) ? selectedCardImageUrl : (galleryUrls[0] || null);
    const bannerImageUrl = galleryUrls.includes(selectedBannerImageUrl)
      ? selectedBannerImageUrl
      : (cardImageUrl || galleryUrls[0] || null);
    const photoUrl = bannerImageUrl || cardImageUrl;

    const payload = {
      name: String(formData.get("name") || ""),
      shortDescription: String(formData.get("shortDescription") || "").trim().slice(0, SHORT_DESCRIPTION_MAX) || null,
      summary: String(formData.get("summary") || ""),
      includes: String(formData.get("includes") || "").trim() || null,
      excludes: String(formData.get("excludes") || "").trim() || null,
      highlights: String(formData.get("highlights") || "").trim() || null,
      continent: String(formData.get("continent") || ""),
      country: String(formData.get("country") || ""),
      city: String(formData.get("city") || ""),
      durationDays: Number(formData.get("durationDays") || 1),
      isActive,
      price: String(formData.get("price") || ""),
      cardImageUrl,
      bannerImageUrl,
      photoUrl,
      videoUrl: (formData.get("videoUrl") as string) || null,
    };

    if (tourId) {
      await db.tour.update({ where: { id: tourId }, data: payload });

      try {
        await syncTourGalleryImages(tourId, galleryUrls);
      } catch (error) {
        console.error("createTourAction gallery sync failed on update", {
          tourId,
          galleryCount: galleryUrls.length,
          error,
        });
      }

      statusValue = "tour-updated";
    } else {
      const lastTour = await db.tour.findFirst({ orderBy: { sortOrder: "desc" } });
      const createdTour = await db.tour.create({ data: { ...payload, sortOrder: (lastTour?.sortOrder || 0) + 1 } });

      try {
        await syncTourGalleryImages(createdTour.id, galleryUrls);
      } catch (error) {
        console.error("createTourAction gallery sync failed on create", {
          tourId: createdTour.id,
          galleryCount: galleryUrls.length,
          error,
        });
      }

      statusValue = "tour-saved";
    }

    revalidatePath("/");
    revalidatePath("/tours");
    revalidatePath("/destinations");
    revalidatePath("/admin/site");
  } catch (error) {
    console.error("createTourAction failed", error);
    statusValue = "error";
  }

  redirect(adminSiteHref({
    tab: "tours",
    status: statusValue,
    q: query,
    country,
    tourStatus,
    showForm: statusValue === "error" ? "1" : undefined,
    edit: statusValue === "error" ? currentTourId || undefined : undefined,
    lang: langParam,
  }));
}

export async function createReviewAction(formData: FormData) {
  await requireRole(["DEVELOPER", "MANAGEMENT"]);
  let statusValue: "review-saved" | "error" = "review-saved";

  const lang = String(formData.get("redirectLang") || "").trim();
  const langParam = lang === "en" ? "en" : undefined;

  try {
    await db.review.create({
      data: {
        clientName: String(formData.get("clientName") || ""),
        quoteEs: String(formData.get("quoteEs") || ""),
        quoteEn: String(formData.get("quoteEn") || ""),
        rating: Number(formData.get("rating") || 5),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/site");
  } catch (error) {
    console.error("createReviewAction failed", error);
    statusValue = "error";
  }

  redirect(adminSiteHref({
    tab: "reviews",
    status: statusValue,
    showForm: statusValue === "error" ? "1" : undefined,
    lang: langParam,
  }));
}
