import axios from 'axios';

const axiosApi = axios.create();

axiosApi.interceptors.request.use(async (config) => {
    const { 'xninja-auth_token': authToken } = await chrome.storage.local.get('xninja-auth_token');

    if (authToken) {
        config.headers['xninja-auth_token'] = authToken;
    };

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosApi;