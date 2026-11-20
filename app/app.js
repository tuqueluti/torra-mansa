const chaveMoagem = "torra-mansa.passe-e-pegue.moagem.v1";
const chavePedido = "torra-mansa.passe-e-pegue.selecao.v1";
const whatsappCafeteria = "https://wa.me/5548996084768";
const descricoesMoagem = {graos: "em grãos", fina: "moagem fina", media: "moagem média", grossa: "moagem grossa"};
const formulario = document.querySelector("#pedido");
const cliente = document.querySelector("#cliente");
const avisoCliente = document.querySelector("#cliente-aviso");
const produtos = Array.from(formulario.querySelectorAll('[name="produto"]'));
const catalogo = new Map(produtos.map((produto) => {
  const item = produto.closest(".item");
  const preco = item.querySelector("data");
  return [produto.value, {
    nome: item.querySelector("strong").textContent,
    descricao: item.querySelector(".produto-texto > span").textContent.toLocaleLowerCase("pt-BR"),
    centavos: preco ? Number(preco.value) : null,
  }];
}));
const moagens = Array.from(formulario.querySelectorAll('[name="moagem"]'));
const horario = document.querySelector("#horario");
const painelHorario = horario.closest("details");
const ajudaHorario = document.querySelector("#horario-ajuda");
const instrucoesHorario = ajudaHorario.textContent;
const previsao = document.querySelector("#previsao");
const resumoItens = document.querySelector("#resumo-itens");
const resumoPreco = document.querySelector("#resumo-preco");
const statusMoagem = document.querySelector("#moagem-status");
const confirmar = document.querySelector("#confirmar");
const recibo = document.querySelector("#recibo");
const modeloRecibo = document.querySelector("#modelo-recibo");
const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2,
});

function ler(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave));
  } catch {
    return null;
  }
}

function guardar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

function atual() {
  return {
    produtos: produtos.filter((produto) => produto.checked).map((produto) => produto.value),
    moagem: moagens.find((moagem) => moagem.checked)?.value || "",
    horario: horario.value,
  };
}

function formatarPreco(centavos) {
  return moeda.format(centavos / 100).replace(/\s+/g, " ");
}

function subtotalDosCombos(ids) {
  return ids.reduce((total, id) => total + (catalogo.get(id).centavos ?? 0), 0);
}

function mostrarResumo() {
  const selecao = atual();
  const quantidade = selecao.produtos.length;
  const temPacote = selecao.produtos.includes("pacote");
  const subtotal = subtotalDosCombos(selecao.produtos);

  previsao.textContent = selecao.horario ? `${selecao.horario} · desejado` : "Escolher horário";
  confirmar.disabled = quantidade === 0;
  resumoItens.textContent = quantidade === 0 ? "Escolha o que vai levar" : `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;
  resumoPreco.hidden = quantidade === 0;
  resumoPreco.textContent = temPacote
    ? (subtotal ? `${formatarPreco(subtotal)} em combos · pacote a confirmar` : "Preço do pacote a confirmar")
    : (subtotal ? formatarPreco(subtotal) : "");
}

function limparRecibo() {
  recibo.replaceChildren();
  delete confirmar.dataset.mensagemPronta;
  mostrarResumo();
}

function mostrarRecibo(titulo, mensagem, destino) {
  const fragmento = modeloRecibo.content.cloneNode(true);
  fragmento.querySelector("strong").textContent = titulo;
  fragmento.querySelector("span").textContent = mensagem;
  if (destino) {
    const link = fragmento.querySelector(".recibo-link");
    link.href = destino;
    link.hidden = false;
    confirmar.dataset.mensagemPronta = "";
  }
  recibo.replaceChildren(fragmento);
}

function montarLinkWhatsApp(selecao, nome) {
  const itens = selecao.produtos.map((id) => {
    const item = catalogo.get(id);
    if (id === "pacote") return `• ${item.nome} · ${descricoesMoagem[selecao.moagem]} · preço a confirmar`;
    return `• ${item.nome} (${item.descricao}) · ${formatarPreco(item.centavos)}`;
  });
  const subtotal = subtotalDosCombos(selecao.produtos);
  const valores = subtotal ? [`Subtotal dos combos · ${formatarPreco(subtotal)}`, ""] : [];
  const mensagem = [
    `Olá! Aqui é ${nome}. Quero fazer um pedido para retirada na Torra Mansa.`,
    "",
    ...itens,
    "",
    ...valores,
    `Gostaria de retirar às ${selecao.horario}. Podem confirmar o horário?`,
  ].join("\n");
  return `${whatsappCafeteria}?text=${encodeURIComponent(mensagem)}`;
}

const ultimo = ler(chavePedido);
const preferencia = ler(chaveMoagem);
const moagemSalva = moagens.find((moagem) => moagem.value === preferencia)
  || moagens.find((moagem) => moagem.value === ultimo?.moagem);
if (moagemSalva) {
  moagemSalva.checked = true;
  statusMoagem.textContent = "Moagem recuperada deste navegador.";
}
if (Array.isArray(ultimo?.produtos)) {
  for (const produto of produtos) produto.checked = ultimo.produtos.includes(produto.value);
  if (typeof ultimo.horario === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(ultimo.horario)) {
    horario.value = ultimo.horario;
  }
  if (produtos.some((produto) => produto.checked)) {
    const selecao = atual();
    const moagemMudou = selecao.produtos.includes("pacote") && selecao.moagem !== ultimo.moagem;
    mostrarRecibo(
      "Seleção recuperada",
      moagemMudou ? "Confira a nova moagem antes de abrir o WhatsApp." : "Confira seus itens e o horário de retirada.",
    );
  }
}
mostrarResumo();

formulario.addEventListener("change", (evento) => {
  if (evento.target.name === "moagem") {
    const gravou = guardar(chaveMoagem, evento.target.value);
    statusMoagem.textContent = gravou
      ? "Moagem salva neste navegador."
      : "Moagem selecionada. O navegador não permitiu salvá-la.";
  }
  limparRecibo();
});

horario.addEventListener("input", () => {
  horario.removeAttribute("aria-invalid");
  ajudaHorario.textContent = instrucoesHorario;
  limparRecibo();
});

cliente.addEventListener("input", () => {
  cliente.removeAttribute("aria-invalid");
  avisoCliente.hidden = true;
  limparRecibo();
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const selecao = atual();
  const nome = cliente.value.trim().replace(/\s+/g, " ");
  if (!selecao.produtos.length) return;
  if (!nome) {
    cliente.setAttribute("aria-invalid", "true");
    avisoCliente.hidden = false;
    cliente.focus();
    return;
  }
  if (selecao.produtos.includes("pacote") && !selecao.moagem) {
    statusMoagem.textContent = "Escolha a moagem para o pacote de café.";
    moagens[0].focus();
    return;
  }

  if (!selecao.horario || !horario.validity.valid) {
    painelHorario.open = true;
    horario.setAttribute("aria-invalid", "true");
    ajudaHorario.textContent = "Escolha um horário para incluir na mensagem.";
    horario.focus();
    return;
  }

  const link = montarLinkWhatsApp(selecao, nome);
  guardar(chavePedido, selecao);
  mostrarRecibo("Mensagem pronta", `Confira o horário de ${selecao.horario} e toque em Enviar no WhatsApp.`, link);
  window.open(link, "_blank", "noopener,noreferrer");
});
