const fs = require("fs");
const path = require("path");

/**
 * Cria um arquivo .env vazio no caminho informado.
 *
 * Se `destino` terminar com ".env", é tratado como o caminho do arquivo.
 * Caso contrário, é tratado como diretório e o ".env" é criado dentro dele.
 * Diretórios ausentes são criados. Se o arquivo já existir, não é sobrescrito.
 *
 * @param {string} dest
 * @returns {string} caminho absoluto do arquivo .env
 * @throws {Error} se o arquivo .env já existir
 */
function createEnv(dest) {
  let file = path.resolve(dest);

  if (path.basename(file) !== ".env") {
    file = path.join(file, ".env");
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });

  // Regra: verifica primeiro se o arquivo já existe
  if (fs.existsSync(file)) {
    throw new Error(`O arquivo já existe: ${file}`);
  }
  fs.closeSync(fs.openSync(file, "a"));

  return file;
}

module.exports = { criarEnvVazio: createEnv };

createEnv('.')
createEnv('./apps/accounts')
