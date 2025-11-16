import { useState,useRef, useEffect} from "react"
import RefTask from "./RefTask";
import HoverTask from "./HoverTask";
import ShowTextTask from "./ShowTextTask";
import VideoPlayerTask from "./VideoPlayerTask";
import TimeoutTask from "./TimoutTask";
import HideItemOnClick from "./HideItemOnClick";
import HideItemsOnClick from "./HideItemsOnClick";
import HideItems from "./hideitems/HideItems";
import ChangeTextOnTime from "./changetextbaseontime/ChangeTextOnTime";
import ToggleColor from "./changecolor/ToggleColor";
import ChangeVisiblity from "./changevisible/ChangeVisiblity";

function Task(){
    return ChangeVisiblity();
}

export default Task