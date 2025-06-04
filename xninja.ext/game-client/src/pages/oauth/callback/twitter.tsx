import { useEffect } from 'react';

const Index = () => {
    useEffect(() => {
        document.body.style.display = 'none';
        const urlParams = new URLSearchParams(window.location.search);
        const tw_id = urlParams.get('tw_id');
        const accessToken = urlParams.get('accessToken');

        if (!tw_id) {
            console.error('Authorization tw_id not found');
            return;
        }

        if (!accessToken) {
            console.error('Authorization accessToken not found');
            return;
        }

        chrome.storage.local.set({ tw_id, 'xninja-auth_token': accessToken }, () => {
            window.location.href = '/';
        });
    }, []);

    return <></>;
};

export default Index;