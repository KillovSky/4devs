# Changelog

As mudanças notáveis do projeto ficam neste arquivo.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [2.1.0] - 2026-11-15

### Adicionado
- CNPJ alfanumérico, o formato em vigor desde julho de 2026. `isValidCnpj()` e `local.validators.cnpj()` aceitam letras nas 12 primeiras posições; `generateAlphanumericCnpj()` gera um; `generators.cnpj({ alphanumeric: true })` e `local.generators.cnpj({ alphanumeric: true })` o devolvem sem fazer requisição. Na CLI: `4devs cnpj --alphanumeric`.
- `formatCnpj()` aceita também um texto, além do array de dígitos.
- CLI: `--version` (`-v`) e opções no formato `--chave=valor`.
- `generateCardDigits()` aceita um prefixo.

### Corrigido
- `formatCertificate()` perdia os dois últimos dígitos da matrícula e agrupava o ano com 2 dígitos em vez de 4. A matrícula formatada agora tem os 32 dígitos, no padrão `NNNNNN.NN.NN.NNNN.N.NNNNN.NNN.NNNNNNN-NN`.
- A certidão gerada localmente ignorava `type`. O dígito do tipo do livro agora segue o tipo pedido.
- O cartão gerado localmente ignorava a bandeira. O número agora sai com o prefixo e o tamanho da bandeira (15 dígitos e CVV de 4 para `amex`, por exemplo), e continua fechando no Luhn.
- Uma entidade numérica fora do intervalo Unicode (como `&#99999999999;`) lançava `RangeError` em `decodeHtmlEntities()` e fazia a função cair para o modo local. Agora ela fica no texto como veio.
- `timeout` com `NaN`, `0` ou valor negativo abortava a requisição na hora. Agora usa o padrão de 15000 ms.
- `4devs --offline cpf` (opção antes do comando) lia `cpf` como valor de `--offline` e mostrava a ajuda.
- `local.generators.bankAccount()` e `local.generators.creditCard()` com banco ou bandeira inexistente falhavam com um `TypeError` pouco claro; agora lançam `RangeError` com a lista de opções. O mesmo vale para `type` inválido em `local.generators.certificate()`.

### Alterado
- O leitor de HTML (`parse.ts`) deixou de usar regex e passou a percorrer o texto uma vez só. Entradas feitas para deixá-lo lento, como milhares de tags abertas, agora terminam em tempo linear. Um `<` seguido de espaço ou dígito é tratado como texto, e o conteúdo de elementos aninhados é lido até 64 níveis.
- Os validadores lançam `TypeError` quando o código não é um texto ou está vazio, em vez de enviar `"undefined"` ao 4devs.
- `isValidCnpj()` ignora só `.`, `/`, `-` e espaços. Antes descartava qualquer caractere que não fosse dígito, o que deixava passar texto solto como `"CNPJ 11.222.333/0001-81"`.
- A CLI foi reorganizada: cada comando é descrito uma vez e serve ao modo online e ao `--offline`. Antes havia duas cópias do mesmo `switch`.
- `random.ts` e `local/secureRandom.ts` foram unificados em `src/random.ts`.
- As mensagens do campo `raw` do modo local ficaram mais curtas.
- Comentários e documentação foram revisados e encurtados.

## [2.0.0] - 2026-09-01

### Adicionado
- Modo local (`local`) para todos os geradores e validadores, usado automaticamente quando o 4devs.com.br não responde.
- CLI `4devs` com comandos de geração e validação e a opção `--offline`.
- ESM e CommonJS via `exports`, com tipos TypeScript (`.d.ts` e `.d.cts`).
- Tabelas de referência exportadas (`UF_CODES`, `VEHICLE_BRANDS`, `BANK_ACCOUNT_BANKS`, `CREDIT_CARD_GENERATOR_FLAGS`, `CREDIT_CARD_VALIDATOR_FLAGS`, `CERTIFICATE_TYPES`).
- Funções de baixo nível exportadas (leitor de HTML e algoritmos de dígito verificador).

### Alterado
- Reescrita do cliente sem dependências de execução, com `fetch` nativo (Node 18 ou mais novo).

[2.1.0]: https://github.com/KillovSky/4devs/releases/tag/v2.1.0
[2.0.0]: https://github.com/KillovSky/4devs/releases/tag/v2.0.0
