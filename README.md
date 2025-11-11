# Portal do Professor

Aplicação web feita em React + TypeScript que centraliza o acompanhamento de alunos, turmas e avaliações para professores. O projeto aplica uma arquitetura front-end moderna, com dados totalmente mockados e foco em padrões reutilizáveis.

## ✨ Principais funcionalidades

- **Autenticação simulada** com persistência de sessão (access/refresh token) e restauração segura após recarregar a página.
- **Dashboard gerencial** com métricas em tempo real, destaque para próximas avaliações, alertas de capacidade e status de engajamento.
- **Gestão de turmas** com listagem, filtros por ocupação, CRUD completo e indicadores de ocupação coloridos.
- **Gestão de alunos** com formulários reutilizáveis, feedback visual e ações descomplicadas.
- **Configuração de avaliações** permitindo ajustar pesos, validar somatório e acompanhar atualizações.
- **Feedback de atualização** (spinners, “última atualização”, toasts) para operações de sincronização manual.
- **Mock server embutido** reproduzindo endpoints REST, tokens, relacionamentos entre entidades e delays de rede realistas.

## 🧠 Estratégias aplicadas

- Arquitetura organizada em _features_ (`pages`, `components`, `hooks`, `services`, `utils`).
- Uso consistente de hooks customizados para separar efeitos e estado derivado.
- Design system montado com Chakra UI, tokens customizados e semântica pensada para dark/light mode.
- Testes unitários (Jest + Testing Library) cobrindo rotas e casos críticos de UI.
- Commits e PRs seguindo convenções semânticas, facilitando rastreamento histórico.

## 🛠️ Stack e ferramentas

- **Framework**: React 19 + React Router DOM 7
- **Tipagem**: TypeScript 5.9
- **UI**: Chakra UI 3 (componentes, tokens e portal para modais)
- **Build**: Vite (rolldown-vite) com HMR
- **HTTP**: Axios + interceptadores para refresh token
- **Mock API**: camada `mockServer` com persistência em memória
- **Teste**: Jest, Testing Library, user-event
- **Lint**: ESLint 9 + configs específicas para React

## 📁 Estrutura de pastas

```
src/
  components/     # UI compartilhada (cards, dialogs, formulários)
  contexts/       # Providers globais (ex: AuthContext)
  hooks/          # Hooks customizados (ex: useClasses, useDashboardOverview)
  layouts/        # Cascas de página (MainLayout com sidebar/header)
  pages/          # Páginas de roteamento (Dashboard, Alunos, Turmas...)
  routes/         # Definições de rotas públicas/privadas
  services/       # httpClient, authService, mockServer
  styles/         # Tema Chakra e estilos globais
  utils/          # Helpers (formatadores, cores...)
```

## 🚀 Executando localmente

```bash
npm install
npm run dev   # http://localhost:5173
```

Scripts úteis:

- `npm run build` – gera a versão de produção em `dist/`
- `npm run preview` – serve a build localmente
- `npm test` – executa a suíte de testes unitários
- `npm run lint` – roda a verificação de lint

> **Requisito**: Node.js 18+.

## ✅ Testes

Os testes utilizam Jest + Testing Library. Para rodar a suíte completa:

```bash
npm test
```

Para rodar somente a suíte de turmas, por exemplo:

```bash
npm test -- ClassesPage
```

## 📦 Deploy

O site recebeu um deploy e pode ser visto na integra na url:
[Portal do Professor](https://portal-do-professor-jrchakalo.vercel.app/)


## 📚 Documentação adicional

- [Guia de implementação](docs/IMPLEMENTACAO.md)
- [Histórico de PRs](https://github.com/jrchakalo/portal-do-professor/pulls)
