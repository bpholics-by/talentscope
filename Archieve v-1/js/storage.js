const Storage = {

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    load(key) {
        return JSON.parse(localStorage.getItem(key));
    },

    remove(key) {
        localStorage.removeItem(key);
    }

}; // <-- harus ada titik koma

const Participant = {

    save(data) {
        Storage.save("participant", data);
    },

    get() {
        return Storage.load("participant");
    },

    clear() {
        Storage.remove("participant");
    }

};
const TestSession = {

    select(testId) {

        Storage.save("selectedTest", testId);

    },

    getSelected() {

        return Storage.load("selectedTest");

    },

    clearSelected() {

        Storage.remove("selectedTest");

    }

};