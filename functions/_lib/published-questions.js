// The question data the site ships, built by `npm run build:questions`.
//
// This is a .js file on purpose: `generated/` is not in git, so the type
// check and the unit tests must not need it. Its type is declared in
// published-questions.d.ts (`unknown`); catalog.ts checks the shape at start.
// Cloudflare Pages runs the site build first and bundles the route files
// after it, so the file exists when this import is bundled.
import published from "../../generated/questions.json" with { type: "json" };

export default published;
