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

/**
 * Fetches the CPU usage for a specific container and updates the UI.
 * @param {string} containerId - The ID of the container.
 */
async function fetchCpuUsage(containerId) {
    try {
        const res = await fetch(`/api/cpu-usage/${containerId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById(`cpu-usage-${containerId}`).textContent = `${data.cpuUsage}%`;
    } catch (err) {
        document.getElementById(`cpu-usage-${containerId}`).textContent = 'Error';
    }
}

/**
 * Fetches the RAM usage for a specific container and updates the UI.
 * Displays the usage in MB.
 * @param {string} containerId - The ID of the container.
 */
async function fetchRamUsage(containerId) {
    try {
        const res = await fetch(`/api/ram-usage/${containerId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById(`ram-usage-${containerId}`).textContent = `${data.memoryUsage} MB / ${data.memoryLimit} MB`;
    } catch (err) {
        document.getElementById(`ram-usage-${containerId}`).textContent = 'Error';
    }
}

/**
 * Fetches the network information for a specific container and updates the UI.
 * @param {string} containerId - The ID of the container.
 */
async function fetchNetworkInfo(containerId) {
    try {
        const res = await fetch(`/api/network-info/${containerId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        const networkInfoEl = document.getElementById(`network-info-${containerId}`);
        networkInfoEl.innerHTML = '';

        for (const [networkName, networkDetails] of Object.entries(data.networkInfo)) {
            const listItem = document.createElement('li');
            listItem.textContent = `${networkName}: IP ${networkDetails.IPAddress || 'N/A'}`;
            networkInfoEl.appendChild(listItem);
        }
    } catch (err) {
        const networkInfoEl = document.getElementById(`network-info-${containerId}`);
        networkInfoEl.innerHTML = '<li>Error loading network info</li>';
    }
}

/**
 * Event listener to initialize fetching of CPU, RAM, and network usage for all containers on page load.
 */
document.addEventListener('DOMContentLoaded', () => {
    const containerElements = document.querySelectorAll('[data-id]');
    containerElements.forEach(el => {
        const containerId = el.getAttribute('data-id');
        fetchCpuUsage(containerId);
        fetchRamUsage(containerId);
        fetchNetworkInfo(containerId);
    });
});