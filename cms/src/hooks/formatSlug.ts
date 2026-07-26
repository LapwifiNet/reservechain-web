import type { FieldHook } from "payload/types";

const toSlug = (val: string): string =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * beforeValidate field hook: normalise an explicit slug, or derive one from the
 * given fallback field (e.g. "title") when the slug is empty.
 */
export const formatSlug =
  (fallback: string): FieldHook =>
  ({ value, originalDoc, data }) => {
    if (typeof value === "string" && value.length > 0) return toSlug(value);
    const source = data?.[fallback] ?? originalDoc?.[fallback];
    if (typeof source === "string" && source.length > 0) return toSlug(source);
    return value;
  };

export default formatSlug;
