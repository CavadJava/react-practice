import axios from 'axios';
const instanceAxTodoGet = axios.create({
    baseURL: 'http://jsonplaceholder.typicode.com/todos',
    headers: {
        'Access-Control-Allow-Origin': '*'
    },
    timeout: 10000
});

export default instanceAxTodo;