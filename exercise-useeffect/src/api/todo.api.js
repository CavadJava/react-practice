import {instanceAxiosCard} from '../helper/instance.card';

export const getAllTodos = async () => {
    try {
        const response = await instanceAxiosCard.get('/');
        return response.data;
    } catch (error) {
        console.error('Error fetching todos:', error);
        throw error;
    }
}
export const getTodoById = async (id) => {
    try {
        const response = await instanceAxiosCard.get(`/card-id/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching todo with id ${id}:`, error);
        throw error;
    }
}
export const createTodo = async (todoData) => {
    try {
        const response = await instanceAxiosCard.post('/', todoData);
        return response.data;
    } catch (error) {
        console.error('Error creating todo:', error);
        throw error;
    }
}
export const updateTodo = async (id, todoData) => {
    try {
        const response = await instanceAxiosCard.put(`/card-id/${id}`, todoData);
        return response.data;
    } catch (error) {
        console.error(`Error updating todo with id ${id}:`, error);
        throw error;
    }
}
export const deleteTodo = async (id) => {
    try {
        const response = await instanceAxiosCard.delete(`/card-id/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting todo with id ${id}:`, error);
        throw error;
    }
}               
export const deleteAllTodos = async () => {
    try {
        const response = await instanceAxiosCard.delete('/');
        return response.data;
    } catch (error) {
        console.error('Error deleting all todos:', error);
        throw error;
    }
}

