import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const popupHtml = readFileSync(resolve(import.meta.dirname, '../../wallabagger/popup.html'), 'utf8');

describe('popup translations', () => {
    let Common;

    beforeAll(async () => {
        globalThis.browser = {
            i18n: {
                getMessage: (key) => `translated:${key}`,
                getUILanguage: () => 'de'
            }
        };
        ({ Common } = await import('../../wallabagger/js/common.js'));
        document.body.innerHTML = popupHtml.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
        Common.translateAll();
    });

    afterAll(() => {
        delete globalThis.browser;
    });

    it.each([
        ['card-title', 'Go_to_Wallabag_s_article_page'],
        ['entry-url', 'Go_to_this_article_page'],
        ['edit-icon', 'Edit_the_Wallabag_title_of_this_article'],
        ['archived-icon', 'Set_this_article_as_archived_into_Wallabag'],
        ['starred-icon', 'Set_this_article_as_starred_into_Wallabag'],
        ['delete-icon', 'Remove_this_article_from_Wallabag'],
    ])('translates the tooltip of #%s', (id, key) => {
        expect(document.getElementById(id).getAttribute('title')).toBe(`translated:${key}`);
    });
});
