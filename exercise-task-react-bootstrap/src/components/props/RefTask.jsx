
function RefTask(){

    const inputRef = useRef();

    function handleClick(){
        console.log(inputRef.current.value);
    }

    return (
        <div>
            <h1>Props Lesson 2</h1>
            <input type="text" ref={inputRef} onFocus={handleClick}/>
            <button onClick={handleClick}>Click</button>
        </div>
    )

}
export default RefTask;