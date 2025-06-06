import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eurotrip",
    short_name: "Eurotrip",
    start_url: "/",
    display: "standalone",
    icons: [
      {
        src: "/placeholder.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
