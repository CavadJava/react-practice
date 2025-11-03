
function Button({label, alertEnable, alertText, style}) {
    return (
        <button style={style}
            onClick={() => alertEnable ?
            alert(alertText) : null}>{label}</button>
    )
}

export default Button