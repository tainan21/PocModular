/**
 * Preload que neutraliza `import "server-only"` em execuções fora do Next.
 *
 * Contexto: o pacote `server-only` lança erro em runtime quando não é
 * "apagado" pelo bundler do Next. Nosso smoke da Platform API roda em Node
 * puro (via tsx), então precisamos de um stub no-op apenas aqui.
 *
 * Usado com: `node -r ./scripts/preload-server-only.cjs ...`
 */
const path = require("node:path")

try {
  const resolved = require.resolve("server-only")
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    children: [],
    paths: [path.dirname(resolved)],
    exports: {},
  }
} catch {
  // server-only não está instalado — nada para stubbar, segue adiante.
}
