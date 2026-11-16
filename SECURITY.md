# Política de Segurança

## Versões com suporte

| Versão | Suporte |
| --- | --- |
| 2.x | Sim |
| 1.x | Não |

## Reportar uma vulnerabilidade

Não abra uma issue pública. Use um destes canais:

1. [GitHub Security Advisories](https://github.com/KillovSky/4devs/security/advisories/new) (preferido): na aba Security do repositório, clique em "Report a vulnerability".
2. Contato direto com o mantenedor: [linktr.ee/killovsky](https://linktr.ee/killovsky).

Inclua uma descrição do problema, como reproduzir, o impacto que você enxerga, a versão afetada e, se tiver, uma sugestão de correção.

## O que merece atenção

O pacote lê respostas de um site de terceiros, então tudo que vem da rede é tratado como não confiável:

- O leitor de HTML (`src/parse.ts`) não usa regex e percorre o texto em tempo linear, e a resposta é cortada em 200 mil caracteres antes dele.
- Nada do que vem da resposta é usado como caminho de arquivo, comando ou endereço de nova requisição.

Se você achar um jeito de deixar o leitor lento, ou de fazer dados da resposta chegarem a `fs`, `fetch` ou a um comando, reporte em privado pelos canais acima.
