import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fijar la raiz a mano. Turbopack la infiere buscando un lockfile hacia
    // arriba, y hay un package-lock.json suelto en el home (~/), asi que puede
    // tomar /Users/<user> como workspace root y ponerse a vigilar y resolver la
    // carpeta personal completa. Eso colgo el dev server el 18-ago-2026: 6 min
    // para compilar /login y la maquina sin RAM. Ver vercel/next.js#92978.
    root: path.join(__dirname),
  },
};

export default nextConfig;
