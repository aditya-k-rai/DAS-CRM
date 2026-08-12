import { BullQueueEvent, BullQueueEventOptions, QueueEventDecoratorOptions } from '../bull.types';
/**
 * @publicApi
 */
export declare const OnQueueEvent: (eventNameOrOptions: BullQueueEvent | BullQueueEventOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueError: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueWaiting: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueActive: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueStalled: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueProgress: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueCompleted: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueFailed: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueuePaused: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueResumed: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueCleaned: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueDrained: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnQueueRemoved: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueError: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueWaiting: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueActive: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueStalled: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueProgress: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueCompleted: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueFailed: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueuePaused: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueResumed: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueCleaned: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueDrained: (options?: QueueEventDecoratorOptions) => MethodDecorator;
/**
 * @publicApi
 */
export declare const OnGlobalQueueRemoved: (options?: QueueEventDecoratorOptions) => MethodDecorator;
//# sourceMappingURL=queue-hooks.decorators.d.ts.map