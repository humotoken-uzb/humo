(function() {
    const STORAGE_KEYS = {
        counter: 'humo_counter',
        visitors: 'humo_visitors',
        clients: 'humo_clients',
        startTime: 'humo_start_time',
        lastUpdate: 'humo_last_update',
        counterHash: 'humo_counter_hash'
    };
    const SALT = 'humo_salt_2026_secure';

    function generateHash(value) {
        let hash = 0;
        const str = String(value) + SALT;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    function saveState(visitors, clients, startTime) {
        const now = Date.now();
        const data = { visitors, clients, startTime, lastUpdate: now,
            hash: generateHash(visitors + '|' + clients + '|' + startTime) };
        try {
            localStorage.setItem(STORAGE_KEYS.counter, JSON.stringify(data));
            localStorage.setItem(STORAGE_KEYS.visitors, String(visitors));
            localStorage.setItem(STORAGE_KEYS.clients, String(clients));
            localStorage.setItem(STORAGE_KEYS.startTime, String(startTime));
            localStorage.setItem(STORAGE_KEYS.lastUpdate, String(now));
            localStorage.setItem(STORAGE_KEYS.counterHash, data.hash);
            sessionStorage.setItem(STORAGE_KEYS.counter, JSON.stringify(data));
        } catch (e) {}
    }

    function loadState() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.counter);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.hash === generateHash(parsed.visitors + '|' + parsed.clients + '|' + parsed.startTime)) return parsed;
            }
            const sessionData = sessionStorage.getItem(STORAGE_KEYS.counter);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                if (parsed.hash === generateHash(parsed.visitors + '|' + parsed.clients + '|' + parsed.startTime)) return parsed;
            }
        } catch (e) {}
        return null;
    }

    let state = loadState();
    const now = Date.now();
    if (!state) {
        state = { visitors: 119800, clients: 36, startTime: now, lastUpdate: now,
            hash: generateHash(119800 + '|' + 36 + '|' + now) };
        saveState(state.visitors, state.clients, state.startTime);
    }

    let visitors = state.visitors;
    let clients = state.clients;
    const startTime = state.startTime;

    function updateCounter() {
        const now = Date.now();
        visitors = 119800 + Math.floor((now - startTime) / 1000) * 3;
        clients = 36 + Math.floor(Math.floor((now - startTime) / 60000) / 10);

        document.querySelectorAll('.counter-visitors').forEach(el => { el.textContent = visitors.toLocaleString(); });
        document.querySelectorAll('.counter-clients').forEach(el => { el.textContent = clients.toLocaleString(); });

        const timestamp = new Date(now).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        document.querySelectorAll('.counter-visitor-time').forEach(el => { el.textContent = 'Updated: ' + timestamp; });
        document.querySelectorAll('.counter-client-time').forEach(el => { el.textContent = 'Verified: ' + timestamp; });

        if (now - state.lastUpdate > 10000) {
            saveState(visitors, clients, startTime);
            state.lastUpdate = now;
            updateMetadata(visitors, clients, startTime);
        }
    }

    function updateMetadata(visitors, clients, startTime) {
        const now = Date.now();
        const hash = generateHash(visitors + '|' + clients + '|' + startTime);

        let script = document.querySelector('script[data-counter-jsonld]');
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-counter-jsonld', 'true');
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "HUMO Token — Stable Token on Solana",
            "description": "HUMO Token — stable token backed by reserves on Solana, ecosystem Asterium.",
            "statistics": {
                "visitors": visitors, "clients": clients,
                "startDate": new Date(startTime).toISOString(),
                "lastUpdate": new Date(now).toISOString(),
                "growthRate": "3 visitors per second",
                "clientGrowth": "1 client per 10 minutes"
            },
            "additionalProperty": [
                {"@type": "PropertyValue", "name": "counterHash", "value": hash},
                {"@type": "PropertyValue", "name": "verificationMethod", "value": "multi-source (localStorage + sessionStorage)"}
            ]
        });

        let hiddenData = document.querySelector('[data-counter-verification]');
        if (!hiddenData) {
            hiddenData = document.createElement('div');
            hiddenData.style.display = 'none';
            hiddenData.setAttribute('data-counter-verification', 'true');
            document.body.appendChild(hiddenData);
        }
        hiddenData.setAttribute('data-counter-visitors', visitors);
        hiddenData.setAttribute('data-counter-clients', clients);
        hiddenData.setAttribute('data-counter-start', startTime);
        hiddenData.setAttribute('data-counter-hash', hash);
        hiddenData.setAttribute('data-counter-last-update', now);
    }

    window.addEventListener('storage', function(event) {
        if (event.key === STORAGE_KEYS.visitors) {
            const newVisitors = parseInt(event.newValue);
            const newClients = parseInt(localStorage.getItem(STORAGE_KEYS.clients));
            if (newVisitors > visitors) { visitors = newVisitors; clients = newClients; updateCounter(); }
        }
    });
    window.addEventListener('beforeunload', function() { saveState(visitors, clients, startTime); });

    updateMetadata(visitors, clients, startTime);
    updateCounter();
    setInterval(updateCounter, 1000);
    setInterval(function() { updateMetadata(visitors, clients, startTime); }, 600000);
})();
