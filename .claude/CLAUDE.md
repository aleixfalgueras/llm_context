## Standard Workflow
1. First think through the problem, read the codebase for relevant files. Don't hesitate to ask me anything that isn't clear.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. **Everything is about simplicity.**
7. **ALWAYS use Prisma-generated types** - Never manually create interfaces that duplicate Prisma models.

## Project Structure (Next.js)
- **Pages**: `app/` folder
- **Components**: `components/` folder
- **Hooks**: `hooks/` folder
- **API Routes**: `app/api/` folder
- **Utilities**: `lib/` folder
- **Types**: `types/` folder
- **UI Components**: `components/ui/` (shadcn-ui components)

## UI Component Guidelines
- **Always prefer using `shadcn-ui` components when implementing UI.**
- Only create a custom component from scratch **if**:
  1. No equivalent exists in `shadcn-ui`, **and**
  2. A new component significantly improves UX, styling, or functionality.
- When you use a `shadcn-ui` component, **note it in your explanation** (e.g., “used `Button` from `@/components/ui/Button`”).
- If extending or customizing is needed, **wrap or compose** the shadcn component rather than fully reimplementing it.

## Subagent Usage
- **Use subagents for complex tasks** requiring specialized focus:
  - Deep code analysis of large codebases
  - Research on libraries, APIs, or architectural decisions
  - Comprehensive testing strategy development
- **Always explain** when using a subagent and why
- **Integrate results** back into the main workflow and todo items