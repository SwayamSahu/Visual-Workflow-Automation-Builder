import { registry } from './engine/registry';
import { WebhookHandler } from './nodes/webhook.handler';
import { TransformHandler } from './nodes/transform.handler';
import { AIHandler } from './nodes/ai.handler';
import { ConditionHandler } from './nodes/condition.handler';
import { EmailHandler } from './nodes/email.handler';
import { StoreHandler } from './nodes/store.handler';
import { DelayHandler } from './nodes/delay.handler';

/**
 * Registers all built-in node handlers into the global registry.
 *
 * ─── Adding a new node type ───────────────────────────────────────────────────
 * 1. Create backend/src/nodes/yourtype.handler.ts implementing NodeHandler
 * 2. Import it here and call registry.register(new YourTypeHandler())
 * 3. That's it — executor, routes, and DB need zero changes
 */
export function registerNodes(): void {
  registry.register(new WebhookHandler());
  registry.register(new TransformHandler());
  registry.register(new AIHandler());
  registry.register(new ConditionHandler());
  registry.register(new EmailHandler());
  registry.register(new StoreHandler());
  registry.register(new DelayHandler());
}
