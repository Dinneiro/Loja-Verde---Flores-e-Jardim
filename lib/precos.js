const config = require('../config');

const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Regras idênticas às do carrinho no site:
 *  - cupom incide sobre o subtotal;
 *  - desconto Pix incide sobre (subtotal - cupom);
 *  - frete grátis a partir de R$ 99 no subtotal (antes dos descontos).
 */
function calcularTotais({ subtotal, percentualCupom = 0, metodo }) {
  const c = config.comercial;
  const sub = round2(subtotal);
  const descontoCupom = round2(sub * percentualCupom / 100);
  const base = sub - descontoCupom;
  const descontoPix = metodo === 'pix' ? round2(base * c.descontoPixPct / 100) : 0;
  const frete = sub >= c.freteGratisAcima ? 0 : c.fretePadrao;
  const total = round2(sub - descontoCupom - descontoPix + frete);
  return { subtotal: sub, descontoCupom, descontoPix, frete, total };
}

module.exports = { round2, calcularTotais };
