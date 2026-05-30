# Contribuição

## Padrão de Commits

Este projeto segue [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>
```

| Tipo | Uso |
|------|-----|
| feat | Nova funcionalidade |
| fix | Correção de bug |
| docs | Documentação |
| refactor | Refatoração |
| test | Testes |
| ci | Pipeline CI/CD |
| chore | Manutenção |

## Antes do PR

```bash
npm run lint
npm run test:ci
docker compose build
```

## Adicionando um Novo Microsserviço

1. Criar `services/<nome>/` com src/, __tests__/, Dockerfile, package.json
2. Adicionar ao docker-compose.yml
3. Criar manifests em k8s/<nome>/
4. Adicionar ao pipeline (matrix)
5. Adicionar scrape no Prometheus
6. Atualizar README
