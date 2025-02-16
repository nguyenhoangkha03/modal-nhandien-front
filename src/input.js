import { use, useRef, useState } from "react"
import CameraCapture  from './test'
function Input(){
    const inputRef = useRef()
    const [checkState, setCheckState] = useState(false)

    function handleClick(){
        setCheckState(true)
    }

    return(
        <>
            <input 
                ref={inputRef}
                type="text" 
            />
            <button
                onClick={handleClick}
            >Submit</button>
            {checkState && 
                <CameraCapture valueInput={inputRef.current.value} />
            }
        </>
    )
}

export default Input