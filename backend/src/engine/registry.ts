import { NodeHandler } from './types';
import { logger } from '../utils/logger';

class NodeHandlerRegistry {
  private readonly handlers = new Map<string, NodeHandler>();

  register(handler: NodeHandler): void {
    if (this.handlers.has(handler.type)) {
      throw new Error(
        `Handler for node type "${handler.type}" is already registered`
      );
    }
    this.handlers.set(handler.type, handler);
    logger.debug({ type: handler.type }, '[registry] registered node handler');
  }

  get(type: string): NodeHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      logger.error(
        { type, registeredTypes: this.list() },
        '[registry] no handler found for node type'
      );
      throw new Error(
        `No handler registered for node type "${type}". ` +
          `Registered types: [${this.list().join(', ')}]`
      );
    }
    return handler;
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  list(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton — shared across the entire app
export const registry = new NodeHandlerRegistry();
