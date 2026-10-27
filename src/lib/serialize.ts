/**
 * Recursively serializes any value so it is safe to pass from Next.js Server Components to Client Components.
 * Converts MongoDB ObjectId instances, Date objects, and other non-plain data types into plain strings or primitives,
 * converts subdocument/document `_id` to string or removes it when `id` is present, and strips out `__v` and prototype methods.
 */
export function serialize<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  function cleanValue(item: any): any {
    if (item === null || item === undefined) return item;
    if (typeof item !== "object") return item;

    if (Array.isArray(item)) {
      return item.map(cleanValue);
    }

    if (item instanceof Date) {
      return item.toISOString();
    }

    // Check for MongoDB ObjectId (has toHexString or _bsontype)
    if (item._bsontype === "ObjectID" || (typeof item.toHexString === "function" && typeof item.equals === "function")) {
      return item.toString();
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(item)) {
      if (key === "__v") continue;
      if (key === "_id") {
        if (!item.id) {
          result.id = typeof value === "object" && value !== null ? value.toString() : String(value);
        }
        continue;
      }
      result[key] = cleanValue(value);
    }
    return result;
  }

  // Double safe: run deep cleaner then JSON parse/stringify cycle
  const cleaned = cleanValue(data);
  return JSON.parse(JSON.stringify(cleaned));
}
