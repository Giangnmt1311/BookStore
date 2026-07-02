function getAudioUrl (name) {
    if (!name || name === 'undefined' || name.trim() === '') return null;
    if (name.startsWith('http://') || name.startsWith('https://')) {
        return name;
    }
    return null;
}

export { getAudioUrl };

