<template>
  <div class="home">
    <div class="home-inner">
      <header class="hero">
        <p class="hero-kicker">Fluxer.js SDK</p>
        <h1>Build bots on Fluxer</h1>
        <p class="lead">
          TypeScript-first client, REST helpers, and gateway events — with docs generated from the
          same packages you install.
        </p>

        <section class="hero-panel" aria-label="Get started">
          <router-link to="/v/latest/guides/basic-bot" class="cta-main">
            Open the first-bot tutorial
          </router-link>
          <a
            href="https://fluxer.gg/fluxer-js"
            target="_blank"
            rel="noopener noreferrer"
            class="hero-community">
            <span>Community &amp; support on Fluxer.gg</span>
            <svg
              class="hero-community-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </section>
      </header>

      <nav class="card-grid" aria-label="Documentation sections">
        <router-link to="/v/latest/guides" class="nav-card">
          <span class="nav-card-icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M8 7h8M8 11h6" />
            </svg>
          </span>
          <span class="nav-card-title">Guides</span>
          <span class="nav-card-desc">Tutorials and how-tos</span>
        </router-link>
        <router-link to="/v/latest/api" class="nav-card">
          <span class="nav-card-icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <span class="nav-card-title">REST API</span>
          <span class="nav-card-desc">HTTP routes and types</span>
        </router-link>
        <router-link to="/v/latest/docs" class="nav-card">
          <span class="nav-card-icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </span>
          <span class="nav-card-title">API reference</span>
          <span class="nav-card-desc">Classes and methods</span>
        </router-link>
        <router-link to="/changelog" class="nav-card">
          <span class="nav-card-icon nav-card-icon--breaking" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </span>
          <span class="nav-card-title">Changelog</span>
          <span class="nav-card-desc">Releases and breaking changes</span>
        </router-link>
      </nav>

      <footer class="home-footer" aria-label="External links">
        <a
          href="https://github.com/fluxerjs/core"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link">
          GitHub
        </a>
        <span class="footer-sep" aria-hidden="true" />
        <a
          href="https://fluxer.gg/fluxer-js"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link">
          Fluxer.gg
        </a>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.home {
  width: 100%;
  min-height: 100%;
  padding: 2.25rem clamp(1rem, 4vw, 2.5rem) 3rem;
  box-sizing: border-box;
}

.home-inner {
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
}

@media (min-width: 960px) {
  .home-inner {
    max-width: 60rem;
  }
}

.hero {
  text-align: center;
  margin-bottom: 2.25rem;
}

.hero-kicker {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.hero h1 {
  font-size: clamp(2rem, 4.5vw, 2.85rem);
  font-weight: 700;
  margin-bottom: 0.75rem;
  letter-spacing: -0.03em;
  line-height: 1.12;
  color: var(--text-primary);
}

.lead {
  font-size: 1.0625rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0 auto 1.75rem;
  max-width: 38rem;
}

/* One primary action + one quiet secondary link — no competing buttons */
.hero-panel {
  max-width: 22rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.875rem;
}

.cta-main {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.8rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  text-decoration: none;
  color: var(--bg-primary);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
}

.cta-main:hover {
  color: var(--bg-primary);
  text-decoration: none;
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.hero-community {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0 auto;
  padding: 0.35rem 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
}

.hero-community:hover {
  color: var(--accent);
}

.hero-community:hover .hero-community-icon {
  opacity: 1;
}

.hero-community-icon {
  flex-shrink: 0;
  opacity: 0.75;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
}

@media (min-width: 900px) {
  .card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }
}

.nav-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  color: inherit;
}

.nav-card:hover {
  background: var(--surface-2);
}

.nav-card.router-link-active {
  border-color: var(--accent);
  background: var(--bg-active);
}

.nav-card-icon {
  display: flex;
  color: var(--accent);
}

.nav-card-icon--breaking {
  color: var(--breaking);
}

.nav-card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-card-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.home-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
}

.footer-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
}

.footer-link:hover {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-sep {
  width: 1px;
  height: 0.75rem;
  background: var(--border);
}
</style>
