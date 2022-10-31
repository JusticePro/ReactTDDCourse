const Input = (properties) => {
    const { id, label, onChange, help, inputType} = properties;
    let inputClass = 'form-control';

    if (help)
    {
        inputClass += ' is-invalid';
    }

    return (
        <div className="mb-3">
            <label htmlFor={id} className="form-label">{label}</label>
            <input id={id} onChange={onChange} className={inputClass} type={inputType}></input>
            {help && <span className="invalid-feedback">{help}</span>}
        </div>
    );
}

export default Input;