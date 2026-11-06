// saigangula.com serves the /sai/ folder at its root.
// Old addresses (sai.oneenergytogether.com, www, and yeswanth.oneenergytogether.com/sai/)
// redirect there so links and printed QR codes keep working.
// Every other host passes straight through to the static site.
const SAI = "saigangula.com";
export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const host = url.hostname;
  if (host === "www." + SAI || host === "sai.oneenergytogether.com") {
    return Response.redirect(`https://${SAI}${url.pathname}${url.search}`, 301);
  }
  if (host === "yeswanth.oneenergytogether.com" && (url.pathname === "/sai" || url.pathname.startsWith("/sai/"))) {
    return Response.redirect(`https://${SAI}${url.pathname.slice(4) || "/"}${url.search}`, 301);
  }
  if (host === SAI && !url.pathname.startsWith("/sai/")) {
    url.pathname = "/sai" + url.pathname;
    const res = await ctx.env.ASSETS.fetch(new Request(url.toString(), ctx.request));
    if (res.status === 404) return ctx.next();
    return res;
  }
  return ctx.next();
}
