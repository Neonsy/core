<template>
  <div ref="containerRef" class="combo" @keydown.escape="open = false">
    <label :id="labelId" class="combo-label" :for="triggerId">Version</label>
    <button
      :id="triggerId"
      type="button"
      class="combo-trigger"
      :class="{ open }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-labelledby="`${labelId} ${triggerId}`"
      :aria-controls="listboxId"
      @click="toggle">
      <span class="combo-trigger-text">{{ displayLabel }}</span>
      <svg
        class="combo-chevron"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </button>

    <Transition name="combo-drop">
      <div v-if="open" class="combo-panel" role="presentation">
        <div class="combo-search-wrap">
          <svg
            class="combo-search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M16 16l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input
            ref="searchRef"
            v-model="query"
            type="search"
            class="combo-search"
            placeholder="Search versions…"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            aria-label="Filter version list"
            @keydown.escape.stop="open = false" />
        </div>
        <ul :id="listboxId" class="combo-list" role="listbox" :aria-label="'SDK releases'">
          <li role="presentation">
            <button
              type="button"
              role="option"
              class="combo-option"
              :class="{ active: model === null }"
              :aria-selected="model === null"
              @mousedown.prevent
              @click="select(null)">
              All releases
            </button>
          </li>
          <li v-for="v in filteredVersions" :key="v" role="presentation">
            <button
              type="button"
              role="option"
              class="combo-option mono"
              :class="{ active: model === v }"
              :aria-selected="model === v"
              @mousedown.prevent
              @click="select(v)">
              v{{ v }}
            </button>
          </li>
          <li
            v-if="filteredVersions.length === 0 && query.trim()"
            role="presentation"
            class="combo-empty">
            No versions match “{{ query.trim() }}”
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
let changelogComboSeq = 0;
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const model = defineModel<string | null>({ default: null });

const props = defineProps<{
  versions: string[];
}>();

const open = ref(false);
const query = ref('');
const containerRef = ref<HTMLElement | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);

const cid = ++changelogComboSeq;
const labelId = `changelog-combo-label-${cid}`;
const triggerId = `changelog-combo-trigger-${cid}`;
const listboxId = `changelog-combo-list-${cid}`;

const displayLabel = computed(() => (model.value === null ? 'All releases' : `v${model.value}`));

const filteredVersions = computed(() => {
  const raw = query.value.trim().toLowerCase().replace(/^v\.?/i, '');
  if (!raw) return props.versions;
  return props.versions.filter((v) => v.toLowerCase().includes(raw));
});

function toggle() {
  open.value = !open.value;
}

function select(value: string | null) {
  model.value = value;
  open.value = false;
  query.value = '';
}

function onDocClick(e: MouseEvent) {
  if (open.value && !containerRef.value?.contains(e.target as Node)) {
    open.value = false;
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    query.value = '';
    await nextTick();
    searchRef.value?.focus();
  }
});

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));
</script>

<style scoped>
.combo {
  position: relative;
  width: 100%;
  max-width: 100%;
}

.combo-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.combo-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.65rem 0.55rem 0.75rem;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
}

.combo-trigger:hover {
  border-color: var(--text-muted);
}

.combo-trigger.open,
.combo-trigger:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.combo-trigger-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combo-chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.15s ease;
}

.combo-trigger.open .combo-chevron {
  transform: rotate(180deg);
}

.combo-panel {
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 260px;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.combo-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.combo-search-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.combo-search {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.combo-search::placeholder {
  color: var(--text-muted);
}

.combo-search:focus {
  outline: none;
}

.combo-list {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0;
  max-height: 240px;
  overflow-y: auto;
}

.combo-option {
  display: block;
  width: 100%;
  padding: 0.45rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.combo-option.mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.8125rem;
}

.combo-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.combo-option.active {
  color: var(--accent);
  background: var(--bg-active);
}

.combo-empty {
  padding: 0.65rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.combo-drop-enter-active,
.combo-drop-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.combo-drop-enter-from,
.combo-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
