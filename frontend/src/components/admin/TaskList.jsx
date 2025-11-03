import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Form, Pagination } from "react-bootstrap";
import { CalendarCheck, PeopleFill } from "react-bootstrap-icons";
import { updateTaskStatus } from "../../services/taskService";
import { showSuccess, showError } from "../../utils/notificationService";

const formatDueDate = (dateString) => {
  if (!dateString) {
    return <span className="text-muted">No due date</span>;
  }
  const dueDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isOverdue = dueDate < now;
  const dateOptions = { year: "numeric", month: "short", day: "numeric" };
  return (
    <span className={`due-date ${isOverdue ? "overdue" : ""}`}>
      <CalendarCheck />
      {dueDate.toLocaleDateString(undefined, dateOptions)}
    </span>
  );
};

const TaskList = ({ tasks, title = "My Tasks" }) => {
  const [taskList, setTaskList] = useState(tasks || []);

  // --- NEW: State for Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 5; // You can adjust this number

  useEffect(() => {
    setTaskList(tasks || []);
    setCurrentPage(1); // Reset to first page when tasks change
  }, [tasks]);

  // --- NEW: Sorting Logic ---
  // Memoize the sorted list to prevent re-sorting on every render
  const sortedTasks = useMemo(() => {
    return [...taskList].sort((a, b) => {
      // Completed tasks go to the bottom
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;
      // Otherwise, maintain original order (which is newest first from the API)
      return 0;
    });
  }, [taskList]);

  // --- NEW: Pagination Calculations ---
  const indexOfLastTask = currentPage * TASKS_PER_PAGE;
  const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE;
  const currentTasks = sortedTasks.slice(indexOfFirstTask, indexOfLastTask);
  const pageCount = Math.ceil(sortedTasks.length / TASKS_PER_PAGE);

  const handleCompleteTask = async (taskId) => {
    const originalTasks = [...taskList];
    try {
      setTaskList((currentTasks) =>
        currentTasks.map((t) =>
          t.id === taskId ? { ...t, status: "Completed" } : t
        )
      );
      await updateTaskStatus(taskId, "Completed");
      showSuccess("Task marked as complete!");
    } catch (err) {
      showError("Failed to update task. Please try again.");
      setTaskList(originalTasks);
    }
  };

  const renderPagination = () => {
    if (pageCount <= 1) return null;
    return (
      <div className="pagination-controls">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="page-info">
          Page {currentPage} of {pageCount}
        </span>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === pageCount}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <Card className="content-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          {title} ({taskList ? taskList.length : 0})
        </h5>
      </Card.Header>
      <Card.Body>
        {!taskList || taskList.length === 0 ? (
          <p className="text-muted mb-0">No tasks assigned at the moment.</p>
        ) : (
          <div className="modern-task-list">
            {currentTasks.map((task) => {
              const assignees = [
                ...task.assigned_department_names,
                ...task.assigned_staff_names,
              ].filter(Boolean);

              const isCompleted = task.status === "Completed";

              return (
                <div
                  className={`task-item ${isCompleted ? "completed" : ""}`}
                  key={task.id}
                >
                  <Form.Check
                    type="checkbox"
                    id={`task-check-${task.id}`}
                    className="task-checkbox"
                    checked={isCompleted}
                    disabled={isCompleted}
                    onChange={() => handleCompleteTask(task.id)}
                    // --- NEW: Descriptive labels for accessibility and tooltips ---
                    title={
                      isCompleted ? "Task is complete" : "Mark task as complete"
                    }
                    aria-label={`Mark task "${task.title}" as complete`}
                  />
                  <div className="task-item-main">
                    <p className="task-title">{task.title}</p>
                    <div className="task-meta">
                      {formatDueDate(task.due_date)}
                      {assignees.length > 0 && (
                        <span className="task-assignees">
                          <PeopleFill />
                          {assignees.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-item-actions">
                    {task.lead_secure_token && (
                      <Button
                        as={Link}
                        to={`/admin/admissions/leads/${task.lead_secure_token}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        View Lead
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
      {pageCount > 1 && <Card.Footer>{renderPagination()}</Card.Footer>}
    </Card>
  );
};

export default TaskList;
