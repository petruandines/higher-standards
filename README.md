# Petru & Inés — Higher Standards

Official static website for **Petru & Inés — Higher Standards**, focused on aircraft cleaning, detailing and cabin care in Romania.

## Deployment

This static website is hosted on Cloudflare Pages. GitHub Pages retains the old-address redirect.

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

Public URL: `https://higherstandards.petruandines.com/`

## Notes

- No pricing is displayed.
- Contact is routed to phone, WhatsApp and email.
- Product references are presented as representative aviation-specific products used in the working kit.

## Publication

The `main` branch is automatically published to the separate Cloudflare Pages project
`petruandines-higher-standards` by `.github/workflows/cloudflare-pages.yml`.
The repository secret `CLOUDFLARE_API_TOKEN` is used only inside GitHub Actions.

Public assets are copied to `dist-pages`; scripts, workflow files, Git metadata,
and the GitHub Pages `CNAME` file are excluded from the Cloudflare upload.
The `CNAME` keeps GitHub Pages associated with the new hostname so old project
URLs can redirect to the canonical site. DNS points to Cloudflare Pages.

`_worker.js` redirects the project `.pages.dev` address and its deployment aliases
to the canonical hostname with HTTP 301, preserving path and query parameters.
The canonical hostname serves static assets directly, preventing redirect loops.

Deployment verifies HTTPS, key assets, and that the main Pages project, unrelated
DNS records and the main homepage have remained unchanged.
