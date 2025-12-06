import {useId, useState} from "react";

function StudentList() {

    const [selectedStudent, setSelectedStudent] = useState([])

    const students = [
        {id: 1, name: 'Alice'},
        {id: 2, name: 'Bob'},
        {id: 3, name: 'Charlie'},
        {id: 4, name: 'Diana'},
        {id: 1, name: 'Alice'},
        {id: 2, name: 'Bob'},
        {id: 3, name: 'Charlie'},
        {id: 4, name: 'Diana'},
        {id: 1, name: 'Alice'},
        {id: 2, name: 'Bob'},
        {id: 3, name: 'Charlie'},
        {id: 4, name: 'Diana'}
    ];

    function handleCheckboxChange(student) {
        setSelectedStudent(
            (prevState) => prevState.includes(student.name)
                ? prevState.filter((name) => name !== student.name)
                : [...prevState, student.name]
        )
        console.log(student)
    }
    console.log(selectedStudent)

    return (
        <>
            <div className="container">

                {
                    students.map((student) => {
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const id = useId();
                        console.log(id)
                        return (
                            <div className="student" key={student.id}>
                                <input type="checkbox" id={useId()} value={student.name}

                                       checked={selectedStudent.includes(student.name)}

                                       onChange={() => {
                                           handleCheckboxChange(student)
                                       }}/>
                                <label>{student.name}</label>
                            </div>
                        )
                    })
                }

            </div>
        </>
    )
}

export default StudentList