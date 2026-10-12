import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduConnect Mongolia",
    short_name: "EduConnect",
    description:
      "Сургалтын төвийн удирдлагын платформ — бүлэг, хуваарь, ирц, даалгавар, мессеж.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b2b4b",
    theme_color: "#1b2b4b",
    lang: "mn",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
