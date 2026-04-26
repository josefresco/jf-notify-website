export default function (eleventyConfig) {

  // ── Passthrough copies ────────────────────────────────────────────────────
  // Assets (CSS, images, etc.)
  eleventyConfig.addPassthroughCopy("src/assets");

  // Static root files
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/llms.txt");

  // Images referenced by homepage variants (keep at site root)
  eleventyConfig.addPassthroughCopy("src/*.png");

  // Homepage and success page (passthrough — no template syntax)
  eleventyConfig.addPassthroughCopy("src/index.html");
  eleventyConfig.addPassthroughCopy("src/index-v2.html");
  eleventyConfig.addPassthroughCopy("src/success.html");

  // ── Filters ──────────────────────────────────────────────────────────────
  eleventyConfig.addFilter("readableDate", (dateStr) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // ── Collections ──────────────────────────────────────────────────────────
  // All blog posts, newest first
  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/blog/*.njk")
      .filter((p) => !p.data.hidden)
      .sort((a, b) => b.date - a.date);
  });

  // ── Config ───────────────────────────────────────────────────────────────
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
    },
    // Allow HTML in .njk files
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
