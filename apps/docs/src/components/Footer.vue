<template>
  <footer class="footer">
    <div class="footer-content">
      <a
        href="https://fluxer.gg/fluxer-js"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-community">
        Join our Fluxer community →
      </a>
      <nav class="footer-nav" aria-label="Footer navigation">
        <router-link to="/v/latest/guides" class="footer-link">Guides</router-link>
        <router-link to="/v/latest/docs" class="footer-link">Docs</router-link>
        <router-link to="/changelog" class="footer-link">Changelog</router-link>
        <a
          href="https://github.com/fluxerjs/core"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link">
          GitHub
        </a>
        <a
          href="https://fluxer.gg/fluxer-js"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link">
          Fluxer
        </a>
      </nav>
      <p class="footer-copy">Fluxer.js v{{ version }} · SDK for Fluxer bots</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const version = ref('1.1.0');

onMounted(async () => {
  try {
    const res = await fetch('/docs/versions.json');
    if (res.ok) {
      const data = (await res.json()) as { latest?: string };
      if (data.latest) version.value = data.latest;
    }
  } catch {
    /* use default */
  }
});
</script>

<style scoped>
.footer {
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 2rem 1.5rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.footer-community {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.footer-community:hover {
  color: var(--accent-hover);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 1.25rem;
}

.footer-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
}

.footer-link:hover {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-copy {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}
</style>
