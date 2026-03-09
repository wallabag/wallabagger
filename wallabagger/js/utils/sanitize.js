'use strict';

const entitiesMap = {
    '&': '&amp;',
    '\'': '&#039;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;'
};

const decodeStr = (param) => {
    const propRegExp = new RegExp(Object.values(entitiesMap).join('|'), 'g');
    const getKeyByValue = (object, value) => {
        return Object.keys(object).find(key => object[key] === value);
    };

    return param.replace(propRegExp, match => getKeyByValue(entitiesMap, match));
};

const encodeStr = (str) => {
    return entitiesMap[str];
};

const sanitize = (param) => {
    const propRegExp = new RegExp(Object.keys(entitiesMap).join("|"), 'g');
    return param.replace(propRegExp, match => encodeStr(match));
};

export { decodeStr, sanitize };
