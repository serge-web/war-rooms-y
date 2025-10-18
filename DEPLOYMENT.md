# War Rooms Y - Deployment Guide

## PR Preview Deployments

### Setup GitHub Pages

**One-time configuration** (repo owner must complete):

1. Go to repository Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Select branch: `gh-pages`
4. Select folder: `/ (root)`
5. Click "Save"

### How PR Previews Work

When you open or update a PR:

1. Workflow runs tests (`npm test`)
2. Builds all packages (`npm run build --workspaces`)
3. Builds chat-ui with mock backend:
   - `VITE_BACKEND_MODE=mock`
   - `VITE_MOCK_DOMAIN=wargame.local`
   - `VITE_MOCK_CONFERENCE=conference.wargame.local`
   - `VITE_MOCK_PUBSUB=pubsub.wargame.local`
4. Deploys to: `https://{owner}.github.io/{repo}/pr-{number}/`
5. Bot comments on PR with preview URL

### Testing the Workflow

Create a test PR to verify:

```bash
# Create a feature branch
git checkout -b test/pr-preview

# Make a trivial change
echo "# Test PR Preview" >> DEPLOYMENT.md

# Commit and push
git add DEPLOYMENT.md
git commit -m "test: PR preview workflow"
git push -u origin test/pr-preview

# Create PR via GitHub CLI
gh pr create --title "Test PR Preview" --body "Testing automated PR preview deployment"
```

Watch the Actions tab for workflow execution. When complete, check PR comments for preview URL.

### Troubleshooting

**Workflow fails on tests:**
- Check test output in Actions logs
- Ensure `npm test -- --passWithNoTests` passes locally

**Workflow fails on build:**
- Check build output in Actions logs
- Ensure `npm run build --workspace=packages/chat-ui` works locally

**Preview URL 404:**
- Verify GitHub Pages is enabled (Settings → Pages)
- Verify `gh-pages` branch exists after first workflow run
- Check peaceiris/actions-gh-pages step in workflow logs

**Preview shows blank page:**
- Check browser console for errors
- Verify mock backend env vars in workflow
- Check that base path is correctly configured in Vite

### Future: Chromatic Integration

Deferred for now. Will add visual regression testing with Chromatic after PR previews are validated.

## Production Deployment

*To be documented when production deployment is configured.*
