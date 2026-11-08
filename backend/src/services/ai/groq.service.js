import config from '../../config/env.js';
import logger from '../../config/logger.js';
import { todayStr } from '../../utils/dates.js';

export class AiUnavailableError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code; // not-configured | daily-limit | circuit-open | all-failed | bad-output
  }
}

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Groq client built for FREE-tier keys, where limits are tight:
 *  - several API keys and several models: tried in order (best model across all keys first, then the next model)
 *  - a 429 puts that key+model on cooldown (honours Retry-After) and moves straight on
 *  - bad/revoked keys are switched off for the session, retired models are skipped for an hour
 *  - our own daily call cap, a response cache, and a circuit breaker that fails fast when everything is down
 * When it throws AiUnavailableError the caller uses its built-in (non-AI) fallback.
 */
export class GroqClient {
  constructor({
    keys = config.groq.keys,
    models = config.groq.models,
    dailyLimit = config.groq.dailyLimit,
    timeoutMs = 12000,
    fetchImpl = (...a) => fetch(...a),
    now = () => Date.now(),
    today = todayStr,
    log = logger,
  } = {}) {
    this.keys = keys;
    this.models = models;
    this.dailyLimit = dailyLimit;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
    this.now = now;
    this.today = today;
    this.log = log;
    this.cooldown = new Map(); // `${keyIndex}:${model}` -> until (ms)
    this.deadKeys = new Set();
    this.cache = new Map(); // cacheKey -> { until, value }
    this.counter = { day: today(), calls: 0 };
    this.breaker = { fails: 0, openUntil: 0 };
  }

  isConfigured() { return this.keys.length > 0 && this.models.length > 0; }

  stats() {
    const day = this.today();
    if (this.counter.day !== day) this.counter = { day, calls: 0 };
    return {
      configured: this.isConfigured(),
      keys: this.keys.length,
      keysUsable: this.keys.length - this.deadKeys.size,
      models: this.models,
      callsToday: this.counter.calls,
      dailyLimit: this.dailyLimit,
      circuitOpen: this.breaker.openUntil > this.now(),
    };
  }

  #cool(keyIndex, model, ms) { this.cooldown.set(`${keyIndex}:${model}`, this.now() + ms); }

  async #request(key, model, { messages, json, maxTokens, temperature }) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      return await this.fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model, messages, temperature,
          // GPT-OSS models "think" before answering and those tokens count towards the limit:
          // keep the thinking short and leave headroom so the visible answer is never cut off
          ...(/gpt-oss/i.test(model) ? { reasoning_effort: 'low', max_tokens: maxTokens + 700 } : { max_tokens: maxTokens }),
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /** Returns { text, model, cached }. Throws AiUnavailableError when no AI answer can be had. */
  async complete({ messages, json = false, maxTokens = 400, temperature = 0.4, cacheKey, ttlMs = 0 }) {
    if (!this.isConfigured()) throw new AiUnavailableError('not-configured', 'Groq is not configured');

    if (cacheKey) {
      const hit = this.cache.get(cacheKey);
      if (hit && hit.until > this.now()) return { ...hit.value, cached: true };
    }
    const st = this.stats();
    if (st.callsToday >= this.dailyLimit) throw new AiUnavailableError('daily-limit', 'Daily AI call limit reached');
    if (this.breaker.openUntil > this.now()) throw new AiUnavailableError('circuit-open', 'AI temporarily unavailable');

    const errors = [];
    for (const model of this.models) {
      for (let k = 0; k < this.keys.length; k += 1) {
        if (this.deadKeys.has(k)) continue;
        if ((this.cooldown.get(`${k}:${model}`) || 0) > this.now()) continue;
        try {
          const res = await this.#request(this.keys[k], model, { messages, json, maxTokens, temperature });
          if (res.ok) {
            const body = await res.json();
            const text = body?.choices?.[0]?.message?.content?.trim();
            if (!text) { errors.push(`${model}: empty`); this.#cool(k, model, 30_000); continue; }
            this.counter.calls += 1;
            this.breaker.fails = 0;
            const value = { text, model, usage: body.usage };
            if (cacheKey && ttlMs) this.cache.set(cacheKey, { until: this.now() + ttlMs, value });
            return { ...value, cached: false };
          }
          if (res.status === 429) {
            const wait = Number(res.headers?.get?.('retry-after')) * 1000 || 30_000;
            this.#cool(k, model, Math.min(wait, 10 * 60_000));
            errors.push(`${model}/key${k}: rate limited`);
          } else if (res.status === 401 || res.status === 403) {
            this.deadKeys.add(k);
            this.log.warn({ keyIndex: k, status: res.status }, 'Groq key rejected; disabled for this session');
            errors.push(`key${k}: rejected`);
          } else if (res.status === 404 || res.status === 400) {
            this.#cool(k, model, 60 * 60_000); // retired/unsupported model or bad request for it
            errors.push(`${model}: ${res.status}`);
          } else {
            this.#cool(k, model, 20_000);
            errors.push(`${model}: ${res.status}`);
          }
        } catch (err) {
          this.#cool(k, model, 20_000);
          errors.push(`${model}: ${err.name === 'AbortError' ? 'timeout' : 'network'}`);
        }
      }
    }
    this.breaker.fails += 1;
    if (this.breaker.fails >= 3) this.breaker.openUntil = this.now() + 60_000;
    this.log.warn({ errors }, 'Groq unavailable; using built-in fallback');
    throw new AiUnavailableError('all-failed', errors.join('; ') || 'no usable key or model');
  }
}

export const groq = new GroqClient();
