import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const timetableService = {
    uploadExcel: async (formData) => {
        const response = await api.post('/timetable/upload-excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    generateTimetables: async (configId, preferences) => {
        const response = await api.post('/timetable/generate', {
            semesterConfigId: configId,
            preferences,
        });
        return response.data;
    },

    getUserTimetables: async (userId) => {
        const response = await api.get(`/timetable/${userId}`);
        return response.data;
    },

    getConfig: async (configId) => {
        const response = await api.get(`/timetable/config/${configId}`);
        return response.data;
    },

    deleteConfig: async (configId) => {
        const response = await api.get(`/timetable/config/${configId}`, {
            method: 'DELETE',
        });
        return response.data;
    },
};

export default api;
