import React, {Fragment} from "react";
import TaskList from "./TaskList.jsx";

function App() {

    const taskList = [
        {
            id: "1",
            title: "Passing Static Data via Props",
            description: "Create a Greeting component that accepts a name prop and displays a greeting message such as \"Hello, [name]!\"",
        },
        {
            id: "2",
            title: "Passing Multiple Props",
            description: "Create a UserProfile component that accepts name, age, and location props and displays the user's details in a card format.",
        },
        {
            id: "3",
            title: "Passing an Array via Props",
            description: "Create a TaskList component that accepts an array of tasks as a prop and displays each task in an unordered list.",
        }
    ];
    return (
        <Fragment>
            <ul>
                {
                    taskList.map((task) => (
                        <li>
                            <TaskList key={task.id} {...task}/>
                        </li>
                    ))
                }
            </ul>
        </Fragment>
    );
}

export default App;