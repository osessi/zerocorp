/**
 * @zerocorp/ui — Layer 4
 *
 * React components for the authenticated product: the apps/app back-office and admin
 * console. Built strictly on @zerocorp/design-system tokens.
 *
 * Shared by every authenticated surface so components are never duplicated. This is not
 * the tenant website system — that is @zerocorp/site-renderer, which owns a separate
 * theme system. docs/DESIGN_SYSTEM.md §15 and §16.
 *
 * Approved components are registered in docs/DESIGN_SYSTEM.md §19. Nothing lands here
 * without a licence review and adaptation to ZeroCorp tokens.
 */
export * from "./field/index";
