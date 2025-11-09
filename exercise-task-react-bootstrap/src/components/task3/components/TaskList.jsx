function TaskList({title, description}){
    return (
        <div className="container">
            <div className="card">
                <h1 className="card-title">{title}</h1>
                <p className="card-title">{description}</p>
            </div>
        </div>
    )
}
export default TaskList;