export class SlidingWindowLimiter {
  constructor(policies, { maxKeys = 10_000 } = {}) {
    this.policies = [...policies].sort((a, b) => a.windowMs - b.windowMs);
    this.maxWindowMs = Math.max(...this.policies.map(({ windowMs }) => windowMs));
    this.maxKeys = maxKeys;
    this.events = new Map();
  }

  consume(key, now = Date.now()) {
    for (const [storedKey, timestamps] of this.events) {
      const live = timestamps.filter((time) => time > now - this.maxWindowMs);
      if (live.length) this.events.set(storedKey, live);
      else this.events.delete(storedKey);
    }
    if (!this.events.has(key) && this.events.size >= this.maxKeys) {
      return { allowed: false, retryAfter: 60 };
    }
    const recent = (this.events.get(key) ?? []).filter((time) => time > now - this.maxWindowMs);
    for (const { limit, windowMs } of this.policies) {
      const inWindow = recent.filter((time) => time > now - windowMs);
      if (inWindow.length >= limit) {
        return {
          allowed: false,
          retryAfter: Math.max(1, Math.ceil((inWindow[0] + windowMs - now) / 1000)),
        };
      }
    }
    recent.push(now);
    this.events.set(key, recent);
    return { allowed: true };
  }
}

export class DuplicateGuard {
  constructor({ acceptedMs, inFlightMs, maxEntries = 10_000 }) {
    this.acceptedMs = acceptedMs;
    this.inFlightMs = inFlightMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  claim(fingerprint, now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    const current = this.entries.get(fingerprint);
    if (current && current.expiresAt > now) return "duplicate";
    if (this.entries.size >= this.maxEntries) return "duplicate";
    this.entries.set(fingerprint, { state: "in_flight", expiresAt: now + this.inFlightMs });
    return "claimed";
  }

  commit(fingerprint, now = Date.now()) {
    this.entries.set(fingerprint, { state: "accepted", expiresAt: now + this.acceptedMs });
  }

  release(fingerprint) {
    const current = this.entries.get(fingerprint);
    if (current?.state === "in_flight") this.entries.delete(fingerprint);
  }
}
