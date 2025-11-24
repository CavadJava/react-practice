import React, { useState } from 'react';

function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if(input.trim()) {
      setTasks([...tasks, {text: input, completed: false}]);
      setInput('');
    }
  };

  const toggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
  };

  return (
    <div style={{
      background: '#1d1f27',
      minHeight: '100vh',
      padding: '40px 24px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#fff',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      <h1 style={{fontWeight: '700', fontSize: '28px', marginBottom: '20px', borderBottom: '2px solid #3366ff', paddingBottom: '8px'}}>
        Todo List
      </h1>

      <div style={{display: 'flex', marginBottom: '24px'}}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Add new task" 
          style={{
            flex: 1,
            padding: '14px 18px',
            fontSize: '16px',
            borderRadius: '6px 0 0 6px',
            border: 'none',
            outline: 'none',
            background: '#292b35',
            color: '#eee'
          }} 
        />
        <button 
          onClick={addTask}
          style={{
            backgroundColor: '#3366ff',
            color: '#fff',
            border: 'none',
            borderRadius: '0 6px 6px 0',
            padding: '14px 22px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          Add
        </button>
      </div>

      <div>
        {tasks.map((task, idx) => (
          <div 
            key={idx} 
            onClick={() => toggleTask(idx)}
            style={{
              background: '#292b35',
              padding: '18px 24px',
              marginTop: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.6 : 1,
              fontWeight: task.completed ? '400' : '700',
              transition: 'background-color 0.3s, opacity 0.3s'
            }}
          >
            {task.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodoList;
