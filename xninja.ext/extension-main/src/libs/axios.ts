import axios from 'axios';

const axiosApi = axios.create();

if (process.env.NODE_ENV === 'development') {
    axiosApi.defaults.withCredentials = true;
    axiosApi.defaults.headers['xninja-type'] = 'web';
} else {
    axiosApi.interceptors.request.use(async (config) => {
        const { 'xninja-auth_token': authToken } = await chrome.storage.local.get('xninja-auth_token');

        if (authToken) {
            config.headers['xninja-auth_token'] = authToken;
        };

        return config;
    }, (error) => {
        return Promise.reject(error);
    });
};

export default axiosApi;