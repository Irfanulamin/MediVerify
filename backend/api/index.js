// Thin JS shim so Vercel does NOT recompile Nest's TypeScript with its own
// bundler (which strips emitDecoratorMetadata and breaks Nest's DI). We point
// at the output of `nest build` (proper tsc) instead. vercel.json runs the build.
module.exports = require('../dist/serverless').default;
