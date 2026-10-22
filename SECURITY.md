# Security policy · Política de segurança

**English** · [Português](#português)

## Reporting a vulnerability

Please do not open a public issue. Report it privately through
[GitHub's vulnerability reporting](https://github.com/rayssarrsilva/Moringa/security/advisories/new).

Include the page or endpoint, the steps to reproduce and what an attacker could do. You will get an
answer within 5 business days, and a fix or a plan within 30 days. You will be credited in the
advisory, if you want.

Moringa is a portfolio project: payments run in Stripe **test mode** and no real money moves. Still,
every report is treated as if it were production.

### In scope

- The live site and its API routes (`/api/*`).
- This repository's code, workflows and dependencies.

### Out of scope

- Reports from automated scanners without a working proof.
- Denial of service, spam and social engineering.
- The demo accounts being public: they are meant to be, and each browser only sees its own demo data.

## How the project is protected

See [the threat model](./docs/security/THREAT-MODEL.md) and the Security section of the
[README](./README.md#security).

---

## Português

Por favor, não abra uma issue pública. Reporte em privado pelo
[canal de vulnerabilidades do GitHub](https://github.com/rayssarrsilva/Moringa/security/advisories/new),
com a página ou rota, os passos para reproduzir e o que um atacante conseguiria fazer.

A resposta vem em até 5 dias úteis, e uma correção ou um plano em até 30 dias. Se quiser, seu nome
aparece no aviso de segurança. Mesmo sendo um projeto de portfólio (a Stripe roda em modo de teste),
todo reporte é tratado como se fosse produção.
