import { connectWallet, connectGithub, fetchMe } from "https://gdbx.pages.dev/js/gdbx-auth.js";
// Reuse GDBx auth, but with DSGx branding
document.addEventListener("DOMContentLoaded", async () => {
  const me = await fetchMe();
  const bar = document.getElementById("auth-bar");
  if (bar) {
    if (!me.ok) {
      bar.innerHTML = `<button id="cta-wallet" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">Connect Wallet</button>`;
      bar.querySelector("#cta-wallet")?.addEventListener("click", connectWallet);
    } else {
      const short = (me.siweAddr || me.addr || "").slice(0,10)+"…";
      bar.innerHTML = `<span class="mono text-xs text-emerald-300">${short}</span> ${me.verified ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">✓ @${me.githubLogin}</span> <a href="/${me.githubLogin}" class="px-2 py-1 rounded bg-emerald-600 text-white text-xs">View dsgx.pages.dev/${me.githubLogin}</a>` : `<button id="cta-github" class="px-3 py-1 rounded bg-violet-600 text-white text-xs">Verify GitHub → Create Profile</button>`}`;
      bar.querySelector("#cta-github")?.addEventListener("click", connectGithub);
    }
  }
  const cta = document.getElementById("cta-connect");
  if (cta) {
    if (!me.ok) cta.textContent = "Connect Wallet";
    else if (!me.verified) cta.textContent = "Verify GitHub → Create Profile";
    else { cta.textContent = `View dsgx.pages.dev/${me.githubLogin}`; cta.onclick = () => location.href = `/${me.githubLogin}`; }
  }
  document.getElementById("cta-connect")?.addEventListener("click", async () => {
    const m = await fetchMe();
    if (!m.ok) await connectWallet();
    const m2 = await fetchMe();
    if (m2.ok && !m2.verified) await connectGithub();
    else if (m2.ok && m2.verified) location.href = `/${m2.githubLogin}`;
  });
  // profile preview
  const preview = document.getElementById("profile-preview");
  if (preview && me.ok) {
    preview.innerHTML = `<div class="flex items-center gap-3"><img src="https://github.com/${me.githubLogin||"octocat"}.png" class="w-10 h-10 rounded-full"><div><div class="font-semibold">${me.githubLogin ? "@"+me.githubLogin : me.siweAddr}</div><div class="mono text-xs text-slate-500">${me.addr}</div></div><a href="/${me.githubLogin||me.addr.slice(0,8)}" class="ml-auto px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs">dsgx.pages.dev/${me.githubLogin||"you"} ↗</a></div>`;
  }
});
