import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const site = context.site?.toString() ?? "https://revistamicelio.com";

  const posts = (await getCollection("publicaciones")).sort(
    (a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf()
  );

  return rss({
    title: "Revista Micelio",
    description:
      "Ensayos, narrativas, poesía, traducciones y reseñas de Revista Micelio.",
    site,
    items: posts.map((post) => ({
      title: post.data.titulo,
      pubDate: post.data.fecha,
      description: post.data.resumen ?? "",
      link: `/publicaciones/${post.id}/`,
    })),
    customData: `<language>es</language>`,
  });
}
