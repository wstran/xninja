import axios from 'axios';

const axiosApi = axios.create();

axiosApi.defaults.withCredentials = true;
axiosApi.defaults.headers['xninja-type'] = 'web';

export default axiosApi;