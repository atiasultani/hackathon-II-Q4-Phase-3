import React from 'react';
import './TaskItem.css';

const TaskItem = ({ task, onToggle, onDelete }) => {
  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          className="task-checkbox"
        />
        <div className="task-text">
          <h3>{task.title}</h3>
          {task.description && <p>{task.description}</p>}
          <div className="task-meta">
            <small>Created: {new Date(task.created_at).toLocaleDateString()}</small>
            {task.completed && (
              <small>Completed: {new Date(task.updated_at).toLocaleDateString()}</small>
            )}
          </div>
        </div>
      </div>
      <div className="task-actions">
        <button onClick={handleDelete} className="delete-btn">
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;