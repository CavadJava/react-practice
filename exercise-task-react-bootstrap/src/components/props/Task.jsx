import { useState,useRef, useEffect} from "react"
import RefTask from "./RefTask";
import HoverTask from "./HoverTask";
import ShowTextTask from "./ShowTextTask";
import VideoPlayerTask from "./VideoPlayerTask";
import TimeoutTask from "./TimoutTask";
import HideItemOnClick from "./HideItemOnClick";
import HideItemsOnClick from "./HideItemsOnClick";

function Task(){
    return HideItemsOnClick();
}

export default Task