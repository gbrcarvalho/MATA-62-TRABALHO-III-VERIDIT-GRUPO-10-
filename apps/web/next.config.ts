import type { NextConfig } from "next";
import { loadEnvConfig } from '@next/env';
import { resolve } from 'node:path';

loadEnvConfig(resolve(import.meta.dirname, '../../'));

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
