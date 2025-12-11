// Supabase REST API wrapper and Realtime connection manager
class SupabaseClient {
    constructor() {
        // Get Supabase config from config.js or use defaults
        this.supabaseUrl = (typeof config !== 'undefined' && config.SUPABASE_URL) || 
                          window.SUPABASE_URL || 
                          'https://zihmxkuwkyqcwqrjbgoo.supabase.co';
        this.supabaseKey = (typeof config !== 'undefined' && config.SUPABASE_KEY) || 
                          window.SUPABASE_KEY || 
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaG14a3V3a3lxY3dxcmpiZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTYzMDcsImV4cCI6MjA4MTAzMjMwN30.RyR5KRDAfL29rQGJ5V2fl6Dr0FyLJhyPUPeymCN8TV8';
        
        this.realtimeSubscriptions = new Map();
        this.realtimeEnabled = false;
        this.connectionState = 'disconnected';
    }

    // REST API helper function
    async request(endpoint, options = {}) {
        const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
        const headers = {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase API error: ${response.status} ${errorText}`);
            }

            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                return text ? JSON.parse(text) : null;
            }
            return null;
        } catch (error) {
            console.error('Supabase request error:', error);
            throw error;
        }
    }

    // GET request
    async get(table, query = '') {
        return this.request(`${table}${query ? '?' + query : ''}`, {
            method: 'GET'
        });
    }

    // POST request
    async post(table, data) {
        return this.request(table, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PATCH request
    async patch(table, data, filter = '') {
        return this.request(`${table}${filter ? '?' + filter : ''}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(table, filter = '') {
        return this.request(`${table}${filter ? '?' + filter : ''}`, {
            method: 'DELETE'
        });
    }

    // Realtime subscription setup
    subscribe(table, event, callback) {
        const channelName = `${table}:${event}`;
        
        // For now, we'll use polling as fallback
        // Supabase Realtime requires WebSocket support and additional setup
        // This is a placeholder for future Realtime implementation
        console.log(`Realtime subscription requested for ${channelName}`);
        
        // Store subscription for cleanup
        if (!this.realtimeSubscriptions.has(channelName)) {
            this.realtimeSubscriptions.set(channelName, { table, event, callback });
        }
    }

    // Unsubscribe from Realtime
    unsubscribe(table, event) {
        const channelName = `${table}:${event}`;
        this.realtimeSubscriptions.delete(channelName);
    }

    // Cleanup all subscriptions
    cleanup() {
        this.realtimeSubscriptions.clear();
    }

    // Check connection state
    getConnectionState() {
        return this.connectionState;
    }
}

// Export singleton instance
const supabaseClient = new SupabaseClient();

