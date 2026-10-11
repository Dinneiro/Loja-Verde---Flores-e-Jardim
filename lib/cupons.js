const config = require('../config');

/**
 * Resolve um código de cupom em um percentual de desconto.
 * Retorna { ok, codigo, percentual, mensagem }.
 *
 *  - Cupom de 1ª compra (VERDE10): vale uma vez por cliente (quando há usuário logado).
 *  - PARCEIRO20-XXXX: gerado no cadastro de comerciante ativo.
 *  - Promoções B2B: ativas, dentro da validade e com o mínimo de unidades.
 */
async function resolverCupom(db, codigoBruto, { unidades = 0, usuarioId = null } = {}) {
  const codigo = String(codigoBruto || '').trim().toUpperCase();
  if (!codigo) return { ok: false, codigo: '', percentual: 0, mensagem: 'Informe um cupom.' };

  const c = config.comercial;

  if (codigo === c.cupomPrimeiraCompra) {
    if (usuarioId) {
      const usado = await db.get(
        "SELECT id FROM pedidos WHERE usuario_id = ? AND status != 'cancelado' LIMIT 1",
        [usuarioId]
      );
      if (usado) {
        return { ok: false, codigo, percentual: 0, mensagem: `O cupom ${codigo} é válido apenas na primeira compra.` };
      }
    }
    return { ok: true, codigo, percentual: c.cupomPrimeiraCompraPct, mensagem: `Cupom ${codigo} aplicado.` };
  }

  if (/^PARCEIRO20-[0-9A-F]{4}$/.test(codigo)) {
    const parceiro = await db.get(
      "SELECT id FROM comerciantes WHERE cupom_gerado = ? AND status = 'ativo'",
      [codigo]
    );
    if (parceiro) {
      return { ok: true, codigo, percentual: c.cupomParceiroPct, mensagem: `Cupom ${codigo} aplicado.` };
    }
    return { ok: false, codigo, percentual: 0, mensagem: 'Cupom inválido ou expirado.' };
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const promo = await db.get(
    `SELECT desconto_pct, minimo_unidades FROM promocoes_comerciantes
     WHERE cupom = ? AND ativo = 1 AND (valido_ate IS NULL OR valido_ate >= ?)`,
    [codigo, hoje]
  );
  if (promo) {
    if (unidades < promo.minimo_unidades) {
      return {
        ok: false, codigo, percentual: 0,
        mensagem: `Este cupom exige no mínimo ${promo.minimo_unidades} unidades no carrinho.`
      };
    }
    return { ok: true, codigo, percentual: promo.desconto_pct, mensagem: `Cupom ${codigo} aplicado.` };
  }

  return { ok: false, codigo, percentual: 0, mensagem: 'Cupom inválido ou expirado.' };
}

module.exports = { resolverCupom };
