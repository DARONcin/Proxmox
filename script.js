document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const refreshBtn = document.getElementById('refresh-logs');
    const logTypeSelect = document.getElementById('log-type');
    
    // Event listeners
    refreshBtn.addEventListener('click', fetchLogs);
    logTypeSelect.addEventListener('change', fetchLogs);
    
    // Inicializar
    fetchAllData();
    setInterval(fetchAllData, 30000); // Actualizar cada 30 segundos
});

async function fetchAllData() {
    try {
        // Obtener estado general
        const statusResponse = await fetch('/Proxmox/api/status');
        const statusData = await statusResponse.json();
        
        updateStatus('https', statusData.https.status, statusData.https.protocol);
        document.getElementById('https-cert').textContent = statusData.https.certificate || '--';
        
        updateStatus('ssh', statusData.ssh.status, statusData.ssh.last_attempt);
        document.getElementById('ssh-failures').textContent = statusData.ssh.failed_attempts || '0';
        
        updateStatus('oauth', statusData.oauth.status, statusData.oauth.sessions + ' sesiones');
        document.getElementById('oauth-token').textContent = statusData.oauth.token_active ? 'Válido' : 'No válido';
        
        updateStatus('blockchain', statusData.blockchain.status, '#' + statusData.blockchain.last_block);
        document.getElementById('blockchain-nodes').textContent = statusData.blockchain.nodes || '--';
        
        // Protecciones
        updateStatus('xss', statusData.protections.xss ? 'active' : 'inactive');
        updateStatus('sql', statusData.protections.sql_injection ? 'active' : 'inactive');
        updateStatus('fail2ban', statusData.protections.fail2ban ? 'active' : 'inactive');
        updateStatus('sftp', statusData.protections.sftp ? 'active' : 'inactive');
        
        // Estado global
        updateGlobalStatus(statusData.global_status);
        
        // Fecha de actualización
        document.getElementById('last-update').textContent = new Date().toLocaleString();
        
    } catch (error) {
        console.error('Error al obtener datos:', error);
        document.getElementById('global-status').textContent = 'Error de conexión';
        document.getElementById('global-status').style.backgroundColor = 'var(--danger)';
    }
}

async function fetchLogs() {
    try {
        const logType = document.getElementById('log-type').value;
        const response = await fetch(`/Proxmox/api/logs?type=${logType}`);
        const logs = await response.json();
        
        const logsContainer = document.getElementById('event-logs');
        logsContainer.innerHTML = '';
        
        if (logs.length === 0) {
            logsContainer.innerHTML = '<p>No hay registros disponibles</p>';
            return;
        }
        
        logs.forEach(log => {
            const logElement = document.createElement('p');
            logElement.textContent = `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`;
            
            if (log.severity === 'warning') {
                logElement.classList.add('warning');
            } else if (log.severity === 'error') {
                logElement.classList.add('error');
            }
            
            logsContainer.appendChild(logElement);
        });
        
    } catch (error) {
        console.error('Error al obtener registros:', error);
        document.getElementById('event-logs').innerHTML = '<p class="error">Error al cargar registros</p>';
    }
}

function updateStatus(service, status, extra = '') {
    const element = document.getElementById(`${service}-status`);
    if (element) {
        element.textContent = status === 'active' ? 'Activo' : 'Inactivo';
        element.setAttribute('data-status', status);
        
        if (extra) {
            const extraElement = document.getElementById(`${service}-${service === 'ssh' ? 'last' : service === 'blockchain' ? 'last' : 'protocol'}`);
            if (extraElement) extraElement.textContent = extra;
        }
    }
}

function updateGlobalStatus(status) {
    const globalStatus = document.getElementById('global-status');
    
    if (status === 'healthy') {
        globalStatus.textContent = 'Todos los sistemas operativos';
        globalStatus.style.backgroundColor = 'var(--success)';
    } else if (status === 'degraded') {
        globalStatus.textContent = 'Problemas detectados';
        globalStatus.style.backgroundColor = 'var(--warning)';
    } else {
        globalStatus.textContent = 'Estado desconocido';
        globalStatus.style.backgroundColor = 'var(--danger)';
    }
}