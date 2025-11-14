import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";


function VideoPlayerTask(){
    return (
        <div>
            <iframe className="ms-3 border border-10px" width="560" height="315" src="https://www.youtube.com/embed/IkEuc_V9OZQ?si=A3Cx5MV3wK8wdWf_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
    )
}


export default VideoPlayerTask;