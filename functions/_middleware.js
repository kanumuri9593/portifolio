// sai.oneenergytogether.com serves the /sai/ folder at its root.
// Every other host passes straight through to the static site.
export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  if (url.hostname === "sai.oneenergytogether.com" && !url.pathname.startsWith("/sai/")) {
    url.pathname = "/sai" + url.pathname;
    const res = await ctx.env.ASSETS.fetch(new Request(url.toString(), ctx.request));
    if (res.status === 404) return ctx.next();
    return res;
  }
  return ctx.next();
}
