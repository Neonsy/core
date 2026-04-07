<template>
  <div class="changelog-page">
    <header class="changelog-header">
      <div class="changelog-header-main">
        <h1>Changelog</h1>
        <p class="lead">
          Release notes for the Fluxer.js SDK. Entries marked as
          <span class="breaking-inline">
            <svg class="breaking-inline-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            breaking
          </span>
          may need code changes when you upgrade.
        </p>
      </div>
      <div class="changelog-version-field">
        <ChangelogVersionCombobox v-model="selectedVersion" :versions="versions" />
        <p id="changelog-version-hint" class="version-hint">Search or pick a release; leave as “All releases” for the full list.</p>
      </div>
    </header>

    <div class="changelog-entries">
      <article
        v-for="wrap in wrappedEntries"
        :id="`v${wrap.entry.version}`"
        :key="wrap.entry.version"
        class="release-block">
        <div class="release-head">
          <div>
            <h2 class="release-version">v{{ wrap.entry.version }}</h2>
            <time class="release-date" :datetime="wrap.entry.date">{{ formatDate(wrap.entry.date) }}</time>
          </div>
          <div v-if="wrap.breakingCount > 0" class="breaking-tag" role="status">
            <svg class="breaking-tag-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <span>{{ wrap.breakingCount }} breaking {{ wrap.breakingCount === 1 ? 'change' : 'changes' }}</span>
          </div>
        </div>

        <div
          v-for="section in wrap.entry.sections"
          :id="`v${wrap.entry.version}-${sectionSlug(section.title)}`"
          :key="section.title"
          class="release-section">
          <h3 class="section-heading">{{ section.title }}</h3>
          <ul class="change-list">
            <li
              v-for="(item, i) in section.items"
              :key="i"
              :class="['change-line', isBreakingChangelogItem(item) ? 'change-line--breaking' : '']">
              <div v-if="isBreakingChangelogItem(item)" class="breaking-rail" aria-hidden="true">
                <svg class="breaking-row-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
              <div class="change-line-body">
                <span v-if="isBreakingChangelogItem(item)" class="breaking-eyebrow">Breaking change</span>
                <span class="change-text">
                  <template
                    v-for="(seg, si) in splitBoldSegments(stripBreakingPrefix(item))"
                    :key="si">
                    <strong v-if="seg.bold" class="change-strong">{{ seg.text }}</strong>
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </span>
              </div>
            </li>
          </ul>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ChangelogEntry } from '../data/changelog';
import { changelogEntries } from '../data/changelog';
import {
  breakingItemCountForEntry,
  isBreakingChangelogItem,
  splitBoldSegments,
  stripBreakingPrefix,
} from '../utils/changelogFormat';
import ChangelogVersionCombobox from '../components/ChangelogVersionCombobox.vue';

const route = useRoute();
const router = useRouter();

const versions = changelogEntries.map((e) => e.version);

const initVersion = (() => {
  const v = route.query.version as string | undefined;
  return v && versions.includes(v) ? v : null;
})();
const selectedVersion = ref<string | null>(initVersion);

watch(
  () => route.query.version as string | undefined,
  (v) => {
    selectedVersion.value = v && versions.includes(v) ? v : null;
  },
  { immediate: true },
);

watch(selectedVersion, (v) => {
  const base = { ...route.query } as Record<string, string>;
  const next = v
    ? { ...base, version: v }
    : Object.fromEntries(Object.entries(base).filter(([k]) => k !== 'version'));
  router.replace({ query: next });
});

const filteredChangelog = computed(() =>
  selectedVersion.value
    ? changelogEntries.filter((e) => e.version === selectedVersion.value)
    : changelogEntries,
);

const wrappedEntries = computed(() =>
  filteredChangelog.value.map((entry: ChangelogEntry) => ({
    entry,
    breakingCount: breakingItemCountForEntry(entry),
  })),
);

function sectionSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.changelog-page {
  width: 100%;
  max-width: min(75vw, 85rem);
  margin: 0 auto;
  padding: 2rem clamp(1rem, 3vw, 2rem) 3rem;
  box-sizing: border-box;
}

.changelog-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.25rem;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border);
}

@media (min-width: 640px) {
  .changelog-header {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem 2rem;
  }
}

.changelog-header-main {
  flex: 1;
  min-width: min(100%, 320px);
}

.changelog-header h1 {
  font-size: clamp(1.75rem, 2.5vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.lead {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 42rem;
}

.breaking-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0 0.15rem;
  padding: 0.1rem 0.45rem 0.1rem 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--breaking);
  vertical-align: middle;
  border-bottom: 2px solid color-mix(in srgb, var(--breaking) 55%, transparent);
}

.breaking-inline-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.changelog-version-field {
  flex-shrink: 0;
  width: 100%;
  max-width: 280px;
}

@media (min-width: 640px) {
  .changelog-version-field {
    width: auto;
  }
}

.version-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.changelog-entries {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.release-block {
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-subtle);
}

.release-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.release-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.release-version {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.2rem 0;
  color: var(--text-primary);
}

.release-date {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.breaking-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--breaking) 8%, var(--surface-1));
  border: 1px solid color-mix(in srgb, var(--breaking) 28%, var(--border));
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius);
}

.breaking-tag-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--breaking);
}

.release-section {
  margin-top: 1.25rem;
}

.release-section:first-of-type {
  margin-top: 0;
}

.section-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin: 0 0 0.65rem 0;
}

.change-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.change-line {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.change-line:last-child {
  border-bottom: none;
}

.change-line--breaking {
  padding: 0.65rem 0.75rem;
  margin: 0.2rem 0;
  border: 1px solid color-mix(in srgb, var(--breaking) 22%, var(--border-subtle));
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--breaking) 5%, var(--surface-1));
}

.breaking-rail {
  flex-shrink: 0;
  padding-top: 0.2rem;
}

.breaking-row-icon {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
  color: var(--breaking);
}

.change-line-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.breaking-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--breaking);
}

.change-text {
  display: block;
  min-width: 0;
}

.change-strong {
  color: var(--text-primary);
  font-weight: 600;
}
</style>
