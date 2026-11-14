export default {
  devIndicators: false,
  experimental: { proxyTimeout: 300000, proxyClientMaxBodySize: "32mb" },
  async redirects() {
    return Object.entries({
      "/measurements": "/analytics",
      "/vision": "/media",
      "/mission": "/mission-advisor",
    }).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};
