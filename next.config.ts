import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ["puppeteer"],
  // Telas que saíram do Compras: cadastro central fica no Portal.
  async redirects() {
    const portal = "https://sistemas.casaforteinc.com.br";
    return [
      { source: "/pessoas/:path*", destination: `${portal}/pessoas`, permanent: false },
      { source: "/engenheiros/:path*", destination: `${portal}/pessoas`, permanent: false },
      { source: "/obras/:path*", destination: `${portal}/obras`, permanent: false },
      { source: "/relatorios/:path*", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
