# Guia de Implementação

Este documento compila as decisões técnicas, estratégias de implementação e ferramentas utilizadas no desenvolvimento do **Portal do Professor**. A intenção é servir como referência para evoluções futuras e para quem deseja estudar o projeto em detalhes.

## 1. Visão geral da arquitetura

- **Frontend** construído em **React 19** com **TypeScript**, empacotado pelo Vite (rolldown-vite).
- **Design system** baseado em **Chakra UI**, utilizando tokens customizados (`src/styles/theme.ts`) para manter coerência visual e facilitar o dark mode.
- **Camada de dados** totalmente mockada em código (`src/services/mockServer.ts`), simulando endpoints REST, autenticação com access/refresh token e latência de rede.
- **Organização por features**, separando responsabilidades em `pages`, `components`, `hooks`, `services`, `contexts` e `utils`.

```
src/
  components/   # Componentes reaproveitáveis (cards, tabelas, diálogos)
  contexts/     # Providers de contexto (ex.: autenticação)
  hooks/        # Hooks customizados com lógica de negócios
  layouts/      # Cascas que estruturam a UI (ex.: MainLayout)
  pages/        # Páginas roteadas
  routes/       # Rotas públicas e privadas
  services/     # Clientes HTTP e camada mock
  styles/       # Tema Chakra e estilos globais
  utils/        # Funções auxiliares e mapeamentos
```

## 2. Fluxo de autenticação

1. `authService.login` chama o `mockServer.login`, que retorna `AuthSession` com usuário e tokens.
2. A sessão é persistida em `localStorage` via `persistAuthSession` (`src/services/httpClient.ts`).
3. O **interceptor de requisições** injeta o token de acesso no header `Authorization`.
4. Caso o token expire, o **interceptor de respostas** tenta um refresh com `refreshToken`. Se falhar, a sessão é limpa.
5. Na inicialização do app, `authService.restoreSession` recria a sessão a partir do armazenamento local e reidrata o mock server para manter o fluxo consistente.

Essa abordagem permite simular um backend com regras reais de sessão e oferece uma base sólida para migrar futuramente para uma API de fato.

## 3. Hooks e gerenciamento de estado

- `useAuth` expõe o contexto de autenticação com nomenclatura consistente e abstrai o fluxo de login/logout/refresh.
- `useClasses` centraliza CRUD de turmas, filtros por ocupação e indicadores derivados para a página `ClassesPage`.
- `useDashboardOverview` agrega métricas globais (próximas avaliações, engajamento, alertas) e entrega um mecanismo de `refresh` manual.
- `useEvaluations` controla operações de avaliação, conferindo soma de pesos e sincronizando o mock server após mutações.
- `useStudents` coordena cache de alunos e turmas, além de tratar erros de CRUD com mensagens amigáveis.

Todos os hooks expõem estados normalizados (`isLoading`, `error`, `refresh` etc.), o que simplifica a composição nas páginas e mantém a UI previsível.

## 4. Interface e experiência do usuário

- **MainLayout** concentra shell, navegação lateral e cabeçalho dinâmico, fornecendo slots para breadcrumbs e ações contextuais.
- Páginas em `src/pages/` alavancam componentes de domínio (`src/components/classes`, `src/components/students`, `src/components/evaluations`) para manter formulários, diálogos e tabelas desacoplados.
- As barras de progresso e badges utilizam helpers de cor (`src/utils/progressColors.ts`) e tokens semânticos, reforçando estado visual sem lógica duplicada.
- Feedback de operação aparece via toasts, indicadores de carregamento e selo de "Última atualização", criando percepção de tempo real mesmo com API mockada.
- Tela de login reutiliza o tema e assets em `public/`, garantindo consistência visual desde o fluxo de autenticação.

## 5. Estilos e tokens

O arquivo `src/styles/theme.ts` estende o tema padrão do Chakra com:

- Paletas específicas (`brand`, `red`, `yellow`, `green`), necessárias para os estados visuais das barras.
- Tokens semânticos (`bg.canvas`, `fg.default` etc.) que facilitam ajustes entre temas claro/escuro.
- Estilos globais (gradient de fundo, tipografia) definidos pelo `defineGlobalStyles`.

## 6. Estratégia de testes

O repositório utiliza **Jest + Testing Library** com 15 suítes ativas:

- Páginas: `DashboardPage.test.tsx`, `ClassesPage.test.tsx`, `StudentsPage.test.tsx`, `EvaluationsPage.test.tsx`, `LoginPage.test.tsx`.
- Rotas e layout: `AppRoutes.test.tsx`, `PrivateRoute.test.tsx`, `MainLayout.test.tsx`.
- Componentes: `UpcomingEvaluationsList.test.tsx`, `EvaluationCriteriaForm.test.tsx`.
- Hooks: `useClasses.test.ts`, `useDashboardOverview.test.ts`, `useEvaluations.test.ts`, `useStudents.test.ts`.
- Serviços: `authService.test.ts`.

As suítes utilizam `jest.mock` para simular serviços e contexto, mantendo execuções determinísticas e permitindo expandir a cobertura de forma incremental.

## 7. Build, lint e formatação

- `npm run dev` inicia o servidor de desenvolvimento (Node.js 18+).
- `npm run build` gera `dist/` com a versão de produção.
- `npm test` executa Jest com configuração TypeScript integrada.
- `npm run lint` aplica ESLint e garante padronização de código.

## 8. Possíveis evoluções

- Integrar uma API real (NestJS, Next.js) em substituição ao mock server atual.
- Implementar testes end-to-end com Playwright ou Cypress.
- Adicionar sistema de permissões (professor/coordenador) reutilizando a base de autenticação.
- Publicar Storybook com componentes reutilizáveis.

---

**Manutenção:** Consulte o histórico de commits (`git log`) e pull requests para acompanhar decisões incrementais.
