export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data, meta, status = 200) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};
export const created = (res, data) => ok(res, data, undefined, 201);

export function parsePaging(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

// Runs a find + count and sends the standard paginated response
export async function paginate(res, Model, filter, query, { sort = { createdAt: -1 }, populate, select, map } = {}) {
  const { page, limit, skip } = parsePaging(query);
  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (populate) q = q.populate(populate);
  if (select) q = q.select(select);
  const [rows, total] = await Promise.all([q.lean(), Model.countDocuments(filter)]);
  return ok(res, map ? rows.map(map) : rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
