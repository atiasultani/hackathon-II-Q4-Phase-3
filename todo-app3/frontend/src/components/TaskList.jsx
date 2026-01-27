import React, { useState, useEffect } from 'react';
import TaskItem from './TaskItem';
import { updateTask, deleteTask as deleteTaskApi } from '../services/api_client';
import './TaskList.css';

const TaskList = ({ tasks, setTasks }) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    let filtered = tasks;

    switch (filter) {
      case 'active':
        filtered = tasks.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = tasks.filter(task => task.completed);
        break;
      default:
        filtered = tasks;
    }

    setFilteredTasks(filtered);
  }, [tasks, filter]);

  const toggleTaskCompletion = async (taskId) => {
    try {
      const currentTask = tasks.find(t => t.id === taskId);
      const updatedTask = await updateTask(taskId, {
        completed: !currentTask?.completed
      });

      setTasks(prev => prev.map(task =>
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteTaskApi(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="task-list-container">
      <div className="task-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <p className="no-tasks">No tasks found. Add some tasks through the chat!</p>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTaskCompletion}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;