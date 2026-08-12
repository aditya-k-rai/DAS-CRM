"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnGlobalQueueRemoved = exports.OnGlobalQueueDrained = exports.OnGlobalQueueCleaned = exports.OnGlobalQueueResumed = exports.OnGlobalQueuePaused = exports.OnGlobalQueueFailed = exports.OnGlobalQueueCompleted = exports.OnGlobalQueueProgress = exports.OnGlobalQueueStalled = exports.OnGlobalQueueActive = exports.OnGlobalQueueWaiting = exports.OnGlobalQueueError = exports.OnQueueRemoved = exports.OnQueueDrained = exports.OnQueueCleaned = exports.OnQueueResumed = exports.OnQueuePaused = exports.OnQueueFailed = exports.OnQueueCompleted = exports.OnQueueProgress = exports.OnQueueStalled = exports.OnQueueActive = exports.OnQueueWaiting = exports.OnQueueError = exports.OnQueueEvent = void 0;
const common_1 = require("@nestjs/common");
const bull_constants_1 = require("../bull.constants");
const enums_1 = require("../enums");
/**
 * @publicApi
 */
const OnQueueEvent = (eventNameOrOptions) => (0, common_1.SetMetadata)(bull_constants_1.BULL_MODULE_ON_QUEUE_EVENT, typeof eventNameOrOptions === 'string'
    ? { eventName: eventNameOrOptions }
    : eventNameOrOptions);
exports.OnQueueEvent = OnQueueEvent;
/**
 * @publicApi
 */
const OnQueueError = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.ERROR });
exports.OnQueueError = OnQueueError;
/**
 * @publicApi
 */
const OnQueueWaiting = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.WAITING });
exports.OnQueueWaiting = OnQueueWaiting;
/**
 * @publicApi
 */
const OnQueueActive = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.ACTIVE });
exports.OnQueueActive = OnQueueActive;
/**
 * @publicApi
 */
const OnQueueStalled = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.STALLED });
exports.OnQueueStalled = OnQueueStalled;
/**
 * @publicApi
 */
const OnQueueProgress = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.PROGRESS });
exports.OnQueueProgress = OnQueueProgress;
/**
 * @publicApi
 */
const OnQueueCompleted = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.COMPLETED });
exports.OnQueueCompleted = OnQueueCompleted;
/**
 * @publicApi
 */
const OnQueueFailed = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.FAILED });
exports.OnQueueFailed = OnQueueFailed;
/**
 * @publicApi
 */
const OnQueuePaused = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.PAUSED });
exports.OnQueuePaused = OnQueuePaused;
/**
 * @publicApi
 */
const OnQueueResumed = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.RESUMED });
exports.OnQueueResumed = OnQueueResumed;
/**
 * @publicApi
 */
const OnQueueCleaned = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.CLEANED });
exports.OnQueueCleaned = OnQueueCleaned;
/**
 * @publicApi
 */
const OnQueueDrained = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.DRAINED });
exports.OnQueueDrained = OnQueueDrained;
/**
 * @publicApi
 */
const OnQueueRemoved = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueEvents.REMOVED });
exports.OnQueueRemoved = OnQueueRemoved;
/**
 * @publicApi
 */
const OnGlobalQueueError = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.ERROR });
exports.OnGlobalQueueError = OnGlobalQueueError;
/**
 * @publicApi
 */
const OnGlobalQueueWaiting = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.WAITING });
exports.OnGlobalQueueWaiting = OnGlobalQueueWaiting;
/**
 * @publicApi
 */
const OnGlobalQueueActive = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.ACTIVE });
exports.OnGlobalQueueActive = OnGlobalQueueActive;
/**
 * @publicApi
 */
const OnGlobalQueueStalled = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.STALLED });
exports.OnGlobalQueueStalled = OnGlobalQueueStalled;
/**
 * @publicApi
 */
const OnGlobalQueueProgress = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.PROGRESS });
exports.OnGlobalQueueProgress = OnGlobalQueueProgress;
/**
 * @publicApi
 */
const OnGlobalQueueCompleted = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.COMPLETED });
exports.OnGlobalQueueCompleted = OnGlobalQueueCompleted;
/**
 * @publicApi
 */
const OnGlobalQueueFailed = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.FAILED });
exports.OnGlobalQueueFailed = OnGlobalQueueFailed;
/**
 * @publicApi
 */
const OnGlobalQueuePaused = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.PAUSED });
exports.OnGlobalQueuePaused = OnGlobalQueuePaused;
/**
 * @publicApi
 */
const OnGlobalQueueResumed = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.RESUMED });
exports.OnGlobalQueueResumed = OnGlobalQueueResumed;
/**
 * @publicApi
 */
const OnGlobalQueueCleaned = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.CLEANED });
exports.OnGlobalQueueCleaned = OnGlobalQueueCleaned;
/**
 * @publicApi
 */
const OnGlobalQueueDrained = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.DRAINED });
exports.OnGlobalQueueDrained = OnGlobalQueueDrained;
/**
 * @publicApi
 */
const OnGlobalQueueRemoved = (options) => (0, exports.OnQueueEvent)({ ...options, eventName: enums_1.BullQueueGlobalEvents.REMOVED });
exports.OnGlobalQueueRemoved = OnGlobalQueueRemoved;
