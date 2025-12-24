
import axios from 'axios';
const instanceAxCard = axios.create({
    baseURL: 'http://localhost:9090/card-service/api/v1/card',
    headers: {
        'Access-Control-Allow-Origin': '*'
    },
    timeout: 10000
});

export default instanceAxCard;