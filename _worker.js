const hostname = 'higherstandards.petruandines.com';
const pagesHostname = 'petruandines-higher-standards.pages.dev';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === pagesHostname || url.hostname.endsWith(`.${pagesHostname}`)) {
      url.protocol = 'https:';
      url.hostname = hostname;
      url.port = '';
      return new Response(null, {status: 301, headers: {Location: url.toString()}});
    }
    if (url.hostname !== hostname) return new Response('Not found', {status: 404});
    if (url.protocol !== 'https:') {
      url.protocol = 'https:';
      return new Response(null, {status: 301, headers: {Location: url.toString()}});
    }
    return env.ASSETS.fetch(request);
  }
};
