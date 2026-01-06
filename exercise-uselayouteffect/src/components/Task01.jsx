import { useLayoutEffect, useRef } from 'react';

export default function Task01({ task }) {
  const taskRef = useRef(null);

  useLayoutEffect(() => {
    if (taskRef.current) {
      const { width, height } = taskRef.current.getBoundingClientRect();
      console.log(`Task dimensions: ${width} x ${height}`);
    }
  }, [task]);

  return (
    <div ref={taskRef} className="task">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
    </div>
  );
}