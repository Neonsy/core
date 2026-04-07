<template>
  <a
    href="https://fluxer.gg/fluxer-js"
    target="_blank"
    rel="noopener noreferrer"
    class="community-callout"
    aria-label="Join our Fluxer community">
    <span class="community-text">
      <strong>Join our Fluxer community</strong>
      <span class="community-arrow"> →</span>
    </span>
  </a>
</template>

<script setup lang="ts"></script>

<style scoped>
.community-callout {
  display: flex;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin: 0 var(--sidebar-padding-x) 1rem;
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
  background: rgba(99, 179, 237, 0.12);
  border: 1px solid rgba(99, 179, 237, 0.3);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.community-callout:hover {
  background: rgba(99, 179, 237, 0.2);
  border-color: var(--accent);
  color: var(--accent);
}

.community-text {
  line-height: 1;
}

.community-text strong {
  font-weight: 600;
}

.community-arrow {
  opacity: 0.9;
}
</style>
