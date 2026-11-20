const urlRetirada = document.querySelector('meta[name="retirada-url"]')?.content.trim();

if (urlRetirada) {
  try {
    const app = new URL(urlRetirada);
    if (app.protocol === "https:") {
      document.querySelectorAll("[data-retirada]").forEach((link) => {
        link.href = app.href;
        link.textContent = "Pedir para retirar";
        link.hidden = false;
      });
    }
  } catch {
    // Um endereço incompleto mantém o acesso ao cardápio.
  }
}

if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  document.querySelector("[data-enter]").classList.add("is-shown");
  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-shown");
          observador.unobserve(entrada.target);
        }
      }
    }, {threshold: 0.14});
    document.querySelectorAll("[data-revelar]").forEach((secao) => observador.observe(secao));
  }
}
