# Git Workflow - Verifeed

## ✅ Repository Successfully Pushed!

Your code is now safely backed up on GitHub:
**https://github.com/CasualNOOB-DEV/Verifeed**

---

## 📦 What Was Pushed

**71 files** including:

### Extension Code
- ✓ All TypeScript source files
- ✓ Manifest and configuration
- ✓ Icons (PNG and SVG)
- ✓ CSS styles
- ✓ HTML pages

### Backend Code
- ✓ Express server
- ✓ Vercel serverless functions
- ✓ AI verification service
- ✓ Type definitions

### Documentation
- ✓ README.md (comprehensive)
- ✓ Quick start guide
- ✓ Testing guide
- ✓ Launch checklist
- ✓ Privacy policy
- ✓ Troubleshooting guide

### Configuration
- ✓ .gitignore (protects secrets)
- ✓ package.json files
- ✓ TypeScript configs
- ✓ Build scripts

**NOT Pushed (Protected):**
- ❌ node_modules/ (dependencies)
- ❌ .env (API keys)
- ❌ dist/ (build outputs)
- ❌ *.log files

---

## 🔄 Daily Git Workflow

### Making Changes

```bash
# 1. Check current status
git status

# 2. See what changed
git diff

# 3. Add files you changed
git add extension/src/content/content.ts
# Or add everything:
git add .

# 4. Commit with a message
git commit -m "Add feature X"

# 5. Push to GitHub
git push
```

### Common Commands

**See recent commits:**
```bash
git log --oneline -10
```

**Undo changes to a file (before commit):**
```bash
git checkout -- filename.ts
```

**Undo last commit (keep changes):**
```bash
git reset --soft HEAD~1
```

**Create a new feature branch:**
```bash
git checkout -b feature/awesome-feature
# Make changes...
git push -u origin feature/awesome-feature
```

---

## 📝 Commit Message Guidelines

**Good commit messages:**
```bash
git commit -m "Fix claim detection for scientific terms"
git commit -m "Add right-click context menu for manual verification"
git commit -m "Update README with deployment instructions"
```

**Format:**
```
<type>: <short description>

<optional longer description>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 🚀 Pushing Updates

**After making changes:**

```bash
# Quick workflow
git add .
git commit -m "Your message here"
git push

# With verification
git status                    # See what changed
git diff                      # Review changes
git add .                     # Stage everything
git log --oneline -5          # Check recent commits
git commit -m "Your message"  # Commit
git push                      # Push to GitHub
```

---

## 🌿 Branch Strategy

### Main Branch (Protected)
```bash
main  # Production-ready code
```

### Feature Branches
```bash
# Create feature branch
git checkout -b feature/new-detection-pattern

# Make changes...
git add .
git commit -m "Add detection for measurements"

# Push feature branch
git push -u origin feature/new-detection-pattern

# Merge to main (via GitHub PR or locally)
git checkout main
git merge feature/new-detection-pattern
git push
```

---

## 🔐 Keeping Secrets Safe

**.gitignore already protects:**
- `.env` files (API keys)
- `node_modules/` (dependencies)
- `dist/` builds
- Log files

**NEVER commit:**
```bash
# ❌ BAD
git add backend/.env
git commit -m "Add env file"  # DON'T DO THIS!

# ✅ GOOD
# Keep .env local only
# Share .env.example instead
```

**If you accidentally commit a secret:**
```bash
# Remove from last commit
git reset --soft HEAD~1
git restore --staged backend/.env

# Or use BFG Repo Cleaner for history cleanup
```

---

## 🔄 Sync from Multiple Computers

**On Computer A (where you are now):**
```bash
git push  # Push your changes
```

**On Computer B (another machine):**
```bash
# First time
git clone https://github.com/CasualNOOB-DEV/Verifeed.git
cd Verifeed

# Later updates
git pull  # Get latest changes
```

---

## 🐛 Troubleshooting

### "Push rejected" error
```bash
# Someone else pushed changes
git pull --rebase
git push
```

### Accidentally committed to wrong branch
```bash
# Move last commit to new branch
git branch feature/new-branch
git reset --hard HEAD~1
git checkout feature/new-branch
```

### Reset to last pushed commit
```bash
git fetch origin
git reset --hard origin/main
```

### See what would be pushed
```bash
git diff origin/main..HEAD
```

---

## 📊 GitHub Features to Use

### Issues
Track bugs and feature requests:
https://github.com/CasualNOOB-DEV/Verifeed/issues

### Pull Requests
Review code before merging:
1. Push feature branch
2. Create PR on GitHub
3. Review changes
4. Merge to main

### Releases
Tag versions:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## 🔖 Useful Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    last = log -1 HEAD
    unstage = reset HEAD --
    visual = log --graph --oneline --all
```

Then use:
```bash
git st      # Instead of git status
git co main # Instead of git checkout main
git visual  # See commit graph
```

---

## 📅 Recommended Workflow

**Daily:**
1. Pull latest: `git pull`
2. Make changes
3. Test locally
4. Commit: `git add . && git commit -m "..."`
5. Push: `git push`

**Before Major Changes:**
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Merge to main
5. Tag release if needed

---

## 🎯 Next Steps

### Immediate
- [x] Code pushed to GitHub ✓
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Test extension works with backend
- [ ] Make small change and push to verify workflow

### Soon
- [ ] Set up GitHub Actions (CI/CD)
- [ ] Create development branch
- [ ] Add CONTRIBUTING.md
- [ ] Set up issue templates

---

## 📞 Quick Reference

**Repository:** https://github.com/CasualNOOB-DEV/Verifeed  
**Clone command:** `git clone https://github.com/CasualNOOB-DEV/Verifeed.git`

**Most used commands:**
```bash
git status          # What changed?
git add .           # Stage all changes
git commit -m "..."  # Commit with message
git push            # Push to GitHub
git pull            # Get latest changes
git log --oneline   # See recent commits
```

---

**Your code is safe! 🎉**

Everything is backed up on GitHub and ready for deployment.
