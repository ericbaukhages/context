# Project Idea Questions

This file contains the questions we need to answer to define the MVP for this new tool.
Fill out your answers below each question, then we can move forward.

---

## 1. The Core Entity: What is a "Project"?

In `choose`, a project was basically `name + path`. Now it sounds richer. At a minimum, is a project:
- Just a directory path?
- Or something more abstract (e.g., a spec doc that *becomes* a directory later)?

And when you say "various stages," are you thinking of explicit states like:
`IDEA` → `SPEC` → `ACTIVE` → `AGENT_RUN` → `TMUX_SESSION` → `ARCHIVED`?
Or is it looser than that?

**Your answer:**

Yeah, start as a spec doc, then a repo, then we might push it up to github, then we might have an open tmux session for it. I'll want high level monitoring of active agent runs.

---

## 2. Git Worktrees & Branches

How do you envision this working day-to-day?
- Do you register a project once, and the tool discovers worktrees/branches automatically?
- Or do you manually tell the tool, "I want to work on `myproject` on branch `feature-x`" and it creates a new worktree + tmux session for you?
- Is the goal to quickly *resume* "where I left off" on a specific branch/worktree?

**Your answer:**

I'll want to initialize all projects through this tool. That's why I don't think I'll want to specifically say "use this branch", unless I want to open an existing branch, maybe for collabing with a collegue?

I see there being different interfaces, that might be set up separately. Say I'm using a chatbot and I'd say "let's work on a new option for something". This would trigger various questions, resulting in an entry to some sort of "project ideas" folder, timestamped, and tracked in our central database, to be later queried against at regular intervals. Depending on how it's set up, we'd either set up a separate repo, or, in the main case for my job, a worktree in an existing project. I want the isolation, so that I don't have conflict when working through ideas.

It's more of "I want to be able to follow every random idea i have, without having to worry about cluttering up half finished ideas

---

## 3. "Agent Runs" — What does this look like?

This is the fuzziest part (and the most interesting). An "agent run" could mean a lot of things:
- A one-off AI prompt/execution (like a script that runs and produces output)?
- A long-running background agent modifying files?
- A recorded task with a start/end time and a result (pass/fail/diff)?
- Something tied to a specific branch (agents working on `feature-ai-refactor`)?

What information do you want to capture about an agent run?
- When it started/finished?
- What prompt/task was given?
- What files were touched?
- The final diff or summary?

**Your answer:**

for me, right now, it's instances of whatever CLI agent tool I'm using at the time. I was cagey about details, because it really depends on my machine, and I want a work/personal agnostic system. 

So this would be `codex`, `claude`, `pi`, `opencode`, whichever tool I might be using at the time, on the machine. I know there's quite a difference between these tools, hence why i was thinking about using tmux as a wrapper. I do think having a choice of wrapper might be something I'd like to have. Maybe each level and aspect of control needs to be configurable. The orchestration and data collection is the central part.

i could see there being a requirement that I have an extension or plugin for it to work. If that's the case, I'd just need ones for opencoe, pi, and claude.

---

## 4. Analytics / The Database

You mentioned wanting to query your work. What kinds of questions do you want to ask?
Examples:
- "How much time did I spend on Project X this week?"
- "What agent runs did I kick off yesterday, and what branches were they on?"
- "Show me all projects I haven't touched in 30 days."

This will heavily inform what we track (session start/end, branch switches, command history, agent metadata, etc.).

**Your answer:**

Honestly, it boils down to the most important question: am I forgetting anything. I'm really working on trying to make it easy to explore ideas, to optimize for the most precious resource: time. and also, when i involve others. I would like to be more efficient.

I imagine a lot of it is going to depend on what data I have access to, and if there's a different interface for collecting data. like maybe claude code has tracking i can hook into, like the claude agents interface?

---

## 5. The Daily MVP Workflow

If you had this tool in its simplest useful form tomorrow, what would the single most valuable interaction be?

Some possibilities:
- `mytool` opens a fuzzy finder of projects, and picking one drops you into the right tmux session on the right branch/worktree.
- `mytool agent run "refactor auth"` spins up an agent on a new branch, tracks it, and reports back.
- `mytool log` shows you a timeline of what you worked on today.

Which feels most immediately useful? That should probably be the first brick.

**Your answer:**

I feel like I'm less concerned about the specific interface of the tool, as it's likely I'll mostly be interacting with it through some sort of chat interface, so I can use natural language controls.

If not that, there's a lot to be done with bash scripts for interfaces, like piping lists of options through fzf? so I'd focus more on having the core work in the cli tool, rather than doing fancy tuis or anything like that.

---

## 6. Config vs. Database

You said "maybe" a config file for defining projects. What belongs in the config file vs. the database?
- **Config:** Project name, root path, default git remote, aliases?
- **Database:** Session history, branch usage, agent runs, time tracking?

Or would you rather define projects *in* the database too, and keep the config only for tool settings?

**Your answer:**

I really don't know. I typically have focused on plain text data storage for tools like these, but I also don't want to be afraid of using a database, if there's a legitimate reason for using a database over text

definitely want a config for tool settings, to account for differences between machines. but usage/analytics data should be in the database.

maybe that's it? agent usage data goes into the database? maybe a combination of both?

Or maybe the important part is supporting import/export of data as a requirement for the system, from the beginning, and not worry about usage/session/etc. database, and have both

---

## 7. MCP Server (Future)

Since this is a future goal, just a quick one: what do you want an AI agent to *do* with this data?
- "Show me my open projects" (read-only)?
- "Start a new agent run on Project X" (write/control)?
- "Summarize what I did yesterday" (analytics)?

This might nudge us toward a certain API shape early on.

**Your answer:**

primarily used for agent conversations in managing my workflow. I might want to help use this data to inform scheduling or something like that.

---

## Notes / Freeform

Use this space for any additional thoughts, sketches, or ideas.

**Your answer:**

I really would like to figure out what the boundaries of the MVP are before building. I'd like to talk through my options for coding environment. I'd like to talk through options for preexisting work in the space, specifically for useful libraries, or reference for implementation methods.

I'd like to use Typescript, if possible, but I'm not opposed to writing it in something more performant. Happy to have that discussion.
