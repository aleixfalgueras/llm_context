## Standard Workflow
1. First think through the problem, read the codebase for relevant files. Don't hesitate to ask me anything that isn't clear.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. **Everything is about simplicity.**

## UI Component Guidelines
- **Always prefer using `shadcn-ui` components when implementing UI.**
- Only create a custom component from scratch **if**:
  1. No equivalent exists in `shadcn-ui`, **and**
  2. A new component significantly improves UX, styling, or functionality.
- When you use a `shadcn-ui` component, **note it in your explanation** (e.g., “used `Button` from `@/components/ui/Button`”).
- If extending or customizing is needed, **wrap or compose** the shadcn component rather than fully reimplementing it.

## Ideal File Sizes
- **Hooks**: 50–150 lines
- **Components**: 100–200 lines
- **Utilities**: 50–100 lines
- **Types**: 50–200 lines
If a file exceeds twice its target, suggest refactoring into smaller, more focused modules.