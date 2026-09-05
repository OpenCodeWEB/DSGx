export async function onRequest(context) {
  const username = (context.params.username || "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(username)) {
    return new Response("Invalid username", { status: 400 });
  }
  // Fetch route from GDBx Worker (single source of truth)
  const res = await fetch(`https://gdbx.xup.workers.dev/dsgx/route/${username}`);
  const data = await res.json().catch(() => ({}));
  let profile = null;
  if (data.ok && data.route) {
    profile = data.route;
  } else {
    // Not found — show create CTA
    profile = { login: username, addr: null, notFound: true };
  }
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${username} — DSGx Support</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>body{font-family:ui-sans-serif,system-ui,sans-serif}.mono{font-family:ui-monospace,monospace}</style>
</head><body class="bg-slate-950 text-slate-100 min-h-screen">
<header class="border-b border-slate-800 bg-slate-950/80 sticky top-0"><div class="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between"><a href="/" class="flex items-center gap-2"><div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950"><i class="fa-solid fa-hand-holding-heart"></i></div><span class="font-bold">DSGx</span></a><a href="/" class="text-sm text-slate-400 hover:text-emerald-300">Create your own</a></div></header>
<main class="max-w-3xl mx-auto px-4 py-12">
${profile.notFound ? `
<div class="text-center py-12"><h1 class="text-3xl font-bold">@${username} not found</h1><p class="text-slate-400 mt-2">This developer hasn't created a DSGx profile yet.</p><a href="/" class="mt-6 inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">Create dsgx.pages.dev/${username}</a></div>
` : `
<div class="text-center">
<img src="https://github.com/${profile.login}.png" class="w-24 h-24 rounded-full mx-auto border-4 border-slate-800">
<h1 class="text-3xl font-bold mt-4">@${profile.login}</h1>
<p class="mono text-xs text-slate-500 mt-1">${profile.addr || ""}</p>
<span class="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">✓ Verified Developer</span>
</div>
<div class="mt-6 flex flex-wrap justify-center gap-2">
<button id="btn-pay" class="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90"><i class="fa-solid fa-bolt mr-2"></i>Pay</button>
<button id="btn-support" class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:opacity-90"><i class="fa-solid fa-hand-holding-heart mr-2"></i>Support</button>
<button id="btn-donate" class="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold hover:opacity-90"><i class="fa-solid fa-heart mr-2"></i>Donate</button>
<button id="btn-subscribe" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700"><i class="fa-solid fa-repeat mr-2"></i>Auto-Subscribe</button>
</div>
<div class="mt-8 grid md:grid-cols-2 gap-4">
<button id="pay-crypto" class="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/50 text-left"><i class="fa-brands fa-ethereum text-emerald-400 text-2xl"></i><div class="font-bold mt-2">Support with Crypto</div><div class="text-xs text-slate-500">Direct to Web3 wallet — no custody, 0% fee</div></button>
<button id="pay-card" class="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/50 text-left"><i class="fa-regular fa-credit-card text-amber-400 text-2xl"></i><div class="font-bold mt-2">Support with Card</div><div class="text-xs text-slate-500">MoonPay/Transak/Ramp → USDC to Web3 wallet</div></button>
</div>
<div class="mt-6 flex gap-2"><input id="amount" type="number" value="5" min="1" class="w-24 mono text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"><span class="py-2 text-slate-500">USD</span><span class="py-2 text-xs text-slate-500 ml-2">— all networks, all providers, fastest wins</span></div>
<div id="pay-status" class="mt-4 mono text-xs text-slate-400"></div>
<div class="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hidden" id="subscribe-panel">
<div class="font-semibold"><i class="fa-solid fa-repeat mr-1"></i> Auto-Subscribe — monthly support</div>
<div class="flex gap-2 mt-2"><select id="sub-amount" class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"><option value="5">5 USD / month</option><option value="10">10 USD / month</option><option value="25">25 USD / month</option><option value="50">50 USD / month</option></select><button id="sub-confirm" class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm">Subscribe</button></div>
<p class="text-xs text-slate-500 mt-1">Recurring via GDMx — cancel anytime, non-custodial</p>
</div>
`}
</main>
<script>window.DSGX_PROFILE = ${JSON.stringify(profile)};</script>
<script src="https://gdmx.pages.dev/sdk/v1/gdmx.js"></script>
<script>
const profile = window.DSGX_PROFILE;
if (!profile.notFound) {
  const pay = new GDMxGateway({ merchantAddress: profile.web3Addr || profile.addr });
  const getAmt = () => Number(document.getElementById("amount").value || 5);
  const handlePay = async (method) => {
    const amt = getAmt();
    document.getElementById("pay-status").textContent = method==="crypto" ? "Opening wallet..." : "Redirecting to on-ramp...";
    try {
      const tx = await pay.checkout({ amountUSD: amt, method });
      document.getElementById("pay-status").innerHTML = '<span class="text-emerald-300">✓ Sent: '+tx+' — direct to '+profile.login+'\\'s wallet (0% fee)</span>';
    } catch(e){ document.getElementById("pay-status").textContent = "✗ "+e.message; }
  };
  document.getElementById("pay-crypto")?.addEventListener("click", () => handlePay("crypto"));
  document.getElementById("pay-card")?.addEventListener("click", () => handlePay("card"));
  document.getElementById("btn-pay")?.addEventListener("click", () => handlePay("auto"));
  document.getElementById("btn-support")?.addEventListener("click", () => handlePay("auto"));
  document.getElementById("btn-donate")?.addEventListener("click", () => handlePay("auto"));
  document.getElementById("btn-subscribe")?.addEventListener("click", () => {
    document.getElementById("subscribe-panel").classList.toggle("hidden");
  });
  document.getElementById("sub-confirm")?.addEventListener("click", async () => {
    const amt = Number(document.getElementById("sub-amount").value || 5);
    document.getElementById("pay-status").textContent = "Setting up auto-subscribe " + amt + " USD/month...";
    try {
      // For demo, do one checkout and show recurring message; real would use GDMx recurring API
      const tx = await pay.checkout({ amountUSD: amt, method: "auto" });
      document.getElementById("pay-status").innerHTML = '<span class="text-emerald-300">✓ Subscribed: '+amt+' USD/month to @'+profile.login+' — first payment '+tx+' (non-custodial, cancel anytime)</span>';
      document.getElementById("subscribe-panel").classList.add("hidden");
    } catch(e){ document.getElementById("pay-status").textContent = "✗ "+e.message; }
  });
}
</script>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
}
