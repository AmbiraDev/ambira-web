# Claude Code Agents

This document describes all specialized agents available in this project. Agents are invoked using the Task tool with the appropriate `subagent_type` parameter.

## Agent Systems

This project integrates two comprehensive agent systems:

1. **valllabh/claude-agents** - 8 specialized agents for complete software development lifecycle
2. **Dimillian/Claude** - 7 domain-specific agents with automatic task routing

## Available Agents

### Software Development Lifecycle (valllabh/claude-agents)

#### analyst - Business Analyst (Mary)

**File**: `analyst.md`

Strategic analyst specializing in market research, brainstorming, competitive analysis, and project briefing.

**Use when**:

- Conducting market research
- Competitive analysis
- Brainstorming sessions
- Creating project briefs
- Transforming ideas into actionable insights

**Tools**: Read, Write, Edit, Grep, Glob, WebFetch, WebSearch, TodoWrite

**Example**:

```
Use the analyst agent to conduct competitive analysis for our new feature
```

---

#### architect - System Architect (Winston)

**File**: `architect.md`

System architect specializing in technical architecture design, technology selection, and system design decisions.

**Use when**:

- Designing system architecture
- Making technology stack decisions
- Creating architecture diagrams
- Evaluating architectural patterns
- Planning technical infrastructure

**Example**:

```
Use the architect agent to design the architecture for our real-time notification system
```

---

#### developer - Developer (James)

**File**: `developer.md`

Implementation specialist handling coding, debugging, code review, and testing.

**Use when**:

- Implementing features
- Debugging issues
- Code reviews
- Writing tests
- Refactoring code

**Example**:

```
Use the developer agent to implement the user authentication flow
```

---

#### product-manager - Product Manager (John)

**File**: `product-manager.md`

Product management specialist creating PRDs and project documentation.

**Use when**:

- Creating Product Requirements Documents (PRDs)
- Writing project documentation
- Defining product features
- Planning product roadmaps

**Example**:

```
Use the product-manager agent to create a PRD for the notification system
```

---

#### product-owner - Product Owner (Sarah)

**File**: `product-owner.md`

Backlog management and sprint planning specialist.

**Use when**:

- Managing product backlog
- Sprint planning
- Story prioritization
- Feature refinement

**Example**:

```
Use the product-owner agent to help prioritize our backlog for the next sprint
```

---

#### qa-engineer - QA Engineer (Quinn)

**File**: `qa-engineer.md`

Quality assurance specialist for code review, refactoring, and test strategy.

**Use when**:

- Reviewing code quality
- Planning test strategies
- Identifying quality issues
- Refactoring recommendations

**Example**:

```
Use the qa-engineer agent to review our test coverage and suggest improvements
```

---

#### scrum-master - Scrum Master (Bob)

**File**: `scrum-master.md`

Agile process specialist managing story creation, validation, and agile ceremonies.

**Use when**:

- Creating user stories
- Managing agile ceremonies
- Story validation
- Sprint management

**Example**:

```
Use the scrum-master agent to help create user stories for the new feature
```

---

#### ux-expert - UX Expert (Sally)

**File**: `ux-expert.md`

User experience specialist generating AI-optimized UI prompts and designs.

**Use when**:

- Creating UI/UX designs
- Generating design prompts
- User flow design
- Interface optimization

**Example**:

```
Use the ux-expert agent to create an optimized UI for our dashboard
```

---

### Domain-Specific Specialists (Dimillian/Claude)

#### backend-api-architect - Backend API Architect

**File**: `backend-api-architect.md`

Expert in backend API design, framework selection, database schemas, and authentication.

**Use when**:

- Designing REST or GraphQL APIs
- Selecting backend frameworks
- Database schema design
- Authentication/authorization implementation
- Server infrastructure setup

**Example**:

```
Use the backend-api-architect agent to design the API for our mobile app
```

---

#### code-refactoring-architect - Code Refactoring Architect

**File**: `code-refactoring-architect.md`

Specialist in structural improvements using design patterns and best practices.

**Use when**:

- Refactoring legacy code
- Applying design patterns
- Code structure improvements
- Technical debt reduction

**Example**:

```
Use the code-refactoring-architect agent to refactor our session management code
```

---

#### nextjs-project-bootstrapper - Next.js Project Bootstrapper

**File**: `nextjs-project-bootstrapper.md`

Web application expert for Next.js App Router, TypeScript, and Tailwind CSS.

**Use when**:

- Starting new Next.js projects
- Setting up project structure
- Configuring TypeScript and Tailwind
- Next.js best practices

**Example**:

```
Use the nextjs-project-bootstrapper agent to set up a new Next.js project
```

---

#### project-orchestrator - Project Orchestrator

**File**: `project-orchestrator.md`

Master coordinator that breaks down complex requests and routes tasks to specialists.

**Use when**:

- Managing complex multi-agent projects
- Coordinating multiple specialists
- Breaking down large tasks
- Task routing and coordination

**Example**:

```
Use the project-orchestrator agent to coordinate the implementation of our new feature
```

---

#### qa-test-engineer - QA Test Engineer

**File**: `qa-test-engineer.md`

Quality assurance through automated testing and coverage analysis.

**Use when**:

- Creating automated tests
- Test coverage analysis
- Testing strategy
- CI/CD test integration

**Example**:

```
Use the qa-test-engineer agent to improve our test coverage
```

---

#### security-audit-specialist - Security Audit Specialist

**File**: `security-audit-specialist.md`

Vulnerability identification emphasizing credential leak detection and authentication flows.

**Use when**:

- Security audits
- Credential leak detection
- Authentication flow review
- Vulnerability assessment

**Example**:

```
Use the security-audit-specialist agent to audit our authentication system
```

---

#### swiftui-architect - SwiftUI Architect

**File**: `swiftui-architect.md`

iOS/macOS development specialist focusing on modern Swift interfaces and performance.

**Use when**:

- Building iOS/macOS applications
- SwiftUI development
- Swift performance optimization
- Native mobile development

**Note**: While this agent is available, it's most relevant for iOS/macOS projects. For React Native mobile development, use the mobile-developer from the built-in agents.

**Example**:

```
Use the swiftui-architect agent for iOS-specific features
```

---

## Agent Coordination Patterns

### Sequential Tasks

Use when tasks have dependencies:

```
1. Use analyst agent to research requirements
2. Use architect agent to design solution
3. Use developer agent to implement
4. Use qa-engineer agent to test
```

### Parallel Tasks

Use when tasks are independent:

```
- Use backend-api-architect for API design
- Use ux-expert for UI design
(Both can work simultaneously)
```

### Orchestrated Tasks

Use project-orchestrator for complex projects:

```
Use the project-orchestrator agent to implement the entire notification system
(Orchestrator will automatically coordinate other agents)
```

## Best Practices

1. **Choose the Right Agent**: Select the agent that best matches your task's domain
2. **Provide Context**: Give agents clear, specific instructions
3. **Use Orchestration**: For complex tasks, let project-orchestrator coordinate
4. **Sequential Dependencies**: Complete dependent tasks in order
5. **Parallel Efficiency**: Run independent tasks in parallel when possible

## Integration Notes

- All agents are located in `.claude/agents/`
- Agents use the Claude Code Task tool system
- Compatible with existing project workflows
- Can be used alongside built-in Claude Code agents

## Sources

- **valllabh/claude-agents**: https://github.com/valllabh/claude-agents
- **Dimillian/Claude**: https://github.com/Dimillian/Claude

## Updates

To update agents to their latest versions:

1. Pull latest from source repositories
2. Copy updated agent files to `.claude/agents/`
3. Review any breaking changes in agent interfaces
