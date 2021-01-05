import React from "react";
import "./TaskBoard.scss";

type TaskState = "open" | "done";
type Task = {
  id: string;
  title: string;
  state: TaskState;
};
const taskData: Task[] = [
  {
    id: "t1",
    title: "Create API",
    state: "open",
  },
  {
    id: "t3",
    title: "Collect requirements",
    state: "done",
  },
  { id: "t2", title: "Generate API client", state: "open" },
  { id: "t4", title: "Create app mockups", state: "open" },
];

export function TaskBoard() {
  const [tasks, setTasks] = React.useState(() => taskData);
  const dragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("Drag START", e);
    const taskId = (e.target as HTMLDivElement).getAttribute("data-task-id");
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLDivElement).classList.add("task_away");
  };
  const dragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("Drag END", e);
    (e.target as HTMLDivElement).classList.remove("task_away");
  };
  const dragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLDivElement;
    const dropezone = target.closest(".tasks");
    dropezone?.classList.add("tasks_dropable");
    console.log("Drag Enter", { dropezone, target });
  };
  const dragover = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const dragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log("Drag Leave", e);
    (e.target as HTMLDivElement).classList.remove("tasks_dropable");
  };
  const drop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.target as HTMLDivElement;
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t.id === taskId);
    const stateToSet = target.classList.contains("tasks_done")
      ? "done"
      : "open";
    console.log("DROP.", { target, taskId, task, stateToSet });
    if (task) {
      task.state = stateToSet;
      setTasks([...tasks.filter((t) => t.id !== task.id), task]);
    }

    target.classList.remove("tasks_dropable");
  };

  return (
    <div className="App">
      <div className="task-board">
        <div
          className="tasks tasks_open"
          onDragStartCapture={dragStart}
          onDragEndCapture={dragEnd}
          onDragOver={dragover}
          onDrop={drop}
          onDragLeave={dragLeave}
          onDragEnter={dragEnter}
        >
          {tasks
            .filter((t) => t.state === "open")
            .map((task) => (
              <div
                className="task task_open"
                key={task.id}
                draggable
                data-task-id={task.id}
              >
                {task.title}
              </div>
            ))}
        </div>
        <div
          className="tasks tasks_done"
          onDragStartCapture={dragStart}
          onDragEndCapture={dragEnd}
          onDragOver={dragover}
          onDrop={drop}
          onDragLeave={dragLeave}
          onDragEnter={dragEnter}
        >
          {tasks
            .filter((t) => t.state === "done")
            .map((task) => (
              <div
                className="task task_done"
                key={task.id}
                draggable
                data-task-id={task.id}
              >
                {task.title}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
