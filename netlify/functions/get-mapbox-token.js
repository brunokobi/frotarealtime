exports.handler = async () => {
    const token = process.env.VITE_MAPBOX_TOKEN;
    if (!token) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'VITE_MAPBOX_TOKEN não configurado' })
        };
    }
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        body: JSON.stringify({ token })
    };
};
