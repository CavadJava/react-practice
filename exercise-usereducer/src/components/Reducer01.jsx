import { useReducer } from "react";
import { Button } from "./Button";

const initialState = { count: 0,isNew: true,title: "My Title" };


function reducer(state, action) {
    console.log("state:", state);
    console.log("action:", action);
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'toggleIsNew':
      return { ...state, isNew: !state.isNew };
    case 'updateTitle':
      return { ...state, title: action.payload };
    case 'reset':
      return initialState;
    default:
      throw new Error();
  }
}

function Reducer01() {

    // step 1
    // const a = useReducer(reducer, initialState);
    // console.log("a:", a);

    // step 2
    const [state,dispatch] = useReducer(reducer, initialState);
   
    const handleIncrement = () => {
        dispatch({ type: 'increment' });
    }
  return (
    <>
    <div className="container">
        <div>Reducer01</div>
        <Button onBtnClick={()=>handleIncrement()}>Increment</Button>
        
    </div>
    </>
  )
}

export default Reducer01;