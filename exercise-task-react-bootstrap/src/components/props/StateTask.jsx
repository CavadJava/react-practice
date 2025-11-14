
function StateTask(){
    const [count,setCount] = useState(0);
    
    
    function handleIncrease(){
        setCount(count + 1);
    }

    function handleDecrease(){
        setCount(count - 1);
    }

    return (
        <div>
            <h1>Props Lesson 1</h1>
            <button onClick={handleDecrease}>-</button>
            <span>{count}</span>
            <button onClick={handleIncrease}>+</button>
        </div>
    )
}
export default StateTask;