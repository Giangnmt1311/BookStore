function getSampleUrl (name) {
    if (!name || name === 'undefined' || name.trim() === '') return null;
    if (name.startsWith('http://') || name.startsWith('https://')) {
        return name;
    }
    try {
        const url = new URL(`../assets/samples/${name}`, import.meta.url);
        return url.href;
    } catch {
        return null;
    }
}

export { getSampleUrl };

