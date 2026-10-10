import path from "node:path";

const infraRoot = process.cwd();

export const projectRoot = path.resolve(infraRoot, "../..");
export const functionsRoot = path.resolve(infraRoot, "../functions");
export const webDistPath = path.resolve(infraRoot, "../web/dist");
export const agentCorePackagePath = path.resolve(
  infraRoot,
  "../agentcore/deployment-package.zip",
);
export const lockFilePath = path.resolve(projectRoot, "pnpm-lock.yaml");
