"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineCommand = defineCommand;
exports.defineEvent = defineEvent;
function defineCommand(command) {
    return command;
}
/** Event fayllarida tip xavfsizligini saqlagan holda handler yaratish. */
function defineEvent(name, execute, once = false) {
    return { name, once, execute: execute };
}
//# sourceMappingURL=types.js.map