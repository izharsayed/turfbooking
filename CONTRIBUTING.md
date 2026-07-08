# Contributing Guidelines

Thank you for contributing to the Turf Booking Platform! To maintain codebase consistency, scalability, and code quality, please adhere to the following development conventions.

---

## 🌿 Branching Strategy

We follow the Git Flow branching model:
- `main` / `master`: Represents stable production releases.
- `dev`: Primary integration branch for new features.
- Feature Branches: Created from `dev` and named using the format `feature/feature-name` or `bugfix/issue-name`.

---

## 🛠️ Development Workflow

1. **Pull the Latest Changes**:
   Ensure your local `dev` branch is up-to-date:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install & Link**:
   Ensure dependencies are linked across workspaces:
   ```bash
   npm install
   ```

4. **Run Pre-Commit Checks**:
   Lint and format scripts will be verified during commit steps via `Husky` and `lint-staged`. You can test them manually:
   ```bash
   # Lint check (all packages)
   pnpm run lint

   # Lint check (single package)
   pnpm --filter turfbook-backend lint
   pnpm --filter turfbook-frontend lint

   # Format code
   pnpm run format
   ```

---

## 📝 Commit Message Guidelines

We use conventional commit formatting. Commit messages should look like:

```text
<type>(<scope>): <short summary>

[optional body]
```

### Allowed Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting, white-space, semi-colons (no code changes)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Updating build tasks, package configurations, etc.

---

## 📬 Pull Request Process

1. Open your PR targeting the `dev` branch.
2. Fill out the PR template completely.
3. Ensure the Github Actions CI builds cleanly and passes all checks.
4. Get approval from at least one Senior Architect before merging.
