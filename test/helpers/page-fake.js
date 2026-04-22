export const normalPage = (bodyHtml) =>
    `<html><head><title>Example Page</title></head><body>${bodyHtml}</body></html>`;

export const articlePage = () =>
    normalPage('<article><h1>Heading</h1><p>Page content.</p></article>');
