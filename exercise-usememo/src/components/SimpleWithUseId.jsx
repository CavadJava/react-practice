import React from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';

function SimpleWithUseId() {
    const [count, setCount] = React.useState(0);

    const componentId= React.useId();
   
    return (
        <div>
            <h2>Simple useMemo Example</h2>
            <div>
                <p className={componentId}>Count 1: {count}</p>
            </div>
        </div>
    );
}

export default SimpleWithUseId;