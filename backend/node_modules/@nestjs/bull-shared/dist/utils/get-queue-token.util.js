"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueToken = getQueueToken;
function getQueueToken(name) {
    return name ? `BullQueue_${name}` : 'BullQueue_default';
}
