<template>
  <div class="not-found-page">
    <div class="not-found-card">
      <p class="code-label">Error</p>
      <h1>404</h1>
      <p class="message">Page not found</p>
      <p class="hint">The page you're looking for doesn't exist or may have moved.</p>
      <nav class="not-found-nav" aria-label="Suggested pages">
        <router-link to="/" class="pill">Home</router-link>
        <router-link to="/v/latest/guides" class="pill">Guides</router-link>
        <router-link to="/v/latest/docs" class="pill">Docs</router-link>
        <router-link to="/changelog" class="pill">Changelog</router-link>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem 1.25rem 3rem;
}

.not-found-card {
  max-width: 420px;
  width: 100%;
  text-align: center;
  padding: 2.25rem 1.75rem;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.code-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.not-found-page h1 {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.5rem;
  letter-spacing: -0.04em;
  line-height: 1;
}

.message {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.92rem;
  color: var(--text-secondary);
  margin-bottom: 1.75rem;
  line-height: 1.55;
}

.not-found-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.pill {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.45rem 0.95rem;
  border-radius: 9999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.pill:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}
</style>
