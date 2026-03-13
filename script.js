const STORAGE_KEY = "aviation-status-board-items";

const seedItems = [
    {
        id: "seed-1",
        item: "Flight deck analytics package",
        scope: "Operations command center",
        status: "On Track",
        comments: "UI validation passed and stakeholder signoff is scheduled for Friday.",
        releaseTarget: "2026-03-28"
    },
    {
        id: "seed-2",
        item: "Ground test report export",
        scope: "Manufacturing data stream",
        status: "At Risk",
        comments: "Waiting on data retention review before export endpoints can be finalized.",
        releaseTarget: "2026-04-11"
    },
    {
        id: "seed-3",
        item: "Supplier readiness dashboard",
        scope: "Procurement and logistics",
        status: "Blocked",
        comments: "Vendor API credentials are still pending from the external support team.",
        releaseTarget: "2026-04-18"
    }
];

const form = document.getElementById("item-form");
const tableBody = document.getElementById("table-body");
const itemField = document.getElementById("item-name");
const scopeField = document.getElementById("item-scope");
const statusField = document.getElementById("item-status");
const commentsField = document.getElementById("item-comments");
const releaseField = document.getElementById("item-release");

const metricTotal = document.getElementById("metric-total");
const metricOnTrack = document.getElementById("metric-on-track");
const metricAtRisk = document.getElementById("metric-at-risk");
const metricBlocked = document.getElementById("metric-blocked");

let items = loadItems();
let pendingAddedId = null;

renderTable();
updateMetrics();

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const newItem = {
        id: createId(),
        item: itemField.value.trim(),
        scope: scopeField.value.trim(),
        status: statusField.value,
        comments: commentsField.value.trim(),
        releaseTarget: releaseField.value
    };

    items = [newItem, ...items];
    pendingAddedId = newItem.id;
    persistItems();
    renderTable();
    updateMetrics();

    form.reset();
    statusField.value = "On Track";
    itemField.focus();
});

tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-id]");
    if (!button) {
        return;
    }

    const row = button.closest("tr");
    const itemId = button.dataset.removeId;
    if (!row || !itemId) {
        return;
    }

    row.classList.add("row-exit");

    window.setTimeout(() => {
        items = items.filter((item) => item.id !== itemId);
        persistItems();
        renderTable();
        updateMetrics();
    }, 280);
});

function renderTable() {
    tableBody.textContent = "";

    if (!items.length) {
        const emptyRow = document.createElement("tr");
        emptyRow.className = "empty-state";
        emptyRow.innerHTML = '<td colspan="6">No items yet. Add a requirement to populate the board.</td>';
        tableBody.appendChild(emptyRow);
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const row = document.createElement("tr");
        row.className = item.id === pendingAddedId ? "row-enter" : "";

        row.innerHTML = `
            <td data-label="Item">
                <strong class="item-name">${escapeHtml(item.item)}</strong>
                <span class="item-meta">Tracked requirement</span>
            </td>
            <td data-label="Scope">
                <span class="cell-copy">${escapeHtml(item.scope)}</span>
            </td>
            <td data-label="Status">
                <span class="status-chip ${statusClassName(item.status)}">${escapeHtml(item.status)}</span>
            </td>
            <td data-label="Comments">
                <span class="cell-copy">${escapeHtml(item.comments)}</span>
            </td>
            <td data-label="Release Target">
                <span class="target-pill">${formatReleaseTarget(item.releaseTarget)}</span>
            </td>
            <td data-label="Action">
                <button class="remove-button" type="button" data-remove-id="${item.id}">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 5h6M7 8h10M8 8l1 11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l1-11" />
                    </svg>
                    Remove
                </button>
            </td>
        `;

        fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);
    pendingAddedId = null;
}

function updateMetrics() {
    metricTotal.textContent = items.length;
    metricOnTrack.textContent = countByStatus("On Track");
    metricAtRisk.textContent = countByStatus("At Risk");
    metricBlocked.textContent = countByStatus("Blocked");
}

function countByStatus(status) {
    return items.filter((item) => item.status === status).length;
}

function loadItems() {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return [...seedItems];
        }

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [...seedItems];
    } catch (error) {
        return [...seedItems];
    }
}

function persistItems() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `item-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function formatReleaseTarget(value) {
    if (!value) {
        return "TBD";
    }

    const parsedDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        return escapeHtml(value);
    }

    return parsedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function statusClassName(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
