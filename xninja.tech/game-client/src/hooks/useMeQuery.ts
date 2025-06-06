import { SetStateAction, useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';

export type User = {
    id: string;
    name: string;
    username: string;
    type: 'local' | 'twitter';
};

export function useMeQuery() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<User | null>(null);

    useEffect(() => {
        setLoading(true);
        axios
            .get<any, AxiosResponse<User>>(`${import.meta.env.VITE_API_URL}/me`, {
                withCredentials: true,
            })
            .then((v: { data: SetStateAction<User | null> }) => {
                if (v.data) setData(v.data);
            })
            .catch(() => setError('Not Authenticated'))
            .finally(() => setLoading(false));
    }, []);

    return { error, data, loading };
}
