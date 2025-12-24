import React from 'react';
import { useEffect } from 'react';
import instanceAxTodo from '../helper/instanceAxTodo';
import instanceAxCard from '../../../exercise-useeffect/src/helper/instance.card';

export const useFetchData = (initialUrl,initialData, params) => {
    const [data, setData] = React.useState(initialData);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [url, setUrl] = React.useState(initialUrl);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await instanceAxCard();
                if (response.status !== 200) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.data;
                setData(result);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]);

    return { data, loading, error, setUrl };
}