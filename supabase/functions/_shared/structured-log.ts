/**
 * Structured Logging Helper for Edge Functions
 *
 * Provides consistent, machine-parseable log output with:
 *   - request_id (unique per invocation)
 *   - idempotency_key (when applicable)
 *   - actor (user/admin/service/webhook)
 *   - action
 *   - status (ok / error / duplicate / denied)
 *   - duration_ms
 *
 * Usage:
 *   const log = createLogger("generate-pix", req);
 *   log.info("payment_created", { payment_id: 123 });
 *   log.warn("duplicate_request", { key: idempKey });
 *   log.error("mp_api_error", { status: 500 });
 *   log.done({ processed: 1 }); // auto-calculates duration_ms
 */

export interface LogContext {
  function_name: string;
  request_id: string;
  idempotency_key?: string;
  actor?: string;
  actor_type?: "user" | "admin" | "service" | "webhook" | "cron" | "anonymous";
}

export interface StructuredLogger {
  ctx: LogContext;
  setActor(id: string, type: LogContext["actor_type"]): void;
  setIdempotencyKey(key: string): void;
  info(action: string, meta?: Record<string, unknown>): void;
  warn(action: string, meta?: Record<string, unknown>): void;
  error(action: string, meta?: Record<string, unknown>): void;
  done(meta?: Record<string, unknown>): void;
}

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLogger(functionName: string, _req?: Request): StructuredLogger {
  const startTime = Date.now();
  const ctx: LogContext = {
    function_name: functionName,
    request_id: generateRequestId(),
  };

  function emit(level: "INFO" | "WARN" | "ERROR", action: string, meta?: Record<string, unknown>) {
    const entry: Record<string, unknown> = {
      level,
      fn: ctx.function_name,
      rid: ctx.request_id,
      action,
      ts: new Date().toISOString(),
    };
    if (ctx.idempotency_key) entry.idk = ctx.idempotency_key;
    if (ctx.actor) entry.actor = ctx.actor;
    if (ctx.actor_type) entry.actor_type = ctx.actor_type;
    if (meta) Object.assign(entry, meta);

    const msg = `[${ctx.function_name}] ${JSON.stringify(entry)}`;
    if (level === "ERROR") console.error(msg);
    else if (level === "WARN") console.warn(msg);
    else console.log(msg);
  }

  return {
    ctx,
    setActor(id: string, type: LogContext["actor_type"]) {
      ctx.actor = id;
      ctx.actor_type = type;
    },
    setIdempotencyKey(key: string) {
      ctx.idempotency_key = key;
    },
    info(action, meta) { emit("INFO", action, meta); },
    warn(action, meta) { emit("WARN", action, meta); },
    error(action, meta) { emit("ERROR", action, meta); },
    done(meta) {
      emit("INFO", "done", { duration_ms: Date.now() - startTime, ...meta });
    },
  };
}
