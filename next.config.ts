import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Standalone output, for the container.
   *
   * Next traces the files the server actually needs and writes a self-contained bundle with
   * its own minimal node_modules. The runtime image is then ~150MB instead of carrying the
   * whole dependency tree, and the runner stage needs no npm install at all.
   */
  output: "standalone",

  /*
   * Behind Cloudflare and nginx.
   *
   * The proxy chain means the request Next sees arrives from 127.0.0.1; without this the
   * framework builds absolute URLs from the wrong host.
   */
  poweredByHeader: false,
};

export default nextConfig;
