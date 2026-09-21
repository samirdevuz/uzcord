"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE_LABELS = exports.LOCALES = void 0;
exports.isLocale = isLocale;
exports.t = t;
exports.createTranslator = createTranslator;
const uz_1 = require("./uz");
const ru_1 = require("./ru");
const en_1 = require("./en");
const TABLES = { uz: uz_1.uz, ru: ru_1.ru, en: en_1.en };
exports.LOCALES = ['uz', 'ru', 'en'];
exports.LOCALE_LABELS = {
    uz: "O'zbekcha",
    ru: 'Русский',
    en: 'English',
};
function isLocale(value) {
    return exports.LOCALES.includes(value);
}
function format(template, vars) {
    if (!vars)
        return template;
    return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, key) => {
        const value = vars[key];
        return value === undefined || value === null ? match : String(value);
    });
}
/** Tarjimani oladi; topilmasa o'zbekchaga, u ham bo'lmasa kalitning o'ziga qaytadi. */
function t(locale, key, vars) {
    const table = (isLocale(locale) ? TABLES[locale] : uz_1.uz);
    const template = table[key] ?? uz_1.uz[key] ?? key;
    return format(template, vars);
}
function createTranslator(locale) {
    return (key, vars) => t(locale, key, vars);
}
//# sourceMappingURL=index.js.map