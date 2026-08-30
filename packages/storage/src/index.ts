/**
 * @zerocorp/storage — Layer 3
 *
 * Object storage behind a port. Identity documents live in a dedicated private
 * bucket with short-lived signed URLs, access logging and a deletion policy.
 * File contents never appear in application logs.
 */
export const STORAGE_PACKAGE = "@zerocorp/storage" as const;
