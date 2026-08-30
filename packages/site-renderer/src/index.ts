/**
 * @zerocorp/site-renderer — Layer 4
 *
 * The multi-tenant website engine: block registry, block components, variant
 * enums, theme resolution and the page renderer.
 *
 * Sites are data, not code. A model may choose an approved block type, an
 * approved variant, approved theme tokens and the content. It may never emit
 * HTML, CSS or React.
 *
 * Kept as a package rather than living inside apps/sites so the renderer can be
 * tested in isolation and so apps/sites stays a thin deployment shell.
 */
export const SITE_RENDERER_PACKAGE = "@zerocorp/site-renderer" as const;
