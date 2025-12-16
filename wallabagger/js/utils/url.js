'use strict';

/**
 * @param {string} url
 * @returns {Promise<string>}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
 */
const hashUrl = async (url) => {
    const urlByteArray = new TextEncoder().encode(url);
    const hash = await crypto.subtle.digest('SHA-1', urlByteArray);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''); // convert bytes to hex string
    return hashHex;
};

export { hashUrl };
