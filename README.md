# Trabalho III - Implementação de 30% do sistema Veridit

Esta é a implementação do sistema Veridit a partir das decisões arquiteturais do grupo 1, conforme registrado na documentação em `/docs/adrs`. Dos 16 requisitos, foram implementados 5 (REQ-01, REQ-03, REQ-04, REQ-12 e REQ-13), conforme os diagramas em `/docs/diagrams`.

Por se tratar de uma equipe iniciante, cujos integrantes não dominavam toda a stack utilizada, optou-se por concentrar o desenvolvimento na lógica de negócio, isolando-a da infraestrutura e das características arquiteturais (como persistência e segurança). Por esse motivo, algumas dependências externas foram substituídas por mocks. Essa separação, além de facilitar os testes e a manutenção, permite que a infraestrutura real seja integrada futuramente sem alterações na lógica de negócio.

## Requisitos implementados

| Requisito | Descrição | Diagrama de fluxo | Diagrama de sequência |
|---|---|---|---|
| REQ-01 | Cadastrar usuário | [fluxo-req-01](docs/diagrams/fluxo-req-01.md) | [sequencia-req-01](docs/diagrams/sequencia-req-01.md) |
| REQ-03 | Logar no sistema | [fluxo-req-03](docs/diagrams/fluxo-req-03.md) | [sequencia-req-03](docs/diagrams/sequencia-req-03.md) |
| REQ-04 | Sair do sistema | [fluxo-req-04](docs/diagrams/fluxo-req-04.md) | [sequencia-req-04](docs/diagrams/sequencia-req-04.md) |
| REQ-12 | Listar registros realizados | [fluxo-req-12](docs/diagrams/fluxo-req-12.md) | [sequencia-req-12](docs/diagrams/sequencia-req-12.md) |
| REQ-13 | Visualizar detalhes dos registros realizados | [fluxo-req-13](docs/diagrams/fluxo-req-13.md) | [sequencia-req-13](docs/diagrams/sequencia-req-13.md) |

## Arquitetura

Seguimos o estilo arquitetural (Service-Based Architecture) definida pelo [grupo 1](https://github.com/LucasC-Soares/Veridit/tree/main).

| Serviço | Pasta | Requisitos atendidos | Diagrama UML |
|---|---|---|---|
| Serviço de Contas | `apps/accounts` | REQ-01, REQ-03, REQ-04 | [uml-accounts](docs/diagrams/uml-accounts.md) |
| Serviço de Registros | `apps/records` | REQ-12, REQ-13 | [uml-records](docs/diagrams/uml-records.md) |

---

## Quickstart

### Ferramentas necessárias

- Runtime Node.js LTS 26
- Gerenciador de pacotes pnpm

### Baixar e testar

```bash
git clone -b dev --single-branch https://github.com/gbrcarvalho/MATA-62-TRABALHO-III-VERIDIT-GRUPO-10-.git
cd MATA-62-TRABALHO-III-VERIDIT-GRUPO-10-
pnpm install
node ./scripts/create-env.cjs
pnpm dev
```

Acesse **http://localhost:3000** no navegador e entre com as credenciais a seguir:

- e-mail: `joao@example.com`
- senha: `000000`

Você também pode criar sua própria conta, mas lembre-se de que ela será perdida ao reiniciar a aplicação.

---

## Implementação

Status das implementações em relação às decisões arquiteturais (detalhes em `/docs/adrs`):

| ADR | Título | Status |
|---|---|---|
| ADR-0001 | SEGURANÇA | Dívida técnica |
| ADR-0003 | DISPONIBILIDADE | Seguido |
| ADR-0005 | ESTILO ARQUITETURAL BASEADO EM SERVIÇOS | Seguido |
| ADR-0006 | DB COMPARTILHADO COM ESQUEMA POR DOMÍNIO | Dívida Técnica |
| ADR-0007 | AUTENTICAÇÃO CENTRALIZADA NO GATEWAY COM TOKENS | Desvio e Dívida Técnica |
 
---

## Componentes candidatos e implementação

| Componente | Responsabilidade | Implementação nesta entrega |
|---|---|---|
| Serviço de Contas | Cadastro, autenticação e encerramento de sessão | `apps/accounts` |
| Serviço de Registros | Consulta dos registros realizados pelo usuário | `apps/records` |
| Serviço de Notificações | Envio de e-mails de confirmação | `apps/notifications` (não implementado)|
| Serviço de Captura | Captura de tela executada no servidor | `apps/capture` (não implementado) |
| Serviço de Créditos | Compra, reserva e débito de créditos | `apps/credits` (não implementado) |
| API Gateway (UI) | Ponto de entrada e validação de tokens | `apps/api-gateway` |
| Frontend | Interface do cliente | `apps/web` |
| Fila de E-mail | Desacoplar o envio de e-mails | Não implementado |

**Tecnologias:** Node.js LTS 26, TypeScript, NestJS, Next.js, React + Vite

---

## Uso de ferramentas de IA

Utilizamos ferramentas de IA como guia para a implementação do projeto de acordo com as decisões arquiteturais, fornecendo apoio na tomada de decisão em relação estrutura de diretórios, organização do repositório, stack de desenvolvimento e design de código. Alguns trechos de códigos foram gerados pela IA, principalmente os testes e diagramas(mermaid), revisados pela equipe.

## Integrantes

- Antonio Barreto
- Gabriel Carvalho
- Larissa Conrado
- Pedro Marcos
- Rafael Souza
