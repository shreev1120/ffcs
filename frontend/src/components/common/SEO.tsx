import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics } from "@/lib/analytics";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
}

export const SEO = ({
  title,
  description = "Generate 100% clash-free, AI-optimized academic timetables for VIT students using your VTOP FFCS Excel export.",
  image = "/og-image.png",
  type = "website",
}: SEOProps) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title.includes("FFCS") ? title : `${title} | VIT FFCS Agent`;
    document.title = formattedTitle;

    // Helper to update or create meta tags
    const updateMeta = (name: string, content: string, isProperty: boolean = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Standard Meta
    updateMeta("description", description);

    // 3. Open Graph
    updateMeta("og:title", formattedTitle, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", type, true);
    updateMeta("og:image", image, true);
    updateMeta("og:url", window.location.href, true);
    updateMeta("og:site_name", "VIT FFCS Agent", true);

    // 4. Twitter Card
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", formattedTitle);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", image);

    // 5. Fire pageview analytics event (Item 18)
    analytics.trackPageView(location.pathname, formattedTitle);
  }, [title, description, image, type, location.pathname]);

  return null;
};

export default SEO;
