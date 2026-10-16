# Working on delineate

## Each piece of work gets a worktree

Open a worktree and a branch for each piece of work, so main always holds what is live:

    git worktree add .claude/worktrees/<name> -b <name>

When the work is done, fast-forward main to the branch in the main checkout and push main from there.
Once the push has published the site, remove the worktree and delete the branch (`git worktree remove`,
`git branch -d`). Locally, main is the only branch left between pieces of work.

## Pushing main publishes the site

The pre-push hook (`.githooks/pre-push`, which `npm install` turns on) builds the site from the checkout
and publishes it to gh-pages before main goes up. Merging is therefore releasing: before main moves, run
`npm run check` and look at the work in a browser, the way its audience will meet it. The hook builds
what is committed, so push from a clean checkout whose HEAD is the main being pushed.

## Skills

The skills in `.agents/skills/` hold how each work is made and what done means for it. Before changing
a work, load its skill, and keep the skill true to the code when the code changes. A new style starts
as a skill, and the work is drawn from it.
