/**
 * A set to track expanded groups on the dashboard.
 */
const expandedGroups = new Set();

/**
 * Toggles the visibility of a group of containers.
 * @param {string} group - The group identifier.
 */
function toggleGroup(group) {
    const el = document.getElementById('group-' + group);
    el.classList.toggle('hidden');
    if (el.classList.contains('hidden')) expandedGroups.delete(group);
    else expandedGroups.add(group);
}

/**
 * Sends a request to start or stop a container.
 * @param {string} id - The container ID.
 * @param {string} action - The action to perform (start/stop).
 */
async function containerAction(id, action) {
    try {
        const res = await fetch(`/api/${action}/${id}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error(await res.text());

        const item = document.querySelector(`.container-item[data-id="${id}"]`);
        const statusEl = item.querySelector('.status');
        const actions = item.querySelector('.container-actions');

        statusEl.textContent = action === 'start' ? 'running' : 'exited';
        statusEl.className = 'status ' + (action === 'start' ? 'running' : 'exited');

        actions.innerHTML = `
      <button onclick="containerAction('${id}', '${action === 'start' ? 'stop' : 'start'}')" title="${action === 'start' ? 'Stop' : 'Start'}">
        <i class="fa fa-${action === 'start' ? 'pause' : 'play'}"></i>
      </button>
      <button onclick="deleteContainer('${id}')" title="Löschen"><i class="fa fa-trash"></i></button>
    `;
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

/**
 * Sends a request to delete a container.
 * @param {string} id - The container ID.
 */
async function deleteContainer(id) {
    if (!confirm('Container wirklich löschen?')) return;
    try {
        const res = await fetch(`/api/delete/${id}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error(await res.text());
        document.querySelector(`.container-item[data-id="${id}"]`).remove();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

/**
 * Sends a request to perform an action on all containers in a group.
 * @param {string} group - The group identifier.
 * @param {string} action - The action to perform (start/stop).
 * @param {HTMLElement} btn - The button element triggering the action.
 */
async function groupAction(group, action, btn) {
    const oldHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/group-action/${group}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action
            })
        });
        if (!res.ok) throw new Error(await res.text());
        location.reload(); // Optional: Refresh the page to update container states
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.innerHTML = oldHTML;
        btn.disabled = false;
    }
}

/**
 * Automatically expands groups based on URL parameters.
 */
const urlParams = new URLSearchParams(window.location.search);
const openGroups = (urlParams.get('open') || '').split(',');
openGroups.forEach(g => {
    if (g) toggleGroup(g);
});