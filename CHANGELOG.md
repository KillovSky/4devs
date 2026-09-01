# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2026-09-01

### Adicionado
- Modo local/fallback completo (`local`) para todos os geradores e validadores, usado automaticamente quando o 4devs.com.br está indisponível.
- CLI (`4devs`) com comandos de geração e validação, incluindo flag `--offline`.
- Suporte a ESM e CommonJS via `exports` no `package.json`, com tipos TypeScript (`.d.ts`/`.d.cts`).
- Tabelas de referência exportadas (`UF_CODES`, `VEHICLE_BRANDS`, `BANK_ACCOUNT_BANKS`, `CREDIT_CARD_GENERATOR_FLAGS`, `CREDIT_CARD_VALIDATOR_FLAGS`, `CERTIFICATE_TYPES`).
- Utilitários de baixo nível exportados (parser de HTML e algoritmos de dígito verificador).

### Alterado
- Reescrita completa do cliente sem dependências de execução (usa `fetch` nativo, Node ≥ 18).

[2.0.0]: https://github.com/KillovSky/4devs/releases/tag/v2.0.0
