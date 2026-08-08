# Trademarks and naming

## Short version

The **code** is Apache-2.0: fork it, ship it, sell it, no permission needed.
The **name** is not part of that licence.

## What this covers

"OpenRWA", the token symbol "ORWA", and the project logo are the identity of
this project. They are unregistered marks. The project claims common-law rights
only, and asserts nothing beyond distinguishing this project from forks of it.

## What you may do

- Fork the repository and keep the name in the git history, commit messages and
  the `NOTICE` file. You must keep `NOTICE`; Apache-2.0 requires it.
- Say your product is "built on OpenRWA", "a fork of OpenRWA" or "compatible
  with OpenRWA". Accurate, factual references are always fine.
- Use the name in articles, talks, comparisons and academic work.
- Contribute back under the project name.

## What you may not do

- Name your product, company, token, domain or app "OpenRWA", or anything close
  enough to be confused with it.
- Use the logo as your own product's logo, or in any way that implies this
  project endorses, certifies, audits or supports your deployment.
- Present a modified deployment as the official OpenRWA project.

If a reasonable person could mistake your deployment for the upstream project,
rename it.

## Renaming a fork

Everywhere the upstream name appears:

| Location | What to change |
| --- | --- |
| Site metadata | `src/lib/meta.ts`, `src/lib/seo.ts`, `src/app/[locale]/layout.tsx` |
| Locale copy | `src/messages/en.json`, `es.json`, `it.json` |
| Package names | root `package.json`, and `api/`, `admin/`, `cms/`, `mobile/` |
| Contract | Solidity contract name, constructor name and symbol, revert string prefixes |
| CMS | admin panel title suffix in `cms/src/payload.config.ts` |
| Mobile | `mobile/app.json` name, slug and bundle identifier |
| Containers | database and user names in `docker-compose*.yml` and `.env*.example` |
| Docs | `README.md`, `docs/`, and this file |

When you are done, `grep -ri openrwa .` should return nothing except licence
headers and the `NOTICE` attribution.

## Contact

Questions about naming: t@lapwifi.net
