
const instanceAxTodo = axios.create({
    baseURL: 'http://jsonplaceholder.typicode.com/todos',
    headers: {
        'Access-Control-Allow-Origin': '*'
    },
    timeout: 10000
});

export default instanceAxTodo;