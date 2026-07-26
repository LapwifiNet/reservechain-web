# Trademarks

## The licence covers code, not names

This repository is licensed under Apache License 2.0. Section 6 of that licence grants **no
trademark rights**:

> This License does not grant permission to use the trade names, trademarks, service marks,
> or product names of the Licensor, except as required for reasonable and customary use in
> describing the origin of the Work and reproducing the content of the NOTICE file.

The copyright licence over the code and the absence of any trademark licence are separate
and independent. Receiving the code under Apache 2.0 gives you no right to the name it was
built under.

## What is not licensed here

"ReserveChain", "ReserveChain.io", the `reservechain.io` domain, and any associated logos,
wordmarks and visual identity are the property of the prospective client. They appear in
this repository only to identify the work as having been built against that client's brief.

**No trademark licence is granted by this repository, expressly or by implication.**

## Obligations when redistributing or deploying

If you redistribute this code or deploy it anywhere, you must not use the ReserveChain name
or brand. Rename the project and remove the brand references before operating any public
deployment.

Brand strings are not confined to documentation. They appear in at least the following
places, and all of them must be replaced when renaming:

| Where | What appears |
| --- | --- |
| Page titles and site metadata | The product name in user-facing titles |
| Package names | `reservechain-web`, `reservechain-api`, `reservechain-admin`, `reservechain-cms` |
| Solidity contract name | The token contract's declared name |
| Contract revert strings | Error strings prefixed with the brand |
| CMS admin title suffix | The Payload admin UI title suffix |

This list is a starting point for the rename, not a guarantee of completeness. Search the
tree for the brand string before publishing anything.

## Renaming does not affect the code licence

Removing the brand is a trademark obligation, not a licence restriction. The Apache 2.0
grant over the code stands on its own terms regardless of what the project is renamed to.

See [README.md](README.md) for the ownership and licensing summary, and [LICENSE](LICENSE)
for the full licence text.
