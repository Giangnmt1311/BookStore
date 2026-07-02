const ADDRESS_SELECTION_KEY = 'selectedAddressId';

export const getSelectedAddressId = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ADDRESS_SELECTION_KEY);
};

export const setSelectedAddressId = (addressId) => {
    if (typeof window === 'undefined') return;
    if (addressId) {
        localStorage.setItem(ADDRESS_SELECTION_KEY, addressId);
    } else {
        localStorage.removeItem(ADDRESS_SELECTION_KEY);
    }
};

export const clearSelectedAddressId = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADDRESS_SELECTION_KEY);
};

export default ADDRESS_SELECTION_KEY;

