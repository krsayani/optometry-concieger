export const SITE_URL = "https://www.optometryconcierge.com";
export const SITE_NAME = "Optometry Concierge";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-cover.png`;
export const DEFAULT_DESCRIPTION =
  "Doctor owned and led career concierge for optometrists. Free resume review, salary guidance, offer comparison, and confidential job matching for ODs and practices.";

/**
 * Build TanStack Router `head` meta/links for a page.
 * @param {{
 *   title: string,
 *   description?: string,
 *   path?: string,
 *   image?: string,
 *   noindex?: boolean,
 *   type?: string,
 * }} options
 */
export function buildSeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  type = "website",
}) {
  const canonical = `${SITE_URL}${path === "/" ? "" : path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      {
        name: "robots",
        content: noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "author", content: SITE_NAME },
      {
        name: "keywords",
        content:
          "optometry jobs, optometrist career, OD placement, optometry recruiting, new grad OD, private practice optometry, Doctor owned recruitment",
      },
      { property: "og:type", content: type },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "theme-color", content: "#051C3F" },
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        email: "Admin@optometryconcierge.com",
        logo: `${SITE_URL}/logo.png`,
        description: DEFAULT_DESCRIPTION,
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#service`,
        name: SITE_NAME,
        url: SITE_URL,
        image: DEFAULT_OG_IMAGE,
        description: DEFAULT_DESCRIPTION,
        areaServed: "United States",
        serviceType: [
          "Optometrist career concierge",
          "Optometry job matching",
          "Practice OD recruitment",
        ],
        provider: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}
